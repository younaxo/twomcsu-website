import { Injectable } from '@nestjs/common';
import { NewsStatus, OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminFinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getFinanceOverview() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [completed, today, week, month, refunded, pending] = await Promise.all([
      this.prisma.order.aggregate({
        where: { status: OrderStatus.COMPLETED },
        _sum: { total: true },
        _count: { _all: true },
        _avg: { total: true },
      }),
      this.prisma.order.aggregate({
        where: { status: OrderStatus.COMPLETED, createdAt: { gte: startOfDay } },
        _sum: { total: true },
        _count: { _all: true },
      }),
      this.prisma.order.aggregate({
        where: { status: OrderStatus.COMPLETED, createdAt: { gte: startOfWeek } },
        _sum: { total: true },
        _count: { _all: true },
      }),
      this.prisma.order.aggregate({
        where: { status: OrderStatus.COMPLETED, createdAt: { gte: startOfMonth } },
        _sum: { total: true },
        _count: { _all: true },
      }),
      this.prisma.order.aggregate({
        where: { status: OrderStatus.REFUNDED },
        _sum: { total: true },
        _count: { _all: true },
      }),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
    ]);

    return {
      revenueTotal: Number(completed._sum.total ?? 0),
      revenueToday: Number(today._sum.total ?? 0),
      revenueWeek: Number(week._sum.total ?? 0),
      revenueMonth: Number(month._sum.total ?? 0),
      ordersCompleted: completed._count._all,
      ordersToday: today._count._all,
      ordersWeek: week._count._all,
      ordersMonth: month._count._all,
      averageOrder: Number(completed._avg.total ?? 0),
      refundsTotal: Number(refunded._sum.total ?? 0),
      refundsCount: refunded._count._all,
      pendingOrders: pending,
    };
  }

  async listTransactions(opts: {
    page?: number;
    limit?: number;
    status?: OrderStatus;
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
  }) {
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(100, Math.max(1, opts.limit ?? 25));
    const where: Prisma.OrderWhereInput = {
      ...(opts.status ? { status: opts.status } : {}),
      ...(opts.dateFrom || opts.dateTo
        ? {
            createdAt: {
              ...(opts.dateFrom ? { gte: opts.dateFrom } : {}),
              ...(opts.dateTo ? { lte: opts.dateTo } : {}),
            },
          }
        : {}),
      ...(opts.search
        ? {
            OR: [
              { orderNumber: { contains: opts.search, mode: 'insensitive' } },
              { user: { username: { contains: opts.search, mode: 'insensitive' } } },
              { guestMinecraftNick: { contains: opts.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, username: true, avatar: true, shortId: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        orderNumber: row.orderNumber,
        status: row.status,
        total: Number(row.total),
        paymentMethod: row.paymentMethod,
        user: row.user,
        guestMinecraftNick: row.guestMinecraftNick,
        createdAt: row.createdAt.toISOString(),
        paidAt: row.paidAt?.toISOString() ?? null,
        refundedAt: row.refundedAt?.toISOString() ?? null,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }

  async listRefunds(opts: { page?: number; limit?: number }) {
    return this.listTransactions({
      ...opts,
      status: OrderStatus.REFUNDED,
    });
  }

  async getContentDashboard() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      newsTotal,
      newsPublished,
      newsDrafts,
      newsThisWeek,
      commentsTotal,
      commentsToday,
      profileCommentsToday,
      topicsTotal,
    ] = await Promise.all([
      this.prisma.news.count(),
      this.prisma.news.count({ where: { status: NewsStatus.PUBLISHED } }),
      this.prisma.news.count({ where: { status: NewsStatus.DRAFT } }),
      this.prisma.news.count({
        where: { status: NewsStatus.PUBLISHED, publishedAt: { gte: startOfWeek } },
      }),
      this.prisma.newsComment.count(),
      this.prisma.newsComment.count({ where: { createdAt: { gte: startOfDay } } }),
      this.prisma.profileComment.count({ where: { createdAt: { gte: startOfDay } } }),
      this.prisma.topic.count(),
    ]);

    return {
      news: {
        total: newsTotal,
        published: newsPublished,
        drafts: newsDrafts,
        publishedThisWeek: newsThisWeek,
      },
      comments: {
        newsTotal: commentsTotal,
        newsToday: commentsToday,
        profileToday: profileCommentsToday,
      },
      topics: { total: topicsTotal },
    };
  }
}
