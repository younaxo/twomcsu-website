import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import {
  AppNotification,
  NotificationsResponse,
  UnreadNotificationsCount,
} from '@twomc/shared';
import { CACHE_TTL, cacheKeys } from '../cache/cache.keys';
import { CacheService } from '../cache/cache.service';
import { PrismaService } from '../prisma/prisma.service';

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message?: string | null;
  link?: string | null;
  imageUrl?: string | null;
  fromUserId?: string | null;
  metadata?: Prisma.InputJsonValue | null;
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async createNotification(input: CreateNotificationInput): Promise<AppNotification> {
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
      },
      include: {
        fromUser: { select: { username: true } },
      },
    });

    await this.invalidateUnread(input.userId);
    return this.mapNotification(row);
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

  private async invalidateUnread(userId: string): Promise<void> {
    await this.cache.del(cacheKeys.notificationsUnread(userId));
  }

  private mapNotification(
    row: {
      id: string;
      type: NotificationType;
      title: string;
      message: string | null;
      link: string | null;
      imageUrl: string | null;
      fromUserId: string | null;
      metadata: Prisma.JsonValue;
      isRead: boolean;
      readAt: Date | null;
      createdAt: Date;
      fromUser?: { username: string } | null;
    },
  ): AppNotification {
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      link: row.link,
      imageUrl: row.imageUrl,
      fromUserId: row.fromUserId,
      fromUsername: row.fromUser?.username ?? null,
      metadata: (row.metadata as Record<string, unknown> | null) ?? null,
      isRead: row.isRead,
      readAt: row.readAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
