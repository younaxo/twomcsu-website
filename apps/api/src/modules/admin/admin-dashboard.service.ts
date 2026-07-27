import { Injectable } from '@nestjs/common';
import {
  CommentReportStatus,
  MediaBadgeRequestStatus,
  NotificationType,
  OrderStatus,
  ProfileReportStatus,
} from '@prisma/client';
import { RoleGroup } from '@twomc/shared';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class AdminDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly notifications: NotificationsService,
  ) {}

  async getDashboard() {
    return this.cache.wrap('admin:dashboard', 60, async () => {
      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const [
        totalUsers,
        users24h,
        onlineInGame,
        ordersToday,
        revenueToday,
        openReports,
        commentReports,
        mediaPending,
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { createdAt: { gte: since24h } } }),
        this.prisma.user.count({ where: { isOnlineInGame: true } }),
        this.prisma.order.count({
          where: { createdAt: { gte: startOfDay }, status: { not: OrderStatus.CANCELLED } },
        }),
        this.prisma.order.aggregate({
          where: {
            createdAt: { gte: startOfDay },
            status: OrderStatus.COMPLETED,
          },
          _sum: { total: true },
        }),
        this.prisma.profileReport.count({ where: { status: ProfileReportStatus.PENDING } }),
        this.prisma.commentReport.count({ where: { status: CommentReportStatus.PENDING } }),
        this.prisma.mediaBadgeRequest.count({
          where: { status: MediaBadgeRequestStatus.PENDING },
        }),
      ]);

      const registrations = await this.registrationsLast30Days();
      const revenue = await this.revenueLast30Days();

      return {
        totalUsers,
        users24h,
        onlineInGame,
        siteOnline: 0,
        ordersToday,
        revenueToday: Number(revenueToday._sum.total ?? 0),
        openReports,
        commentReports,
        mediaPending,
        registrations,
        revenue,
      };
    });
  }

  async broadcast(input: {
    title: string;
    message?: string;
    link?: string;
    roleGroup?: RoleGroup;
  }): Promise<{ count: number }> {
    const users = await this.prisma.user.findMany({
      where: {
        isBanned: false,
        ...(input.roleGroup ? { roleGroup: input.roleGroup } : {}),
      },
      select: { id: true },
    });

    let count = 0;
    for (const user of users) {
      await this.notifications.createNotification({
        userId: user.id,
        type: NotificationType.SYSTEM,
        title: input.title,
        message: input.message ?? null,
        link: input.link ?? null,
      });
      count += 1;
    }

    return { count };
  }

  async getSettings(): Promise<Record<string, string>> {
    const rows = await this.prisma.siteSetting.findMany();
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }

  async upsertSettings(entries: Record<string, string>): Promise<Record<string, string>> {
    await Promise.all(
      Object.entries(entries).map(([key, value]) =>
        this.prisma.siteSetting.upsert({
          where: { key },
          create: { key, value },
          update: { value },
        }),
      ),
    );
    return this.getSettings();
  }

  async listAnnouncements() {
    const rows = await this.prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => ({
      ...r,
      startsAt: r.startsAt?.toISOString() ?? null,
      endsAt: r.endsAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  async createAnnouncement(data: {
    title: string;
    message: string;
    type?: string;
    link?: string | null;
    isActive?: boolean;
    startsAt?: string | null;
    endsAt?: string | null;
  }) {
    const row = await this.prisma.announcement.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type ?? 'info',
        link: data.link ?? null,
        isActive: data.isActive ?? true,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
      },
    });
    return {
      ...row,
      startsAt: row.startsAt?.toISOString() ?? null,
      endsAt: row.endsAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async updateAnnouncement(
    id: string,
    data: Partial<{
      title: string;
      message: string;
      type: string;
      link: string | null;
      isActive: boolean;
      startsAt: string | null;
      endsAt: string | null;
    }>,
  ) {
    const row = await this.prisma.announcement.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.message !== undefined ? { message: data.message } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.link !== undefined ? { link: data.link } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.startsAt !== undefined
          ? { startsAt: data.startsAt ? new Date(data.startsAt) : null }
          : {}),
        ...(data.endsAt !== undefined
          ? { endsAt: data.endsAt ? new Date(data.endsAt) : null }
          : {}),
      },
    });
    return {
      ...row,
      startsAt: row.startsAt?.toISOString() ?? null,
      endsAt: row.endsAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async deleteAnnouncement(id: string): Promise<void> {
    await this.prisma.announcement.delete({ where: { id } });
  }

  private async registrationsLast30Days() {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const users = await this.prisma.user.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    });
    const map = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
      map.set(d.toISOString().slice(0, 10), 0);
    }
    for (const u of users) {
      const key = u.createdAt.toISOString().slice(0, 10);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()].map(([date, count]) => ({ date, count }));
  }

  private async revenueLast30Days() {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: since },
        status: OrderStatus.COMPLETED,
      },
      select: { createdAt: true, total: true },
    });
    const map = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
      map.set(d.toISOString().slice(0, 10), 0);
    }
    for (const o of orders) {
      const key = o.createdAt.toISOString().slice(0, 10);
      map.set(key, (map.get(key) ?? 0) + Number(o.total));
    }
    return [...map.entries()].map(([date, total]) => ({ date, total }));
  }
}
