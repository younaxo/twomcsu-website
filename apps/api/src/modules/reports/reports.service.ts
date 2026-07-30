import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  NotificationType,
  PunishmentType as PrismaPunishmentType,
  ReportStatus as PrismaReportStatus,
  ReportType as PrismaReportType,
  RoleGroup,
} from '@prisma/client';
import { randomBytes } from 'node:crypto';
import {
  REPORT_RULES_SLUGS,
  REPORT_STATUS_LABELS,
  REPORT_TYPE_LABELS,
  ReportBanInfo,
  ReportDetails,
  ReportListResponse,
  ReportStats,
  ReportStatus,
  ReportType,
  TopicDetails,
  detectEvidenceLinkType,
  hasRoleGroup,
  PUNISHMENT_TYPE_LABELS,
} from '@twomc/shared';
import { CaptchaService } from '../auth/captcha.service';
import { MarkdownService } from '../comments/markdown.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { toTopicDetails } from '../topics/topic.mapper';
import { canReviewReportType, isStaffRole, minRoleForReportType } from './report-access.util';
import { reportUserSelect, toReportDetails, toReportSummary } from './report.mapper';
import {
  AddReportMessageDto,
  AssignReportDto,
  BanReportsDto,
  ChangeReportStatusDto,
  CreateDonationProblemDto,
  CreateReportDto,
  ListReportsQueryDto,
  LockReportDto,
  PunishReportDto,
  SetVerdictDto,
} from './dto/reports.dto';
import { ReportsAttachmentsService } from './reports-attachments.service';
import { ReportsPunishmentsService } from './reports-punishments.service';

const DAILY_LIMIT = 3;
const INCIDENT_MAX_AGE_MS = 72 * 60 * 60 * 1000;
const DUPLICATE_WINDOW_MS = 72 * 60 * 60 * 1000;

const targetInclude = {
  orderBy: { order: 'asc' as const },
  include: { user: { select: reportUserSelect } },
} as const;

const reportInclude = {
  author: { select: reportUserSelect },
  assignedTo: { select: reportUserSelect },
  targets: targetInclude,
} as const;

const reportDetailInclude = {
  ...reportInclude,
  evidenceLinks: { orderBy: { order: 'asc' as const } },
  messages: {
    orderBy: { createdAt: 'asc' as const },
    include: { author: { select: reportUserSelect } },
  },
  attachments: { orderBy: { createdAt: 'asc' as const } },
  appealedPunishment: {
    include: { issuedByUser: { select: reportUserSelect } },
  },
} as const;

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly markdown: MarkdownService,
    private readonly notifications: NotificationsService,
    private readonly captcha: CaptchaService,
    private readonly attachments: ReportsAttachmentsService,
    private readonly punishments: ReportsPunishmentsService,
  ) {}

  async createReport(
    authorId: string,
    dto: CreateReportDto,
    ip?: string,
  ): Promise<ReportDetails> {
    if (dto.type === ReportType.DONATION_PROBLEM) {
      throw new BadRequestException('Проблемы с донатом оформляются через /support');
    }

    await this.captcha.verify(dto.captchaToken, ip);
    await this.assertCanCreate(authorId);
    this.validateCreateDto(dto);

    const targetsInput = dto.targets ?? [];
    const resolvedTargets = await Promise.all(
      targetsInput.map(async (target, index) => {
        const user = await this.prisma.user.findUnique({
          where: { username: target.username },
          select: { id: true, username: true },
        });
        return {
          username: user?.username ?? target.username,
          userId: user?.id ?? null,
          order: target.order ?? index,
        };
      }),
    );

    if (
      dto.type === ReportType.PLAYER_COMPLAINT ||
      dto.type === ReportType.ADMIN_COMPLAINT
    ) {
      for (const target of resolvedTargets) {
        await this.assertNoDuplicate(authorId, target.username, dto.type);
      }
    }

    let appealedPunishment: Awaited<
      ReturnType<ReportsPunishmentsService['requireAppealableForUser']>
    > | null = null;

    if (dto.type === ReportType.PUNISHMENT_APPEAL) {
      appealedPunishment = await this.punishments.requireAppealableForUser(
        dto.appealedPunishmentId!,
        authorId,
      );
    }

    const reportNumber = await this.generateReportNumber();
    const descriptionHtml = this.markdown.render(dto.description);
    const evidenceLinksInput = dto.evidenceLinks ?? [];

    const row = await this.prisma.report.create({
      data: {
        reportNumber,
        type: dto.type as PrismaReportType,
        authorId,
        server: dto.server ?? null,
        incidentDate: dto.incidentDate ? new Date(dto.incidentDate) : null,
        description: dto.description,
        descriptionHtml,
        additionalText: dto.additionalText ?? null,
        appealedPunishmentId:
          dto.type === ReportType.PUNISHMENT_APPEAL ? dto.appealedPunishmentId! : null,
        targets: {
          create: resolvedTargets.map((target) => ({
            username: target.username,
            userId: target.userId,
            order: target.order,
          })),
        },
        evidenceLinks: {
          create: evidenceLinksInput.map((link, index) => ({
            url: link.url,
            title: link.title ?? null,
            type: detectEvidenceLinkType(link.url),
            order: link.order ?? index,
          })),
        },
      },
      include: reportDetailInclude,
    });

    if (appealedPunishment?.issuedBy) {
      await this.notifications.createNotification({
        userId: appealedPunishment.issuedBy,
        type: NotificationType.SYSTEM,
        title: `Обжалование наказания по обращению ${row.reportNumber}`,
        message: 'Игрок подал обжалование на выданное наказание',
        link: `/moderation/reports/${row.reportNumber}`,
        fromUserId: authorId,
      });
    }

    await this.notifyStaffAboutNewReport(row.reportNumber, row.type as ReportType, authorId);

    return toReportDetails(row, { includeInternal: false });
  }

  async createDonationProblem(
    authorId: string,
    dto: CreateDonationProblemDto,
    ip?: string,
  ): Promise<ReportDetails> {
    await this.captcha.verify(dto.captchaToken, ip);
    await this.assertCanCreate(authorId);

    const reportNumber = await this.generateReportNumber();
    const descriptionHtml = this.markdown.render(dto.description);

    const row = await this.prisma.report.create({
      data: {
        reportNumber,
        type: PrismaReportType.DONATION_PROBLEM,
        authorId,
        server: dto.server,
        description: dto.description,
        descriptionHtml,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        paymentDate: new Date(dto.paymentDate),
        additionalText: dto.additionalText ?? null,
      },
      include: reportDetailInclude,
    });

    await this.notifyStaffAboutNewReport(row.reportNumber, ReportType.DONATION_PROBLEM, authorId);

    return toReportDetails(row, { includeInternal: false });
  }

  async listMine(
    userId: string,
    roleGroup: RoleGroup,
    query: ListReportsQueryDto,
  ): Promise<ReportListResponse> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 20));
    const where = this.buildListWhere(query, {
      OR: [
        { authorId: userId },
        ...(isStaffRole(roleGroup) ? [{ assignedToId: userId }] : []),
      ],
    });

    // Hide donation problems from non-owners even if somehow assigned
    if (!hasRoleGroup(roleGroup, RoleGroup.OWNER)) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
        {
          OR: [
            { type: { not: PrismaReportType.DONATION_PROBLEM } },
            { authorId: userId },
          ],
        },
      ];
    }

    return this.paginate(where, page, limit);
  }

  async listModeration(
    roleGroup: RoleGroup,
    query: ListReportsQueryDto,
    viewerId: string,
  ): Promise<ReportListResponse> {
    if (!isStaffRole(roleGroup)) {
      throw new ForbiddenException();
    }

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 20));
    const allowedTypes = (Object.values(ReportType) as ReportType[]).filter((type) =>
      canReviewReportType(roleGroup, type),
    );

    const where = this.buildListWhere(query, {
      type: { in: allowedTypes as PrismaReportType[] },
    });

    if (query.assigned === 'me') {
      where.assignedToId = viewerId;
    } else if (query.assigned === 'free') {
      where.assignedToId = null;
    }

    return this.paginate(where, page, limit);
  }

  async listDonations(query: ListReportsQueryDto): Promise<ReportListResponse> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 20));
    const where = this.buildListWhere(query, {
      type: PrismaReportType.DONATION_PROBLEM,
    });
    return this.paginate(where, page, limit);
  }

  async getByNumber(
    reportNumber: string,
    viewerId: string,
    roleGroup: RoleGroup,
  ): Promise<ReportDetails> {
    const row = await this.requireReport(reportNumber);
    this.assertCanView(row, viewerId, roleGroup);
    const includeInternal = canReviewReportType(roleGroup, row.type as ReportType);
    return toReportDetails(row, { includeInternal });
  }

  async addMessage(
    reportNumber: string,
    authorId: string,
    roleGroup: RoleGroup,
    dto: AddReportMessageDto,
  ): Promise<ReportDetails> {
    const row = await this.requireReport(reportNumber);
    this.assertCanView(row, authorId, roleGroup);

    if (row.isLocked) {
      throw new BadRequestException('Обращение заблокировано');
    }

    const isStaff = canReviewReportType(roleGroup, row.type as ReportType);
    const isAuthor = row.authorId === authorId;

    if (!isAuthor && !isStaff) {
      throw new ForbiddenException();
    }

    if (dto.isInternal && !isStaff) {
      throw new ForbiddenException('Внутренние заметки доступны только модераторам');
    }

    const contentHtml = this.markdown.render(dto.content);

    await this.prisma.reportMessage.create({
      data: {
        reportId: row.id,
        authorId,
        content: dto.content,
        contentHtml,
        isStaff,
        isInternal: Boolean(dto.isInternal) && isStaff,
      },
    });

    if (isStaff && !dto.isInternal && row.authorId !== authorId) {
      await this.notifications.createNotification({
        userId: row.authorId,
        type: NotificationType.SYSTEM,
        title: `Новый ответ по обращению ${row.reportNumber}`,
        message: 'Модератор ответил на ваше обращение',
        link: `/report/${row.reportNumber}`,
        fromUserId: authorId,
      });
    }

    return this.getByNumber(reportNumber, authorId, roleGroup);
  }

  async uploadAttachment(
    reportNumber: string,
    userId: string,
    roleGroup: RoleGroup,
    file: Express.Multer.File,
    pdfOnly = false,
  ) {
    const row = await this.requireReport(reportNumber);
    this.assertCanView(row, userId, roleGroup);

    if (row.isLocked) {
      throw new BadRequestException('Обращение заблокировано');
    }

    const isStaff = canReviewReportType(roleGroup, row.type as ReportType);
    if (row.authorId !== userId && !isStaff) {
      throw new ForbiddenException();
    }

    return this.attachments.saveAttachment(row.id, file, userId, { pdfOnly });
  }

  async getRules(type: ReportType): Promise<TopicDetails | null> {
    if (type === ReportType.DONATION_PROBLEM) {
      return null;
    }

    const slug = REPORT_RULES_SLUGS[type];
    const row = await this.prisma.topic.findFirst({
      where: { slug, category: 'RULES', isActive: true },
      include: { attachments: true },
    });

    return row ? toTopicDetails(row) : null;
  }

  async assign(
    reportNumber: string,
    actorId: string,
    roleGroup: RoleGroup,
    dto: AssignReportDto,
  ): Promise<ReportDetails> {
    const row = await this.requireReport(reportNumber);
    this.assertCanModerate(row, roleGroup);

    const assigneeId = dto.userId === undefined ? actorId : dto.userId;

    if (assigneeId) {
      const assignee = await this.prisma.user.findUnique({
        where: { id: assigneeId },
        select: { id: true, roleGroup: true },
      });
      if (!assignee || !canReviewReportType(assignee.roleGroup, row.type as ReportType)) {
        throw new BadRequestException('Нельзя назначить этого пользователя');
      }
    }

    await this.prisma.report.update({
      where: { id: row.id },
      data: { assignedToId: assigneeId },
    });

    await this.addSystemMessage(
      row.id,
      actorId,
      assigneeId
        ? assigneeId === actorId
          ? 'Модератор взял обращение в работу'
          : 'Обращение передано другому модератору'
        : 'Назначение с обращения снято',
    );

    if (row.status === PrismaReportStatus.PENDING && assigneeId) {
      await this.prisma.report.update({
        where: { id: row.id },
        data: { status: PrismaReportStatus.IN_REVIEW },
      });
      await this.notifyStatusChange(row.reportNumber, row.authorId, ReportStatus.IN_REVIEW);
    }

    return this.getByNumber(reportNumber, actorId, roleGroup);
  }

  async changeStatus(
    reportNumber: string,
    actorId: string,
    roleGroup: RoleGroup,
    dto: ChangeReportStatusDto,
  ): Promise<ReportDetails> {
    const row = await this.requireReport(reportNumber);
    this.assertCanModerate(row, roleGroup);

    const resolvedAt =
      dto.status === ReportStatus.RESOLVED ||
      dto.status === ReportStatus.REJECTED ||
      dto.status === ReportStatus.CLOSED
        ? new Date()
        : null;

    await this.prisma.report.update({
      where: { id: row.id },
      data: {
        status: dto.status as PrismaReportStatus,
        resolvedAt,
      },
    });

    await this.addSystemMessage(
      row.id,
      actorId,
      `Статус изменён на «${REPORT_STATUS_LABELS[dto.status]}»`,
    );
    await this.notifyStatusChange(row.reportNumber, row.authorId, dto.status);

    return this.getByNumber(reportNumber, actorId, roleGroup);
  }

  async setVerdict(
    reportNumber: string,
    actorId: string,
    roleGroup: RoleGroup,
    dto: SetVerdictDto,
  ): Promise<ReportDetails> {
    const row = await this.requireReport(reportNumber);
    this.assertCanModerate(row, roleGroup);

    const verdictHtml = this.markdown.render(dto.verdict);

    await this.prisma.report.update({
      where: { id: row.id },
      data: {
        verdict: dto.verdict,
        verdictHtml,
        status: PrismaReportStatus.RESOLVED,
        resolvedAt: new Date(),
        assignedToId: row.assignedToId ?? actorId,
      },
    });

    await this.addSystemMessage(row.id, actorId, 'Вынесен вердикт. Статус: «Рассмотрено»');
    await this.notifyStatusChange(row.reportNumber, row.authorId, ReportStatus.RESOLVED);

    await this.notifications.createNotification({
      userId: row.authorId,
      type: NotificationType.SYSTEM,
      title: `Вердикт по обращению ${row.reportNumber}`,
      message: dto.verdict.slice(0, 200),
      link: `/report/${row.reportNumber}`,
      fromUserId: actorId,
    });

    return this.getByNumber(reportNumber, actorId, roleGroup);
  }

  async punish(
    reportNumber: string,
    actorId: string,
    roleGroup: RoleGroup,
    dto: PunishReportDto,
  ): Promise<ReportDetails> {
    const row = await this.requireReport(reportNumber);
    this.assertCanModerate(row, roleGroup);

    if (row.type !== PrismaReportType.PLAYER_COMPLAINT) {
      throw new BadRequestException('Наказание доступно только для жалоб на игроков');
    }

    const targetUsername = dto.targetUsername.trim();
    const matchedTarget = row.targets.find(
      (target) => target.username.toLowerCase() === targetUsername.toLowerCase(),
    );

    if (!matchedTarget) {
      throw new BadRequestException('Указанный игрок не является целью этого обращения');
    }

    await this.punishments.createFromReport({
      targetUsername: matchedTarget.username,
      actorId,
      punishmentType: dto.punishmentType as PrismaPunishmentType,
      duration: dto.duration ?? null,
      reason: dto.reason,
      server: row.server,
      reportNumber: row.reportNumber,
    });

    await this.prisma.report.update({
      where: { id: row.id },
      data: {
        punishmentType: dto.punishmentType,
        punishmentDuration: dto.duration ?? null,
        punishmentReason: dto.reason,
        assignedToId: row.assignedToId ?? actorId,
      },
    });

    const label = PUNISHMENT_TYPE_LABELS[dto.punishmentType];
    const durationPart = dto.duration ? ` на ${dto.duration}` : '';

    await this.addSystemMessage(
      row.id,
      actorId,
      `Выдано наказание игроку ${matchedTarget.username}: ${label}${durationPart}. Причина: ${dto.reason}`,
    );

    return this.getByNumber(reportNumber, actorId, roleGroup);
  }

  async lock(
    reportNumber: string,
    actorId: string,
    roleGroup: RoleGroup,
    dto: LockReportDto,
  ): Promise<ReportDetails> {
    if (!hasRoleGroup(roleGroup, RoleGroup.ADMIN)) {
      throw new ForbiddenException();
    }

    const row = await this.requireReport(reportNumber);
    this.assertCanModerate(row, roleGroup);

    await this.prisma.report.update({
      where: { id: row.id },
      data: {
        isLocked: true,
        lockedBy: actorId,
        lockedReason: dto.reason,
      },
    });

    await this.addSystemMessage(row.id, actorId, `Обращение заблокировано: ${dto.reason}`);

    return this.getByNumber(reportNumber, actorId, roleGroup);
  }

  async stats(): Promise<ReportStats> {
    const [total, byStatusRows, byTypeRows, openRows, resolved] = await Promise.all([
      this.prisma.report.count(),
      this.prisma.report.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.report.groupBy({ by: ['type'], _count: { _all: true } }),
      this.prisma.report.findMany({
        where: {
          status: {
            in: [
              PrismaReportStatus.PENDING,
              PrismaReportStatus.IN_REVIEW,
              PrismaReportStatus.WAITING_RESPONSE,
            ],
          },
        },
        select: { updatedAt: true, status: true, createdAt: true },
      }),
      this.prisma.report.findMany({
        where: { resolvedAt: { not: null } },
        select: { createdAt: true, resolvedAt: true },
        take: 500,
        orderBy: { resolvedAt: 'desc' },
      }),
    ]);

    const byStatus = Object.fromEntries(
      (Object.values(ReportStatus) as ReportStatus[]).map((status) => [status, 0]),
    ) as Record<ReportStatus, number>;

    for (const row of byStatusRows) {
      byStatus[row.status as ReportStatus] = row._count._all;
    }

    const byType = Object.fromEntries(
      (Object.values(ReportType) as ReportType[]).map((type) => [type, 0]),
    ) as Record<ReportType, number>;

    for (const row of byTypeRows) {
      byType[row.type as ReportType] = row._count._all;
    }

    const overdue = openRows.filter(
      (row) => Date.now() - row.updatedAt.getTime() > 24 * 60 * 60 * 1000,
    ).length;

    let avgResolutionHours: number | null = null;
    if (resolved.length > 0) {
      const totalHours = resolved.reduce((sum, row) => {
        if (!row.resolvedAt) return sum;
        return sum + (row.resolvedAt.getTime() - row.createdAt.getTime()) / (60 * 60 * 1000);
      }, 0);
      avgResolutionHours = Math.round((totalHours / resolved.length) * 10) / 10;
    }

    return { total, byStatus, byType, overdue, avgResolutionHours };
  }

  async banUser(userId: string, actorId: string, dto: BanReportsDto): Promise<ReportBanInfo> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    await this.prisma.reportBan.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    const row = await this.prisma.reportBan.create({
      data: {
        userId,
        reason: dto.reason,
        bannedBy: actorId,
        bannedUntil: dto.until ? new Date(dto.until) : null,
      },
    });

    return {
      id: row.id,
      userId: row.userId,
      reason: row.reason,
      bannedBy: row.bannedBy,
      bannedUntil: row.bannedUntil?.toISOString() ?? null,
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async unbanUser(userId: string): Promise<void> {
    await this.prisma.reportBan.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });
  }

  private validateCreateDto(dto: CreateReportDto): void {
    const targets = dto.targets ?? [];
    const links = dto.evidenceLinks ?? [];

    if (dto.type === ReportType.PLAYER_COMPLAINT) {
      if (targets.length < 1) {
        throw new BadRequestException('Укажите хотя бы одного нарушителя');
      }
      if (!dto.server) {
        throw new BadRequestException('Укажите сервер');
      }
      if (!dto.incidentDate) {
        throw new BadRequestException('Укажите дату и время инцидента');
      }
      this.assertIncidentDate(dto.incidentDate);
      if (links.length < 1) {
        throw new BadRequestException('Добавьте хотя бы одну ссылку на доказательства');
      }
    }

    if (dto.type === ReportType.ADMIN_COMPLAINT) {
      if (targets.length < 1) {
        throw new BadRequestException('Укажите ник администратора или хелпера');
      }
      if (links.length < 1) {
        throw new BadRequestException('Добавьте хотя бы одну ссылку на доказательства');
      }
    }

    if (dto.type === ReportType.PUNISHMENT_APPEAL) {
      if (!dto.appealedPunishmentId) {
        throw new BadRequestException('Укажите наказание для обжалования');
      }
      if (links.length < 1) {
        throw new BadRequestException('Добавьте хотя бы одну ссылку на доказательства');
      }
    }
  }

  private assertIncidentDate(iso: string): void {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Некорректная дата инцидента');
    }
    if (date.getTime() > Date.now()) {
      throw new BadRequestException('Дата инцидента не может быть в будущем');
    }
    if (Date.now() - date.getTime() > INCIDENT_MAX_AGE_MS) {
      throw new BadRequestException('Жалобу можно подать только в течение 72 часов после инцидента');
    }
  }

  private async assertCanCreate(authorId: string): Promise<void> {
    const ban = await this.prisma.reportBan.findFirst({
      where: {
        userId: authorId,
        isActive: true,
        OR: [{ bannedUntil: null }, { bannedUntil: { gt: new Date() } }],
      },
    });

    if (ban) {
      throw new ForbiddenException(`Вам запрещено создавать обращения: ${ban.reason}`);
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const todayCount = await this.prisma.report.count({
      where: { authorId, createdAt: { gte: since } },
    });

    if (todayCount >= DAILY_LIMIT) {
      throw new BadRequestException(
        `Лимит обращений: не более ${DAILY_LIMIT} в сутки. Попробуйте позже.`,
      );
    }
  }

  private async assertNoDuplicate(
    authorId: string,
    targetUsername: string,
    type: ReportType,
  ): Promise<void> {
    const since = new Date(Date.now() - DUPLICATE_WINDOW_MS);
    const duplicate = await this.prisma.report.findFirst({
      where: {
        authorId,
        targets: { some: { username: targetUsername } },
        type: type as PrismaReportType,
        createdAt: { gte: since },
        status: {
          notIn: [
            PrismaReportStatus.RESOLVED,
            PrismaReportStatus.REJECTED,
            PrismaReportStatus.CLOSED,
          ],
        },
      },
      select: { reportNumber: true },
    });

    if (duplicate) {
      throw new BadRequestException(
        `У вас уже есть открытое обращение на этого игрока (${duplicate.reportNumber})`,
      );
    }
  }

  private async generateReportNumber(): Promise<string> {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const candidate = `10R-${randomBytes(3).toString('hex').slice(0, 5)}`;
      const exists = await this.prisma.report.findUnique({
        where: { reportNumber: candidate },
        select: { id: true },
      });
      if (!exists) {
        return candidate;
      }
    }
    throw new BadRequestException('Не удалось сгенерировать номер обращения');
  }

  private buildListWhere(
    query: ListReportsQueryDto,
    base: Prisma.ReportWhereInput = {},
  ): Prisma.ReportWhereInput {
    const where: Prisma.ReportWhereInput = { ...base };

    if (query.type) {
      where.type = query.type as PrismaReportType;
    }
    if (query.status) {
      where.status = query.status as PrismaReportStatus;
    }
    if (query.server) {
      where.server = query.server;
    }
    if (query.search?.trim()) {
      const q = query.search.trim();
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
        {
          OR: [
            { reportNumber: { contains: q, mode: 'insensitive' } },
            { targets: { some: { username: { contains: q, mode: 'insensitive' } } } },
            { author: { username: { contains: q, mode: 'insensitive' } } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
      ];
    }

    return where;
  }

  private async paginate(
    where: Prisma.ReportWhereInput,
    page: number,
    limit: number,
  ): Promise<ReportListResponse> {
    const skip = (page - 1) * limit;
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.report.count({ where }),
      this.prisma.report.findMany({
        where,
        include: reportInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      items: rows.map(toReportSummary),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }

  private async requireReport(reportNumber: string) {
    const row = await this.prisma.report.findUnique({
      where: { reportNumber },
      include: reportDetailInclude,
    });

    if (!row) {
      throw new NotFoundException('Обращение не найдено');
    }

    return row;
  }

  private assertCanView(
    row: { authorId: string; type: PrismaReportType; assignedToId: string | null },
    viewerId: string,
    roleGroup: RoleGroup,
  ): void {
    if (row.authorId === viewerId) {
      return;
    }

    if (row.type === PrismaReportType.DONATION_PROBLEM) {
      if (!hasRoleGroup(roleGroup, RoleGroup.OWNER)) {
        throw new ForbiddenException();
      }
      return;
    }

    if (canReviewReportType(roleGroup, row.type as ReportType)) {
      return;
    }

    if (row.assignedToId === viewerId) {
      return;
    }

    throw new ForbiddenException();
  }

  private assertCanModerate(
    row: { type: PrismaReportType },
    roleGroup: RoleGroup,
  ): void {
    if (!canReviewReportType(roleGroup, row.type as ReportType)) {
      throw new ForbiddenException('Недостаточно прав для этого типа обращения');
    }
  }

  private async addSystemMessage(reportId: string, authorId: string, content: string) {
    await this.prisma.reportMessage.create({
      data: {
        reportId,
        authorId,
        content,
        contentHtml: `<p>${content}</p>`,
        isStaff: true,
        isSystem: true,
      },
    });
  }

  private async notifyStatusChange(
    reportNumber: string,
    authorId: string,
    status: ReportStatus,
  ) {
    await this.notifications.createNotification({
      userId: authorId,
      type: NotificationType.SYSTEM,
      title: `Обращение ${reportNumber}`,
      message: `Ваше обращение переведено в статус «${REPORT_STATUS_LABELS[status]}»`,
      link: `/report/${reportNumber}`,
    });
  }

  private async notifyStaffAboutNewReport(
    reportNumber: string,
    type: ReportType,
    fromUserId: string,
  ) {
    const minRole = minRoleForReportType(type);
    const staff = await this.prisma.user.findMany({
      where: {
        isBanned: false,
        roleGroup: {
          in: (Object.values(RoleGroup) as RoleGroup[]).filter((group) =>
            hasRoleGroup(group, minRole),
          ),
        },
      },
      select: { id: true },
    });

    const title = `Новое обращение #${reportNumber}: ${REPORT_TYPE_LABELS[type]}`;
    const link =
      type === ReportType.DONATION_PROBLEM
        ? `/admin/support/donations`
        : `/moderation/reports/${reportNumber}`;

    await Promise.all(
      staff
        .filter((user) => user.id !== fromUserId)
        .map((user) =>
          this.notifications.createNotification({
            userId: user.id,
            type: NotificationType.SYSTEM,
            title,
            link,
            fromUserId,
            metadata: { reportNumber, reportType: type },
          }),
        ),
    );
  }
}
