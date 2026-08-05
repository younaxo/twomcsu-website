import { Injectable } from '@nestjs/common';
import {
  NewsStatus,
  OrderStatus,
  Prisma,
  ReportStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type DayCountRow = { date: Date; count: bigint | number };
type DayRevenueRow = { date: Date; total: Prisma.Decimal | number };
type ReportTypeRow = { type: string; count: bigint | number };
type ServerOnlineRow = {
  hour: Date;
  serverId: string;
  serverName: string;
  playerCount: number;
};

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardOverview() {
    const now = Date.now();
    const last5min = new Date(now - 5 * 60 * 1000);
    const last24h = new Date(now - 24 * 60 * 60 * 1000);
    const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const overdueCutoff = new Date(now - 24 * 60 * 60 * 1000);

    const [
      usersTotal,
      usersNew24h,
      usersNew7d,
      usersNew30d,
      onlineNow,
      onlineInGame,
      activeBans,
      ordersTotal,
      ordersToday,
      ordersWeek,
      revenueTotal,
      revenueToday,
      revenueWeek,
      revenueMonth,
      reportsTotal,
      reportsPending,
      reportsInReview,
      reportsResolved,
      overduePending,
      serversTotal,
      commentsToday,
      chatMessagesToday,
      newsPublishedThisWeek,
      latestServerLogs,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: last24h } } }),
      this.prisma.user.count({ where: { createdAt: { gte: last7d } } }),
      this.prisma.user.count({ where: { createdAt: { gte: last30d } } }),
      this.prisma.user.count({ where: { lastActivityAt: { gte: last5min } } }),
      this.prisma.user.count({ where: { isOnlineInGame: true } }),
      this.prisma.user.count({ where: { isBanned: true } }),
      this.prisma.order.count({ where: { status: { not: OrderStatus.CANCELLED } } }),
      this.prisma.order.count({
        where: { createdAt: { gte: startOfDay }, status: { not: OrderStatus.CANCELLED } },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: startOfWeek }, status: { not: OrderStatus.CANCELLED } },
      }),
      this.prisma.order.aggregate({
        where: { status: OrderStatus.COMPLETED },
        _sum: { total: true },
        _avg: { total: true },
      }),
      this.prisma.order.aggregate({
        where: { status: OrderStatus.COMPLETED, createdAt: { gte: startOfDay } },
        _sum: { total: true },
      }),
      this.prisma.order.aggregate({
        where: { status: OrderStatus.COMPLETED, createdAt: { gte: startOfWeek } },
        _sum: { total: true },
      }),
      this.prisma.order.aggregate({
        where: { status: OrderStatus.COMPLETED, createdAt: { gte: startOfMonth } },
        _sum: { total: true },
      }),
      this.prisma.report.count({ where: { isArchived: false } }),
      this.prisma.report.count({
        where: { isArchived: false, status: ReportStatus.PENDING },
      }),
      this.prisma.report.count({
        where: { isArchived: false, status: ReportStatus.IN_REVIEW },
      }),
      this.prisma.report.count({
        where: {
          isArchived: false,
          status: { in: [ReportStatus.RESOLVED, ReportStatus.CLOSED] },
        },
      }),
      this.prisma.report.count({
        where: {
          isArchived: false,
          status: ReportStatus.PENDING,
          updatedAt: { lt: overdueCutoff },
        },
      }),
      this.prisma.server.count({ where: { isActive: true } }),
      this.prisma.profileComment.count({ where: { createdAt: { gte: startOfDay } } }),
      this.prisma.chatMessage.count({ where: { createdAt: { gte: startOfDay } } }),
      this.prisma.news.count({
        where: {
          status: NewsStatus.PUBLISHED,
          publishedAt: { gte: startOfWeek },
        },
      }),
      this.prisma.server.findMany({
        where: { isActive: true },
        select: {
          id: true,
          statusLogs: {
            orderBy: { timestamp: 'desc' },
            take: 1,
            select: { online: true, playerCount: true },
          },
        },
      }),
    ]);

    const serversOnline = latestServerLogs.filter((s) => s.statusLogs[0]?.online).length;
    const totalPlayersOnline = latestServerLogs.reduce(
      (sum, s) => sum + (s.statusLogs[0]?.online ? s.statusLogs[0].playerCount : 0),
      0,
    );

    const previousDayStart = new Date(startOfDay.getTime() - 24 * 60 * 60 * 1000);
    const [usersPrev24h, revenuePrevDay, pendingPrev] = await Promise.all([
      this.prisma.user.count({
        where: { createdAt: { gte: previousDayStart, lt: startOfDay } },
      }),
      this.prisma.order.aggregate({
        where: {
          status: OrderStatus.COMPLETED,
          createdAt: { gte: previousDayStart, lt: startOfDay },
        },
        _sum: { total: true },
      }),
      this.prisma.report.count({
        where: {
          isArchived: false,
          status: ReportStatus.PENDING,
          createdAt: { lt: startOfDay },
        },
      }),
    ]);

    return {
      users: {
        total: usersTotal,
        new24h: usersNew24h,
        new7d: usersNew7d,
        new30d: usersNew30d,
        onlineNow,
        onlineInGame,
        activeBans,
        change24hPct: pctChange(usersNew24h, usersPrev24h),
      },
      orders: {
        total: ordersTotal,
        today: ordersToday,
        week: ordersWeek,
        revenueTotal: Number(revenueTotal._sum.total ?? 0),
        revenueToday: Number(revenueToday._sum.total ?? 0),
        revenueWeek: Number(revenueWeek._sum.total ?? 0),
        revenueMonth: Number(revenueMonth._sum.total ?? 0),
        averageOrder: Number(revenueTotal._avg.total ?? 0),
        revenueChangePct: pctChange(
          Number(revenueToday._sum.total ?? 0),
          Number(revenuePrevDay._sum.total ?? 0),
        ),
      },
      reports: {
        total: reportsTotal,
        pending: reportsPending,
        inReview: reportsInReview,
        resolved: reportsResolved,
        overduePending,
        pendingChangePct: pctChange(reportsPending, pendingPrev),
      },
      servers: {
        total: serversTotal,
        online: serversOnline,
        totalPlayersOnline,
      },
      activity: {
        commentsToday,
        chatMessagesToday,
        newsPublishedThisWeek,
      },
    };
  }

  async getUsersChartData(days = 30) {
    const safeDays = clampDays(days);
    const daysAgo = daysAgoDate(safeDays);
    const rows = await this.prisma.$queryRaw<DayCountRow[]>`
      SELECT DATE("createdAt") as date, COUNT(*)::int as count
      FROM "users"
      WHERE "createdAt" >= ${daysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;
    return fillDaySeries(
      safeDays,
      rows.map((r) => ({ date: toDateKey(r.date), value: Number(r.count) })),
      'count',
    );
  }

  async getRevenueChartData(days = 30) {
    const safeDays = clampDays(days);
    const daysAgo = daysAgoDate(safeDays);
    const rows = await this.prisma.$queryRaw<DayRevenueRow[]>`
      SELECT DATE("createdAt") as date, COALESCE(SUM("total"), 0) as total
      FROM "orders"
      WHERE "createdAt" >= ${daysAgo} AND "status" = 'COMPLETED'
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;
    return fillDaySeries(
      safeDays,
      rows.map((r) => ({ date: toDateKey(r.date), value: Number(r.total) })),
      'total',
    );
  }

  async getReportsChartData(days = 30) {
    const safeDays = clampDays(days);
    const daysAgo = daysAgoDate(safeDays);
    const rows = await this.prisma.$queryRaw<ReportTypeRow[]>`
      SELECT "type"::text as type, COUNT(*)::int as count
      FROM "reports"
      WHERE "createdAt" >= ${daysAgo} AND "isArchived" = false
      GROUP BY "type"
      ORDER BY count DESC
    `;
    return rows.map((r) => ({ type: r.type, count: Number(r.count) }));
  }

  async getServerOnlineChartData(hours = 24) {
    const safeHours = Math.min(168, Math.max(1, Math.floor(hours)));
    const since = new Date(Date.now() - safeHours * 60 * 60 * 1000);
    const rows = await this.prisma.$queryRaw<ServerOnlineRow[]>`
      SELECT
        date_trunc('hour', l."timestamp") as hour,
        l."serverId" as "serverId",
        s."name" as "serverName",
        ROUND(AVG(l."playerCount"))::int as "playerCount"
      FROM "server_status_logs" l
      JOIN "servers" s ON s."id" = l."serverId"
      WHERE l."timestamp" >= ${since}
      GROUP BY date_trunc('hour', l."timestamp"), l."serverId", s."name"
      ORDER BY hour ASC
    `;

    const hoursKeys: string[] = [];
    for (let i = safeHours - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 60 * 60 * 1000);
      d.setMinutes(0, 0, 0);
      hoursKeys.push(d.toISOString());
    }

    const serverNames = [...new Set(rows.map((r) => r.serverName))];
    return hoursKeys.map((hour) => {
      const point: Record<string, string | number> = { hour };
      for (const name of serverNames) {
        const match = rows.find(
          (r) => r.serverName === name && new Date(r.hour).toISOString() === hour,
        );
        point[name] = match?.playerCount ?? 0;
      }
      return point;
    });
  }

  async getTopProducts(limit = 10) {
    const take = Math.min(50, Math.max(1, Math.floor(limit)));
    const grouped = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        productId: { not: null },
        order: { status: OrderStatus.COMPLETED },
      },
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take,
    });

    const productIds = grouped
      .map((g) => g.productId)
      .filter((id): id is string => Boolean(id));
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, slug: true, image: true },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    return grouped.map((g, index) => {
      const product = g.productId ? byId.get(g.productId) : null;
      return {
        rank: index + 1,
        productId: g.productId,
        name: product?.name ?? 'Удалённый товар',
        slug: product?.slug ?? null,
        image: product?.image ?? null,
        sold: g._sum.quantity ?? 0,
        revenue: Number(g._sum.totalPrice ?? 0),
      };
    });
  }

  async getTopBuyers(limit = 10) {
    const take = Math.min(50, Math.max(1, Math.floor(limit)));
    const grouped = await this.prisma.order.groupBy({
      by: ['userId'],
      where: { status: OrderStatus.COMPLETED },
      _sum: { total: true },
      _count: { _all: true },
      orderBy: { _sum: { total: 'desc' } },
      take,
    });

    const userIds = grouped
      .map((g) => g.userId)
      .filter((id): id is string => typeof id === 'string');

    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, avatar: true, shortId: true, tag: true },
    });
    const byId = new Map(users.map((u) => [u.id, u]));

    return grouped.map((g, index) => ({
      rank: index + 1,
      user: g.userId ? byId.get(g.userId) ?? null : null,
      totalSpent: Number(g._sum.total ?? 0),
      ordersCount: g._count._all,
    }));
  }

  async getModeratorActivity(days = 30) {
    const safeDays = clampDays(days);
    const since = daysAgoDate(safeDays);
    const resolved = await this.prisma.report.findMany({
      where: {
        resolvedAt: { gte: since },
        assignedToId: { not: null },
        status: { in: [ReportStatus.RESOLVED, ReportStatus.REJECTED, ReportStatus.CLOSED] },
      },
      select: { assignedToId: true },
    });

    const counts = new Map<string, number>();
    for (const row of resolved) {
      if (!row.assignedToId) continue;
      counts.set(row.assignedToId, (counts.get(row.assignedToId) ?? 0) + 1);
    }

    const moderators = await this.prisma.user.findMany({
      where: { id: { in: [...counts.keys()] } },
      select: { id: true, username: true, avatar: true },
    });

    return moderators
      .map((mod) => ({
        userId: mod.id,
        username: mod.username,
        avatar: mod.avatar,
        resolvedCount: counts.get(mod.id) ?? 0,
      }))
      .sort((a, b) => b.resolvedCount - a.resolvedCount);
  }

  async getAuditLogStats(days = 30) {
    const safeDays = clampDays(days);
    const since = daysAgoDate(safeDays);

    const [byAction, bySeverity, topActors, total] = await Promise.all([
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
        orderBy: { _count: { action: 'desc' } },
        take: 20,
      }),
      this.prisma.auditLog.groupBy({
        by: ['severity'],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
      }),
      this.prisma.auditLog.groupBy({
        by: ['actorId'],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
        orderBy: { _count: { actorId: 'desc' } },
        take: 10,
      }),
      this.prisma.auditLog.count({ where: { createdAt: { gte: since } } }),
    ]);

    const actors = await this.prisma.user.findMany({
      where: { id: { in: topActors.map((a) => a.actorId) } },
      select: { id: true, username: true, avatar: true },
    });
    const actorMap = new Map(actors.map((a) => [a.id, a]));

    return {
      total,
      byAction: byAction.map((row) => ({
        action: row.action,
        count: row._count._all,
      })),
      bySeverity: bySeverity.map((row) => ({
        severity: row.severity,
        count: row._count._all,
      })),
      topActors: topActors.map((row) => ({
        actor: actorMap.get(row.actorId) ?? null,
        count: row._count._all,
      })),
    };
  }
}

function clampDays(days: number): number {
  return Math.min(365, Math.max(1, Math.floor(days || 30)));
}

function daysAgoDate(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function toDateKey(value: Date | string): string {
  const d = value instanceof Date ? value : new Date(value);
  return d.toISOString().slice(0, 10);
}

function fillDaySeries(
  days: number,
  rows: Array<{ date: string; value: number }>,
  valueKey = 'count',
): Array<{ date: string } & Record<string, number>> {
  const map = new Map(rows.map((r) => [r.date, r.value]));
  const result: Array<{ date: string } & Record<string, number>> = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, [valueKey]: map.get(key) ?? 0 } as {
      date: string;
    } & Record<string, number>);
  }
  return result;
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
