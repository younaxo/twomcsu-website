import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  DigestMode,
  NotificationPriority,
  NotificationType,
  Prisma,
} from '@prisma/client';
import {
  AppNotification,
  NotificationPriority as SharedPriority,
  NotificationStats,
  NotificationType as SharedType,
  NotificationsResponse,
  UnreadNotificationsCount,
} from '@twomc/shared';
import { CACHE_TTL, cacheKeys } from '../cache/cache.keys';
import { CacheService } from '../cache/cache.service';
import { PrismaService } from '../prisma/prisma.service';
import { DiscordNotificationService } from './discord.service';
import { NotificationEmailService } from './email.service';
import { NotificationSettingsService } from './notification-settings.service';
import { NotificationsGateway } from './notifications.gateway';
import { PushService } from './push.service';

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message?: string | null;
  link?: string | null;
  imageUrl?: string | null;
  fromUserId?: string | null;
  metadata?: Prisma.InputJsonValue | null;
  groupKey?: string | null;
  priority?: NotificationPriority;
  actionUrl?: string | null;
  actionLabel?: string | null;
};

const GROUP_WINDOW_MS = 60 * 60 * 1000;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly settingsService: NotificationSettingsService,
    private readonly push: PushService,
    private readonly email: NotificationEmailService,
    private readonly discord: DiscordNotificationService,
    private readonly gateway: NotificationsGateway,
  ) {}

  async createNotification(input: CreateNotificationInput): Promise<AppNotification> {
    const settings = await this.settingsService.getOrCreate(input.userId);

    if (!this.settingsService.isChannelEnabled(settings, input.type as SharedType, 'site')) {
      return this.emptyNotification(input);
    }

    const notification = input.groupKey
      ? await this.createGrouped(input)
      : await this.persist(input);

    await this.invalidateUnread(input.userId);
    this.gateway.emitNew(input.userId, notification);

    const quiet = this.settingsService.isQuietHours(settings);
    const externalOk = !quiet;

    if (
      externalOk &&
      this.settingsService.isChannelEnabled(settings, input.type as SharedType, 'push')
    ) {
      const sent = await this.push.sendToUser(input.userId, {
        title: notification.title,
        body: notification.message ?? undefined,
        url: notification.actionUrl || notification.link || undefined,
        imageUrl: notification.imageUrl ?? undefined,
        tag: notification.groupKey ?? notification.id,
      });
      if (sent) {
        await this.prisma.notification.update({
          where: { id: notification.id },
          data: { sentViaPush: true, sentViaPushAt: new Date() },
        });
      }
    }

    if (
      externalOk &&
      settings.digestMode === DigestMode.INSTANT &&
      this.settingsService.isChannelEnabled(settings, input.type as SharedType, 'email')
    ) {
      const sent = await this.email.sendNotification(input.userId, notification);
      if (sent) {
        await this.prisma.notification.update({
          where: { id: notification.id },
          data: { sentViaEmail: true, sentViaEmailAt: new Date() },
        });
      }
    }

    if (
      externalOk &&
      this.settingsService.isChannelEnabled(settings, input.type as SharedType, 'discord')
    ) {
      const personal = await this.discord.sendToUserPersonalWebhook(
        input.userId,
        notification,
        settings.discordWebhookUrl,
      );
      const global = await this.discord.sendToGlobalWebhooks(notification);
      if (personal || global) {
        await this.prisma.notification.update({
          where: { id: notification.id },
          data: { sentViaDiscord: true, sentViaDiscordAt: new Date() },
        });
      }
    }

    return notification;
  }

  async createGrouped(input: CreateNotificationInput): Promise<AppNotification> {
    const since = new Date(Date.now() - GROUP_WINDOW_MS);
    const existing = await this.prisma.notification.findFirst({
      where: {
        userId: input.userId,
        groupKey: input.groupKey!,
        isRead: false,
        createdAt: { gte: since },
      },
      include: { fromUser: { select: { username: true } } },
      orderBy: { createdAt: 'desc' },
    });

    if (!existing) {
      return this.persist(input);
    }

    const metadata = {
      ...((existing.metadata as Record<string, unknown> | null) ?? {}),
      ...((input.metadata as Record<string, unknown> | null) ?? {}),
    };
    const count = Number(metadata.count ?? 1) + 1;
    const actors = Array.isArray(metadata.actors) ? [...metadata.actors] : [];
    if (input.fromUserId) {
      const fromUser = await this.prisma.user.findUnique({
        where: { id: input.fromUserId },
        select: { username: true },
      });
      if (fromUser && !actors.includes(fromUser.username)) {
        actors.push(fromUser.username);
      }
    }
    metadata.count = count;
    metadata.actors = actors;

    const title = this.generateGroupedTitle(input.type as SharedType, actors, count);
    const row = await this.prisma.notification.update({
      where: { id: existing.id },
      data: {
        title,
        message: input.message ?? existing.message,
        link: input.link ?? existing.link,
        imageUrl: input.imageUrl ?? existing.imageUrl,
        fromUserId: input.fromUserId ?? existing.fromUserId,
        metadata: metadata as Prisma.InputJsonValue,
        priority: input.priority ?? existing.priority,
        actionUrl: input.actionUrl ?? existing.actionUrl,
        actionLabel: input.actionLabel ?? existing.actionLabel,
      },
      include: { fromUser: { select: { username: true } } },
    });

    return this.mapNotification(row);
  }

  generateGroupedTitle(type: SharedType, actors: string[], count: number): string {
    const names = actors.slice(0, 2);
    const rest = Math.max(0, actors.length - names.length);

    if (type === 'COMMENT_ON_PROFILE') {
      if (actors.length <= 1) {
        return `${names[0] ?? 'Игрок'} оставил комментарий на вашем профиле`;
      }
      const tail = rest > 0 ? ` и ещё ${rest}` : '';
      return `${count} новых комментария от ${names.join(', ')}${tail}`;
    }

    if (type === 'FRIEND_REQUEST') {
      return count === 1
        ? 'Новый запрос в друзья'
        : `${count} новых запроса в друзья`;
    }

    if (type === 'NEWS_LIKED') {
      return count === 1
        ? 'Ваш комментарий лайкнули'
        : `${count} человек лайкнули ваш комментарий`;
    }

    return `${count} новых уведомлений`;
  }

  async list(
    userId: string,
    page = 1,
    limit = 20,
    unreadOnly = false,
  ): Promise<NotificationsResponse> {
    const take = Math.min(100, Math.max(1, limit));
    const currentPage = Math.max(1, page);
    const skip = (currentPage - 1) * take;
    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    };

    const [total, rows, unreadCount] = await this.prisma.$transaction([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        include: { fromUser: { select: { username: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      items: rows.map((row) => this.mapNotification(row)),
      total,
      page: currentPage,
      limit: take,
      totalPages: Math.ceil(total / take) || 0,
      unreadCount,
    };
  }

  async unreadCount(userId: string): Promise<UnreadNotificationsCount> {
    const count = await this.cache.wrap(
      cacheKeys.notificationsUnread(userId),
      CACHE_TTL.NOTIFICATIONS_UNREAD,
      () =>
        this.prisma.notification.count({
          where: { userId, isRead: false },
        }),
    );

    return { count };
  }

  async markRead(userId: string, id: string): Promise<AppNotification> {
    const existing = await this.prisma.notification.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Уведомление не найдено');
    }

    const row = await this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
      include: { fromUser: { select: { username: true } } },
    });

    await this.invalidateUnread(userId);
    return this.mapNotification(row);
  }

  async markAllRead(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    await this.invalidateUnread(userId);
    return { count: result.count };
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.prisma.notification.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Уведомление не найдено');
    }

    await this.prisma.notification.delete({ where: { id } });
    await this.invalidateUnread(userId);
  }

  async sendDigestForUser(userId: string): Promise<number> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const rows = await this.prisma.notification.findMany({
      where: {
        userId,
        sentViaEmail: false,
        createdAt: { gte: since },
      },
      include: { fromUser: { select: { username: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    if (rows.length === 0) return 0;

    const items = rows.map((row) => this.mapNotification(row));
    const sent = await this.email.sendDigest(userId, items);
    if (!sent) return 0;

    await this.prisma.notification.updateMany({
      where: { id: { in: rows.map((row) => row.id) } },
      data: { sentViaEmail: true, sentViaEmailAt: new Date() },
    });

    return rows.length;
  }

  async broadcast(input: {
    type: NotificationType;
    title: string;
    message?: string;
    link?: string;
    priority?: NotificationPriority;
    userIds?: string[];
  }): Promise<{ count: number }> {
    const users = input.userIds?.length
      ? input.userIds.map((id) => ({ id }))
      : await this.prisma.user.findMany({
          where: { isBanned: false },
          select: { id: true },
        });

    let count = 0;
    for (const user of users) {
      try {
        await this.createNotification({
          userId: user.id,
          type: input.type,
          title: input.title,
          message: input.message,
          link: input.link,
          priority: input.priority ?? NotificationPriority.NORMAL,
        });
        count += 1;
      } catch (error) {
        this.logger.warn(`Broadcast failed for ${user.id}: ${String(error)}`);
      }
    }

    return { count };
  }

  async stats(): Promise<NotificationStats> {
    const [total, unread, sentViaEmail, sentViaPush, sentViaDiscord, byTypeRows, byPriorityRows] =
      await Promise.all([
        this.prisma.notification.count(),
        this.prisma.notification.count({ where: { isRead: false } }),
        this.prisma.notification.count({ where: { sentViaEmail: true } }),
        this.prisma.notification.count({ where: { sentViaPush: true } }),
        this.prisma.notification.count({ where: { sentViaDiscord: true } }),
        this.prisma.notification.groupBy({ by: ['type'], _count: { _all: true } }),
        this.prisma.notification.groupBy({ by: ['priority'], _count: { _all: true } }),
      ]);

    const byType: Record<string, number> = {};
    for (const row of byTypeRows) byType[row.type] = row._count._all;

    const byPriority: Record<string, number> = {};
    for (const row of byPriorityRows) byPriority[row.priority] = row._count._all;

    return {
      total,
      unread,
      sentViaEmail,
      sentViaPush,
      sentViaDiscord,
      byType,
      byPriority,
    };
  }

  private async persist(input: CreateNotificationInput): Promise<AppNotification> {
    const row = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message ?? null,
        link: input.link ?? null,
        imageUrl: input.imageUrl ?? null,
        fromUserId: input.fromUserId ?? null,
        metadata: input.metadata ?? undefined,
        groupKey: input.groupKey ?? null,
        priority: input.priority ?? NotificationPriority.NORMAL,
        actionUrl: input.actionUrl ?? null,
        actionLabel: input.actionLabel ?? null,
      },
      include: {
        fromUser: { select: { username: true } },
      },
    });

    return this.mapNotification(row);
  }

  private emptyNotification(input: CreateNotificationInput): AppNotification {
    return {
      id: 'skipped',
      type: input.type as SharedType,
      title: input.title,
      message: input.message ?? null,
      link: input.link ?? null,
      imageUrl: input.imageUrl ?? null,
      fromUserId: input.fromUserId ?? null,
      fromUsername: null,
      metadata: null,
      groupKey: input.groupKey ?? null,
      priority: (input.priority as SharedPriority) ?? 'NORMAL',
      actionUrl: input.actionUrl ?? null,
      actionLabel: input.actionLabel ?? null,
      isRead: true,
      readAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
  }

  private async invalidateUnread(userId: string): Promise<void> {
    await this.cache.del(cacheKeys.notificationsUnread(userId));
  }

  private mapNotification(row: {
    id: string;
    type: NotificationType;
    title: string;
    message: string | null;
    link: string | null;
    imageUrl: string | null;
    fromUserId: string | null;
    metadata: Prisma.JsonValue;
    groupKey?: string | null;
    priority?: NotificationPriority;
    actionUrl?: string | null;
    actionLabel?: string | null;
    isRead: boolean;
    readAt: Date | null;
    createdAt: Date;
    fromUser?: { username: string } | null;
  }): AppNotification {
    return {
      id: row.id,
      type: row.type as SharedType,
      title: row.title,
      message: row.message,
      link: row.link,
      imageUrl: row.imageUrl,
      fromUserId: row.fromUserId,
      fromUsername: row.fromUser?.username ?? null,
      metadata: (row.metadata as Record<string, unknown> | null) ?? null,
      groupKey: row.groupKey ?? null,
      priority: (row.priority as SharedPriority) ?? 'NORMAL',
      actionUrl: row.actionUrl ?? null,
      actionLabel: row.actionLabel ?? null,
      isRead: row.isRead,
      readAt: row.readAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
