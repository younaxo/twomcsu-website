import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NotificationType,
  PunishmentType as PrismaPunishmentType,
} from '@prisma/client';
import {
  PUNISHMENT_TYPE_LABELS,
  UserPunishmentSummary,
} from '@twomc/shared';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { reportUserSelect, toUserPunishmentSummary } from './report.mapper';
import { CreatePunishmentDto, UpdatePunishmentDto } from './dto/reports.dto';

function parseDurationToExpires(duration?: string | null, from = new Date()): Date | null {
  if (!duration) return null;
  const normalized = duration.trim().toLowerCase();
  if (normalized === 'forever' || normalized === 'perm') return null;

  const match = /^(\d+)(m|h|d|w)$/.exec(normalized);
  if (!match) return null;

  const amount = Number(match[1]);
  const unit = match[2];
  const ms =
    unit === 'm'
      ? amount * 60_000
      : unit === 'h'
        ? amount * 3_600_000
        : unit === 'd'
          ? amount * 86_400_000
          : amount * 7 * 86_400_000;

  return new Date(from.getTime() + ms);
}

@Injectable()
export class ReportsPunishmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async listMyPunishments(
    userId: string,
    onlyAppealable = false,
  ): Promise<UserPunishmentSummary[]> {
    const rows = await this.prisma.userPunishment.findMany({
      where: {
        userId,
        ...(onlyAppealable ? { isAppealable: true } : {}),
      },
      include: { issuedByUser: { select: reportUserSelect } },
      orderBy: { issuedAt: 'desc' },
    });

    return rows.map(toUserPunishmentSummary);
  }

  async listByUsername(username: string): Promise<UserPunishmentSummary[]> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    return this.listMyPunishments(user.id, false);
  }

  async issuePunishment(
    userId: string,
    actorId: string,
    dto: CreatePunishmentDto,
  ): Promise<UserPunishmentSummary> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const expiresAt = dto.expiresAt
      ? new Date(dto.expiresAt)
      : parseDurationToExpires(dto.duration);

    const row = await this.prisma.userPunishment.create({
      data: {
        userId,
        punishmentType: dto.punishmentType as PrismaPunishmentType,
        reason: dto.reason,
        duration: dto.duration ?? null,
        server: dto.server ?? null,
        issuedBy: actorId,
        expiresAt,
        isActive: true,
        isAppealable: dto.isAppealable ?? true,
      },
      include: { issuedByUser: { select: reportUserSelect } },
    });

    const label = PUNISHMENT_TYPE_LABELS[dto.punishmentType];
    const durationPart = dto.duration ? ` на ${dto.duration}` : '';

    await this.notifications.createNotification({
      userId,
      type: NotificationType.SYSTEM,
      title: `Вы получили ${label}${durationPart}`,
      message: `Причина: ${dto.reason}`,
      fromUserId: actorId,
    });

    return toUserPunishmentSummary(row);
  }

  async updatePunishment(
    userId: string,
    punishmentId: string,
    dto: UpdatePunishmentDto,
  ): Promise<UserPunishmentSummary> {
    const existing = await this.prisma.userPunishment.findFirst({
      where: { id: punishmentId, userId },
    });
    if (!existing) {
      throw new NotFoundException('Наказание не найдено');
    }

    const row = await this.prisma.userPunishment.update({
      where: { id: punishmentId },
      data: {
        isActive: dto.isActive ?? undefined,
        duration: dto.duration ?? undefined,
        expiresAt:
          dto.expiresAt === undefined
            ? undefined
            : dto.expiresAt === null
              ? null
              : new Date(dto.expiresAt),
        isAppealable: dto.isAppealable ?? undefined,
      },
      include: { issuedByUser: { select: reportUserSelect } },
    });

    return toUserPunishmentSummary(row);
  }

  async requireAppealableForUser(punishmentId: string, userId: string) {
    const row = await this.prisma.userPunishment.findFirst({
      where: { id: punishmentId, userId },
      include: { issuedByUser: { select: reportUserSelect } },
    });

    if (!row) {
      throw new BadRequestException('Наказание не найдено или не принадлежит вам');
    }
    if (!row.isAppealable) {
      throw new BadRequestException('Это наказание нельзя обжаловать');
    }

    return row;
  }
}
