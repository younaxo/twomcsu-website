import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import {
  AdminStoreStatsBreakdown,
  AdminStoreStatsOverview,
  AdminStoreStatsPoint,
  AdminStoreStatsResponse,
} from '@twomc/shared';
import { CACHE_TTL, cacheKeys } from '../cache/cache.keys';
import { CacheService } from '../cache/cache.service';
import { PrismaService } from '../prisma/prisma.service';
import { decimalToNumber } from './store.mapper';

@Injectable()
export class StatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async getAll(): Promise<AdminStoreStatsResponse> {
    return this.cache.wrap(
      cacheKeys.storeAdminStats('all'),
      CACHE_TTL.STORE_ADMIN_STATS,
      async () => {
        const [overview, revenueOverTime, byCategory, byProductType, topProducts] =
          await Promise.all([
            this.overviewUncached(),
            this.salesByDayUncached(30),
            this.salesByCategoryUncached(),
            this.salesByProductTypeUncached(),
            this.topProductsUncached(5),
          ]);

        return {
          overview,
          revenueOverTime,
          byCategory,
          byProductType,
          topProducts,
        };
      },
    );
  }

  async overview(): Promise<AdminStoreStatsOverview> {
    return this.cache.wrap(
      cacheKeys.storeAdminStats('overview'),
      CACHE_TTL.STORE_ADMIN_STATS,
      () => this.overviewUncached(),
    );
  }

  async salesByDay(days = 30): Promise<AdminStoreStatsPoint[]> {
    const safeDays = Math.min(365, Math.max(1, days));
    return this.cache.wrap(
      cacheKeys.storeAdminStats(`sales-by-day:${safeDays}`),
      CACHE_TTL.STORE_ADMIN_STATS,
      () => this.salesByDayUncached(safeDays),
    );
  }

  async salesByCategory(): Promise<AdminStoreStatsBreakdown[]> {
    return this.cache.wrap(
      cacheKeys.storeAdminStats('sales-by-category'),
      CACHE_TTL.STORE_ADMIN_STATS,
      () => this.salesByCategoryUncached(),
    );
  }

  async topProducts(limit = 5): Promise<AdminStoreStatsBreakdown[]> {
    const safeLimit = Math.min(50, Math.max(1, limit));
    return this.cache.wrap(
      cacheKeys.storeAdminStats(`top-products:${safeLimit}`),
      CACHE_TTL.STORE_ADMIN_STATS,
      () => this.topProductsUncached(safeLimit),
    );
  }

  async revenueByWeek(weeks = 12): Promise<AdminStoreStatsPoint[]> {
    const safeWeeks = Math.min(104, Math.max(1, weeks));
    return this.cache.wrap(
      cacheKeys.storeAdminStats(`revenue-by-week:${safeWeeks}`),
      CACHE_TTL.STORE_ADMIN_STATS,
      () => this.revenueByWeekUncached(safeWeeks),
    );
  }

  private async overviewUncached(): Promise<AdminStoreStatsOverview> {
    const [pending, completed, cancelled, refunded, revenueAgg, productsSold] =
      await this.prisma.$transaction([
        this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
        this.prisma.order.count({ where: { status: OrderStatus.COMPLETED } }),
        this.prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
        this.prisma.order.count({ where: { status: OrderStatus.REFUNDED } }),
        this.prisma.order.aggregate({
          where: { status: OrderStatus.COMPLETED },
          _sum: { total: true },
        }),
        this.prisma.orderItem.aggregate({
          where: { order: { status: OrderStatus.COMPLETED } },
          _sum: { quantity: true },
        }),
      ]);

    const revenue = decimalToNumber(revenueAgg._sum.total ?? 0);
    const ordersCount = completed;

    return {
      revenue,
      ordersCount,
      averageOrder: ordersCount > 0 ? Math.round((revenue / ordersCount) * 100) / 100 : 0,
      productsSold: productsSold._sum.quantity ?? 0,
      pending,
      completed,
      cancelled,
      refunded,
    };
  }

  private async salesByDayUncached(days: number): Promise<AdminStoreStatsPoint[]> {
    const since = startOfDay(addDays(new Date(), -(days - 1)));

    const orders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.COMPLETED,
        paidAt: { gte: since },
      },
      select: { total: true, paidAt: true, createdAt: true },
    });

    const buckets = new Map<string, { revenue: number; orders: number }>();
    for (let i = 0; i < days; i++) {
      const key = formatDateKey(addDays(since, i));
      buckets.set(key, { revenue: 0, orders: 0 });
    }

    for (const order of orders) {
      const key = formatDateKey(order.paidAt ?? order.createdAt);
      const bucket = buckets.get(key);
      if (!bucket) continue;
      bucket.revenue += decimalToNumber(order.total);
      bucket.orders += 1;
    }

    return [...buckets.entries()].map(([date, value]) => ({
      date,
      revenue: Math.round(value.revenue * 100) / 100,
      orders: value.orders,
    }));
  }

  private async salesByCategoryUncached(): Promise<AdminStoreStatsBreakdown[]> {
    const items = await this.prisma.orderItem.findMany({
      where: {
        order: { status: OrderStatus.COMPLETED },
        productId: { not: null },
      },
      select: {
        totalPrice: true,
        product: {
          select: {
            category: { select: { name: true } },
          },
        },
      },
    });

    const totals = new Map<string, number>();
    for (const item of items) {
      const name = item.product?.category?.name ?? 'Без категории';
      totals.set(name, (totals.get(name) ?? 0) + decimalToNumber(item.totalPrice));
    }

    return [...totals.entries()]
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  }

  private async salesByProductTypeUncached(): Promise<AdminStoreStatsBreakdown[]> {
    const items = await this.prisma.orderItem.findMany({
      where: {
        order: { status: OrderStatus.COMPLETED },
        productId: { not: null },
      },
      select: {
        totalPrice: true,
        product: { select: { type: true } },
      },
    });

    const totals = new Map<string, number>();
    for (const item of items) {
      const name = item.product?.type ?? 'OTHER';
      totals.set(name, (totals.get(name) ?? 0) + decimalToNumber(item.totalPrice));
    }

    return [...totals.entries()]
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  }

  private async topProductsUncached(limit: number): Promise<AdminStoreStatsBreakdown[]> {
    const grouped = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: { status: OrderStatus.COMPLETED },
        productId: { not: null },
      },
      _sum: { totalPrice: true, quantity: true },
      orderBy: { _sum: { totalPrice: 'desc' } },
      take: limit,
    });

    const productIds = grouped
      .map((row) => row.productId)
      .filter((id): id is string => Boolean(id));

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });
    const nameById = new Map(products.map((p) => [p.id, p.name]));

    return grouped.map((row) => ({
      name: nameById.get(row.productId!) ?? 'Товар',
      value: Math.round(decimalToNumber(row._sum.totalPrice ?? 0) * 100) / 100,
    }));
  }

  private async revenueByWeekUncached(weeks: number): Promise<AdminStoreStatsPoint[]> {
    const since = startOfWeek(addDays(new Date(), -(weeks - 1) * 7));

    const orders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.COMPLETED,
        paidAt: { gte: since },
      },
      select: { total: true, paidAt: true, createdAt: true },
    });

    const buckets = new Map<string, { revenue: number; orders: number }>();
    for (let i = 0; i < weeks; i++) {
      const key = formatDateKey(addDays(since, i * 7));
      buckets.set(key, { revenue: 0, orders: 0 });
    }

    for (const order of orders) {
      const weekStart = startOfWeek(order.paidAt ?? order.createdAt);
      const key = formatDateKey(weekStart);
      const bucket = buckets.get(key);
      if (!bucket) continue;
      bucket.revenue += decimalToNumber(order.total);
      bucket.orders += 1;
    }

    return [...buckets.entries()].map(([date, value]) => ({
      date,
      revenue: Math.round(value.revenue * 100) / 100,
      orders: value.orders,
    }));
  }
}

function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfWeek(date: Date): Date {
  const next = startOfDay(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  return next;
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
