import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  NotificationType,
  ReportStatus as PrismaReportStatus,
  ReportType as PrismaReportType,
  RoleGroup,
} from '@prisma/client';
import { randomBytes } from 'node:crypto';
import {
  REPORT_RULES_SLUGS,
  REPORT_STATUS_LABELS,
  REPORT_TYPE_LABELS,
  GamePunishmentSummary,
  GameReportSummary,
  ReportBanInfo,
  ReportDetails,
  ReportListResponse,
  ReportStats,
  ReportStatus,
  ReportType,
  TopicDetails,
  detectEvidenceLinkType,
  hasRoleGroup,
} from '@twomc/shared';
import { AuditService } from '../admin/audit.service';
import { CaptchaService } from '../auth/captcha.service';
import { MarkdownService } from '../comments/markdown.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { toTopicDetails } from '../topics/topic.mapper';
import {
  canReviewReportType,
  isReportTarget,
  isStaffRole,
  minRoleForReportType,
} from './report-access.util';
import { reportUserSelect, toReportDetails, toReportSummary } from './report.mapper';
import {
  AddReportMessageDto,
  ArchiveReportDto,
  AssignReportDto,
  BanReportsDto,
  ChangeReportStatusDto,
  CreateDonationProblemDto,
  CreateModeratorNoteDto,
  CreateReportDto,
  ListReportsQueryDto,
  LockReportDto,
  SetVerdictDto,
  SoftDeleteMessageDto,
  UpdateModeratorNoteDto,
  UpdateOwnReportMessageDto,
} from './dto/reports.dto';
import { ReportsAttachmentsService } from './reports-attachments.service';
import { ReportsPunishmentsService } from './reports-punishments.service';

const DAILY_LIMIT = 3;
const INCIDENT_MAX_AGE_MS = 72 * 60 * 60 * 1000;
const DUPLICATE_WINDOW_MS = 72 * 60 * 60 * 1000;
const MESSAGE_EDIT_WINDOW_MS = 5 * 60 * 1000;
const MAX_PINNED_MESSAGES = 3;

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
  moderatorNotes: {
    orderBy: [{ isPinned: 'desc' as const }, { createdAt: 'asc' as const }],
    include: { author: { select: reportUserSelect } },
  },
  attachments: { orderBy: { createdAt: 'asc' as const } },
  appealedPunishment: {
    include: { issuedByUser: { select: reportUserSelect } },
  },
};

type ReportRow = Prisma.ReportGetPayload<{ include: typeof reportDetailInclude }>;

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly markdown: MarkdownService,
    private readonly notifications: NotificationsService,
    private readonly captcha: CaptchaService,
    private readonly attachments: ReportsAttachmentsService,
    private readonly punishments: ReportsPunishmentsService,
    private readonly audit: AuditService,
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
        const user = await this.prisma.user.findFirst({
          where: { username: { equals: target.username, mode: 'insensitive' } },
          select: { id: true, username: true, roleGroup: true },
        });
        return {
          username: user?.username ?? target.username,
          userId: user?.id ?? null,
          roleGroup: user?.roleGroup ?? null,
          order: target.order ?? index,
        };
      }),
    );

    if (dto.type === ReportType.PLAYER_COMPLAINT) {
      for (const target of resolvedTargets) {
        if (target.roleGroup && isStaffRole(target.roleGroup)) {
          throw new BadRequestException(
            `Пользователь ${target.username} — модератор. Используйте тип «Жалоба на администрацию»`,
          );
        }
      }
    }

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

    return this.mapDetails(row, authorId, RoleGroup.PLAYER);
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

    return this.mapDetails(row, authorId, RoleGroup.PLAYER);
  }

  async listMine(
    userId: string,
    roleGroup: RoleGroup,
    query: ListReportsQueryDto,
  ): Promise<ReportListResponse> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 20));
    const participationOr: Prisma.ReportWhereInput[] = [
      { authorId: userId },
      { targets: { some: { userId } } },
      { assignedToId: userId },
    ];

    let roleFilter: Prisma.ReportWhereInput;
    switch (query.role) {
      case 'author':
        roleFilter = { authorId: userId };
        break;
      case 'target':
        roleFilter = { targets: { some: { userId } } };
        break;
      case 'moderator':
        roleFilter = { assignedToId: userId };
        break;
      case 'all':
      default:
        roleFilter = { OR: participationOr };
        break;
    }

    const where = this.buildListWhere(query, {
      ...roleFilter,
      isArchived: false,
    });

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

    return this.paginate(where, page, limit, userId);
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
      isArchived: false,
    });

    if (query.assigned === 'me') {
      where.assignedToId = viewerId;
    } else if (query.assigned === 'free') {
      where.assignedToId = null;
    }

    return this.paginate(where, page, limit, viewerId);
  }

  async listArchived(
    roleGroup: RoleGroup,
    query: ListReportsQueryDto,
  ): Promise<ReportListResponse> {
    if (!hasRoleGroup(roleGroup, RoleGroup.ADMIN)) {
      throw new ForbiddenException();
    }

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 20));
    const where = this.buildListWhere(query, { isArchived: true });
    return this.paginate(where, page, limit);
  }

  async listDonations(query: ListReportsQueryDto): Promise<ReportListResponse> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 20));
    const where = this.buildListWhere(query, {
      type: PrismaReportType.DONATION_PROBLEM,
      isArchived: false,
    });
    return this.paginate(where, page, limit);
  }

  // TODO: Wire TigerReports plugin sync
  listGameReports(): Promise<GameReportSummary[]> {
    return Promise.resolve([]);
  }

  // TODO: Wire TigerReports plugin sync
  listIncomingGameReports(_username: string): Promise<GameReportSummary[]> {
    return Promise.resolve([]);
  }

  // TODO: Wire TigerReports plugin sync
  listOutgoingGameReports(_username: string): Promise<GameReportSummary[]> {
    return Promise.resolve([]);
  }

  // TODO: Wire LiteBans plugin sync
  listActiveGamePunishments(): Promise<GamePunishmentSummary[]> {
    return Promise.resolve([]);
  }

  // TODO: Wire LiteBans plugin sync
  listGamePunishmentHistory(_username: string): Promise<GamePunishmentSummary[]> {
    return Promise.resolve([]);
  }

  // TODO: Wire LiteBans plugin sync
  listMyGamePunishments(_userId: string): Promise<GamePunishmentSummary[]> {
    return Promise.resolve([]);
  }

  async getByNumber(
    reportNumber: string,
    viewerId: string,
    roleGroup: RoleGroup,
  ): Promise<ReportDetails> {
    const row = await this.requireReport(reportNumber);
    this.assertCanView(row, viewerId, roleGroup);
    return this.mapDetails(row, viewerId, roleGroup);
  }

  async addMessage(
    reportNumber: string,
    authorId: string,
    roleGroup: RoleGroup,
    dto: AddReportMessageDto,
    options?: { asModerator?: boolean },
  ): Promise<ReportDetails> {
    const row = await this.requireReport(reportNumber);
    this.assertCanView(row, authorId, roleGroup);

    if (row.isLocked) {
      throw new BadRequestException('Обращение заблокировано');
    }

    if (options?.asModerator) {
      this.assertCanModerate(row, roleGroup);
      this.assertNotSelfTarget(row, authorId);
    }

    const isAuthor = row.authorId === authorId;
    const isTarget = isReportTarget(row, authorId);
    // Staff named as targets may reply as participants, not as reviewers
    const asStaff =
      canReviewReportType(roleGroup, row.type as ReportType) && !isTarget;

    if (!isAuthor && !asStaff && !isTarget) {
      throw new ForbiddenException();
    }

    const contentHtml = this.markdown.render(dto.content);

    await this.prisma.reportMessage.create({
      data: {
        reportId: row.id,
        authorId,
        content: dto.content,
        contentHtml,
        isStaff: asStaff,
      },
    });

    if ((asStaff || isTarget) && row.authorId !== authorId) {
      await this.notifications.createNotification({
        userId: row.authorId,
        type: NotificationType.SYSTEM,
        title: `Новый ответ по обращению ${row.reportNumber}`,
        message: asStaff
          ? 'Модератор ответил на ваше обращение'
          : 'Участник обращения оставил сообщение',
        link: `/report/${row.reportNumber}`,
        fromUserId: authorId,
      });
    }

    return this.getByNumber(reportNumber, authorId, roleGroup);
  }

  async updateOwnMessage(
    reportNumber: string,
    messageId: string,
    authorId: string,
    roleGroup: RoleGroup,
    dto: UpdateOwnReportMessageDto,
  ): Promise<ReportDetails> {
    if (!dto.content && !dto.delete) {
      throw new BadRequestException('Укажите content или delete');
    }
    if (dto.content && dto.delete) {
      throw new BadRequestException('Нельзя одновременно редактировать и удалять сообщение');
    }

    const row = await this.requireReport(reportNumber);
    this.assertCanView(row, authorId, roleGroup);

    const message = row.messages.find((item) => item.id === messageId);
    if (!message) {
      throw new NotFoundException('Сообщение не найдено');
    }
    if (message.authorId !== authorId) {
      throw new ForbiddenException('Можно изменять только свои сообщения');
    }
    if (message.isSystem) {
      throw new BadRequestException('Системные сообщения нельзя изменять');
    }
    if (message.isDeleted) {
      throw new BadRequestException('Сообщение уже удалено');
    }
    if (Date.now() - message.createdAt.getTime() > MESSAGE_EDIT_WINDOW_MS) {
      throw new BadRequestException('Редактирование доступно только в течение 5 минут');
    }

    if (dto.delete) {
      await this.prisma.reportMessage.update({
        where: { id: messageId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: authorId,
        },
      });
    } else {
      await this.prisma.reportMessage.update({
        where: { id: messageId },
        data: {
          content: dto.content!,
          contentHtml: this.markdown.render(dto.content!),
        },
      });
    }

    return this.getByNumber(reportNumber, authorId, roleGroup);
  }

  async softDeleteMessage(
    reportNumber: string,
    messageId: string,
    actorId: string,
    roleGroup: RoleGroup,
    dto: SoftDeleteMessageDto,
  ): Promise<ReportDetails> {
    const row = await this.requireReport(reportNumber);
    this.assertCanModerate(row, roleGroup);

    const message = row.messages.find((item) => item.id === messageId);
    if (!message) {
      throw new NotFoundException('Сообщение не найдено');
    }
    if (message.isDeleted) {
      throw new BadRequestException('Сообщение уже удалено');
    }

    await this.prisma.reportMessage.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: actorId,
        deleteReason: dto.reason ?? null,
      },
    });

    return this.getByNumber(reportNumber, actorId, roleGroup);
  }

  async hardDeleteMessage(
    reportNumber: string,
    messageId: string,
    actorId: string,
    roleGroup: RoleGroup,
  ): Promise<void> {
    if (!hasRoleGroup(roleGroup, RoleGroup.ADMIN)) {
      throw new ForbiddenException();
    }

    const row = await this.requireReport(reportNumber);
    const message = row.messages.find((item) => item.id === messageId);
    if (!message) {
      throw new NotFoundException('Сообщение не найдено');
    }

    await this.prisma.reportMessage.delete({ where: { id: messageId } });

    await this.audit.log({
      actorId,
      action: 'report.message.delete',
      targetType: 'ReportMessage',
      targetId: messageId,
      changes: { reportNumber, messageId },
    });
  }

  async pinMessage(
    reportNumber: string,
    messageId: string,
    actorId: string,
    roleGroup: RoleGroup,
  ): Promise<ReportDetails> {
    const row = await this.requireReport(reportNumber);
    this.assertCanModerate(row, roleGroup);

    const message = row.messages.find((item) => item.id === messageId);
    if (!message) {
      throw new NotFoundException('Сообщение не найдено');
    }
    if (message.isDeleted) {
      throw new BadRequestException('Нельзя закрепить удалённое сообщение');
    }
    if (message.isPinned) {
      return this.getByNumber(reportNumber, actorId, roleGroup);
    }

    const pinnedCount = row.messages.filter((item) => item.isPinned && !item.isDeleted).length;
    if (pinnedCount >= MAX_PINNED_MESSAGES) {
      throw new BadRequestException(`Можно закрепить не более ${MAX_PINNED_MESSAGES} сообщений`);
    }

    await this.prisma.reportMessage.update({
      where: { id: messageId },
      data: {
        isPinned: true,
        pinnedAt: new Date(),
        pinnedBy: actorId,
      },
    });

    return this.getByNumber(reportNumber, actorId, roleGroup);
  }

  async unpinMessage(
    reportNumber: string,
    messageId: string,
    actorId: string,
    roleGroup: RoleGroup,
  ): Promise<ReportDetails> {
    const row = await this.requireReport(reportNumber);
    this.assertCanModerate(row, roleGroup);

    const message = row.messages.find((item) => item.id === messageId);
    if (!message) {
      throw new NotFoundException('Сообщение не найдено');
    }

    await this.prisma.reportMessage.update({
      where: { id: messageId },
      data: {
        isPinned: false,
        pinnedAt: null,
        pinnedBy: null,
      },
    });

    return this.getByNumber(reportNumber, actorId, roleGroup);
  }

  async createModeratorNote(
    reportNumber: string,
    actorId: string,
    roleGroup: RoleGroup,
    dto: CreateModeratorNoteDto,
  ): Promise<ReportDetails> {
    const row = await this.requireReport(reportNumber);
    this.assertCanModerate(row, roleGroup);

    const contentHtml = this.markdown.render(dto.content);
    await this.prisma.reportModeratorNote.create({
      data: {
        reportId: row.id,
        authorId: actorId,
        content: dto.content,
        contentHtml,
      },
    });

    return this.getByNumber(reportNumber, actorId, roleGroup);
  }

  async updateModeratorNote(
    reportNumber: string,
    noteId: string,
    actorId: string,
    roleGroup: RoleGroup,
    dto: UpdateModeratorNoteDto,
  ): Promise<ReportDetails> {
    const row = await this.requireReport(reportNumber);
    this.assertCanModerate(row, roleGroup);

    const note = row.moderatorNotes.find((item) => item.id === noteId);
    if (!note) {
      throw new NotFoundException('Заметка не найдена');
    }

    const canEdit =
      note.authorId === actorId || hasRoleGroup(roleGroup, RoleGroup.ADMIN);
    if (!canEdit) {
      throw new ForbiddenException('Редактировать заметку может только автор или администратор');
    }

    await this.prisma.reportModeratorNote.update({
      where: { id: noteId },
      data: {
        content: dto.content,
        contentHtml: this.markdown.render(dto.content),
      },
    });

    return this.getByNumber(reportNumber, actorId, roleGroup);
  }

  async deleteModeratorNote(
    reportNumber: string,
    noteId: string,
    actorId: string,
    roleGroup: RoleGroup,
  ): Promise<ReportDetails> {
    const row = await this.requireReport(reportNumber);
    this.assertCanModerate(row, roleGroup);

    const note = row.moderatorNotes.find((item) => item.id === noteId);
    if (!note) {
      throw new NotFoundException('Заметка не найдена');
    }

    const canDelete =
      note.authorId === actorId || hasRoleGroup(roleGroup, RoleGroup.ADMIN);
    if (!canDelete) {
      throw new ForbiddenException('Удалить заметку может только автор или администратор');
    }

    await this.prisma.reportModeratorNote.delete({ where: { id: noteId } });
    return this.getByNumber(reportNumber, actorId, roleGroup);
  }

  async pinModeratorNote(
    reportNumber: string,
    noteId: string,
    actorId: string,
    roleGroup: RoleGroup,
  ): Promise<ReportDetails> {
    const row = await this.requireReport(reportNumber);
    this.assertCanModerate(row, roleGroup);

    const note = row.moderatorNotes.find((item) => item.id === noteId);
    if (!note) {
      throw new NotFoundException('Заметка не найдена');
    }

    await this.prisma.reportModeratorNote.update({
      where: { id: noteId },
      data: { isPinned: !note.isPinned },
    });

    return this.getByNumber(reportNumber, actorId, roleGroup);
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
    const isAuthor = row.authorId === userId;
    const isTarget = isReportTarget(row, userId);
    if (!isAuthor && !isStaff && !isTarget) {
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
      this.assertNotSelfTarget(row, assigneeId);

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
    this.assertNotSelfTarget(row, actorId);

    const previousStatus = row.status as ReportStatus;
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

    let systemMessage = `Статус изменён с «${REPORT_STATUS_LABELS[previousStatus]}» на «${REPORT_STATUS_LABELS[dto.status]}»`;
    if (dto.comment?.trim()) {
      systemMessage += `. ${dto.comment.trim()}`;
    }

    await this.addSystemMessage(row.id, actorId, systemMessage);
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
    this.assertNotSelfTarget(row, actorId);

    const verdictHtml = this.markdown.render(dto.verdict);

    await this.prisma.report.update({
      where: { id: row.id },
      data: {
        verdict: dto.verdict,
        verdictHtml,
        resolvedAt: new Date(),
        assignedToId: row.assignedToId ?? actorId,
      },
    });

    await this.addSystemMessage(row.id, actorId, 'Вынесен вердикт');

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

  async archiveReport(
    reportNumber: string,
    actorId: string,
    roleGroup: RoleGroup,
    dto: ArchiveReportDto,
  ): Promise<ReportDetails> {
    if (!hasRoleGroup(roleGroup, RoleGroup.ADMIN)) {
      throw new ForbiddenException();
    }

    const row = await this.requireReport(reportNumber);
    if (row.isArchived) {
      throw new BadRequestException('Обращение уже в архиве');
    }

    await this.prisma.report.update({
      where: { id: row.id },
      data: {
        isArchived: true,
        archivedAt: new Date(),
        archivedBy: actorId,
        archiveReason: dto.reason ?? null,
      },
    });

    await this.audit.log({
      actorId,
      action: 'report.archive',
      targetType: 'Report',
      targetId: row.id,
      changes: { reportNumber, reason: dto.reason ?? null },
    });

    return this.getByNumber(reportNumber, actorId, roleGroup);
  }

  async unarchiveReport(
    reportNumber: string,
    actorId: string,
    roleGroup: RoleGroup,
  ): Promise<ReportDetails> {
    if (!hasRoleGroup(roleGroup, RoleGroup.ADMIN)) {
      throw new ForbiddenException();
    }

    const row = await this.requireReport(reportNumber);
    if (!row.isArchived) {
      throw new BadRequestException('Обращение не в архиве');
    }

    await this.prisma.report.update({
      where: { id: row.id },
      data: {
        isArchived: false,
        archivedAt: null,
        archivedBy: null,
        archiveReason: null,
      },
    });

    await this.audit.log({
      actorId,
      action: 'report.unarchive',
      targetType: 'Report',
      targetId: row.id,
      changes: { reportNumber },
    });

    return this.getByNumber(reportNumber, actorId, roleGroup);
  }

  async deleteReport(
    reportNumber: string,
    actorId: string,
    roleGroup: RoleGroup,
  ): Promise<void> {
    if (!hasRoleGroup(roleGroup, RoleGroup.ADMIN)) {
      throw new ForbiddenException();
    }

    const row = await this.requireReport(reportNumber);

    await this.prisma.report.delete({ where: { id: row.id } });

    await this.audit.log({
      actorId,
      action: 'report.delete',
      targetType: 'Report',
      targetId: row.id,
      changes: { reportNumber, type: row.type, authorId: row.authorId },
    });
  }

  async stats(): Promise<ReportStats> {
    const [total, byStatusRows, byTypeRows, openRows, resolved] = await Promise.all([
      this.prisma.report.count({ where: { isArchived: false } }),
      this.prisma.report.groupBy({
        by: ['status'],
        where: { isArchived: false },
        _count: { _all: true },
      }),
      this.prisma.report.groupBy({
        by: ['type'],
        where: { isArchived: false },
        _count: { _all: true },
      }),
      this.prisma.report.findMany({
        where: {
          isArchived: false,
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
        where: { resolvedAt: { not: null }, isArchived: false },
        select: { createdAt: true, resolvedAt: true },
        take: 500,
        orderBy: { resolvedAt: 'desc' },
      }),
    ]);

    const byStatus = Object.fromEntries(
      (Object.values(ReportStatus) as ReportStatus[]).map((status) => [status, 0]),
    ) as Record<ReportStatus, number>;

    for (const statusRow of byStatusRows) {
      byStatus[statusRow.status as ReportStatus] = statusRow._count._all;
    }

    const byType = Object.fromEntries(
      (Object.values(ReportType) as ReportType[]).map((type) => [type, 0]),
    ) as Record<ReportType, number>;

    for (const typeRow of byTypeRows) {
      byType[typeRow.type as ReportType] = typeRow._count._all;
    }

    const overdue = openRows.filter(
      (openRow) => Date.now() - openRow.updatedAt.getTime() > 24 * 60 * 60 * 1000,
    ).length;

    let avgResolutionHours: number | null = null;
    if (resolved.length > 0) {
      const totalHours = resolved.reduce((sum, resolvedRow) => {
        if (!resolvedRow.resolvedAt) return sum;
        return (
          sum +
          (resolvedRow.resolvedAt.getTime() - resolvedRow.createdAt.getTime()) / (60 * 60 * 1000)
        );
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

  private mapDetails(row: ReportRow, viewerId: string, roleGroup: RoleGroup): ReportDetails {
    const includeModeratorNotes = canReviewReportType(roleGroup, row.type as ReportType);
    return toReportDetails(row, {
      includeModeratorNotes,
      revealDeletedContent: includeModeratorNotes,
      viewerId,
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
        isArchived: false,
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
    viewerId?: string,
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
      items: rows.map((row) => toReportSummary(row, viewerId ? { viewerId } : undefined)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }

  private async requireReport(reportNumber: string): Promise<ReportRow> {
    const row = await this.prisma.report.findUnique({
      where: { reportNumber },
      include: reportDetailInclude,
    });

    if (!row) {
      throw new NotFoundException('Обращение не найдено');
    }

    return row;
  }

  private assertCanView(row: ReportRow, viewerId: string, roleGroup: RoleGroup): void {
    if (row.authorId === viewerId) {
      return;
    }

    if (isReportTarget(row, viewerId)) {
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

  private assertCanModerate(row: { type: PrismaReportType }, roleGroup: RoleGroup): void {
    if (!canReviewReportType(roleGroup, row.type as ReportType)) {
      throw new ForbiddenException('Недостаточно прав для этого типа обращения');
    }
  }

  private assertNotSelfTarget(
    row: { targets?: { userId: string | null }[] },
    userId: string,
  ): void {
    if (isReportTarget(row, userId)) {
      throw new ForbiddenException('Вы не можете рассматривать обращение на самого себя');
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
