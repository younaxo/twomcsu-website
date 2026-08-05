import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ExportFormat, ExportService } from '../export/export.service';

@Injectable()
export class AdminToolsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly exportService: ExportService,
  ) {}

  // ── Saved filters ──────────────────────────────────────────────

  listSavedFilters(userId: string, page?: string) {
    return this.prisma.savedFilter.findMany({
      where: {
        userId,
        ...(page ? { page } : {}),
      },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async createSavedFilter(
    userId: string,
    data: { name: string; page: string; filters: Prisma.InputJsonValue; isDefault?: boolean },
  ) {
    if (data.isDefault) {
      await this.prisma.savedFilter.updateMany({
        where: { userId, page: data.page, isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.savedFilter.create({
      data: {
        userId,
        name: data.name,
        page: data.page,
        filters: data.filters,
        isDefault: data.isDefault ?? false,
      },
    });
  }

  async updateSavedFilter(
    userId: string,
    id: string,
    data: Partial<{
      name: string;
      filters: Prisma.InputJsonValue;
      isDefault: boolean;
    }>,
  ) {
    const existing = await this.prisma.savedFilter.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Фильтр не найден');

    if (data.isDefault) {
      await this.prisma.savedFilter.updateMany({
        where: { userId, page: existing.page, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.savedFilter.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.filters !== undefined ? { filters: data.filters } : {}),
        ...(data.isDefault !== undefined ? { isDefault: data.isDefault } : {}),
      },
    });
  }

  async deleteSavedFilter(userId: string, id: string) {
    const existing = await this.prisma.savedFilter.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Фильтр не найден');
    await this.prisma.savedFilter.delete({ where: { id } });
    return { ok: true };
  }

  // ── Bookmarks ──────────────────────────────────────────────────

  listBookmarks(userId: string) {
    return this.prisma.adminBookmark.findMany({
      where: { userId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
  }

  createBookmark(
    userId: string,
    data: { url: string; title: string; icon?: string; order?: number },
  ) {
    return this.prisma.adminBookmark.create({
      data: {
        userId,
        url: data.url,
        title: data.title,
        icon: data.icon,
        order: data.order ?? 0,
      },
    });
  }

  async updateBookmark(
    userId: string,
    id: string,
    data: Partial<{ url: string; title: string; icon: string | null; order: number }>,
  ) {
    const existing = await this.prisma.adminBookmark.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Закладка не найдена');
    return this.prisma.adminBookmark.update({ where: { id }, data });
  }

  async deleteBookmark(userId: string, id: string) {
    const existing = await this.prisma.adminBookmark.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Закладка не найдена');
    await this.prisma.adminBookmark.delete({ where: { id } });
    return { ok: true };
  }

  async reorderBookmarks(userId: string, orderedIds: string[]) {
    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.adminBookmark.updateMany({
          where: { id, userId },
          data: { order: index },
        }),
      ),
    );
    return this.listBookmarks(userId);
  }

  // ── Scheduled exports ──────────────────────────────────────────

  listScheduledExports(userId: string) {
    return this.prisma.scheduledExport.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  createScheduledExport(
    userId: string,
    data: {
      name: string;
      page: string;
      format: string;
      schedule: string;
      email?: string;
      filters?: Prisma.InputJsonValue;
      nextRunAt?: string;
    },
  ) {
    if (!['csv', 'excel', 'pdf'].includes(data.format)) {
      throw new BadRequestException('Неподдерживаемый формат');
    }
    return this.prisma.scheduledExport.create({
      data: {
        userId,
        name: data.name,
        page: data.page,
        format: data.format,
        schedule: data.schedule,
        email: data.email,
        filters: data.filters ?? undefined,
        nextRunAt: data.nextRunAt ? new Date(data.nextRunAt) : computeNextRun(data.schedule),
      },
    });
  }

  async updateScheduledExport(
    userId: string,
    id: string,
    data: Partial<{
      name: string;
      format: string;
      schedule: string;
      email: string | null;
      filters: Prisma.InputJsonValue;
      isActive: boolean;
    }>,
  ) {
    const existing = await this.prisma.scheduledExport.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Экспорт не найден');

    return this.prisma.scheduledExport.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.format !== undefined ? { format: data.format } : {}),
        ...(data.schedule !== undefined
          ? { schedule: data.schedule, nextRunAt: computeNextRun(data.schedule) }
          : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.filters !== undefined ? { filters: data.filters } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
  }

  async deleteScheduledExport(userId: string, id: string) {
    const existing = await this.prisma.scheduledExport.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Экспорт не найден');
    await this.prisma.scheduledExport.delete({ where: { id } });
    return { ok: true };
  }

  @Cron(CronExpression.EVERY_HOUR)
  async runDueScheduledExports() {
    const due = await this.prisma.scheduledExport.findMany({
      where: {
        isActive: true,
        nextRunAt: { lte: new Date() },
      },
      take: 20,
    });

    for (const job of due) {
      try {
        await this.runScheduledExport(job.id);
      } catch {
        // Keep other jobs running
      }
    }
  }

  private async runScheduledExport(id: string) {
    const job = await this.prisma.scheduledExport.findUnique({ where: { id } });
    if (!job || !job.isActive) return;

    const filters = (job.filters as Record<string, unknown> | null) ?? {};
    const format = job.format as ExportFormat;

    switch (job.page) {
      case 'admin/users':
        await this.exportService.exportUsers(
          {
            search: typeof filters.search === 'string' ? filters.search : undefined,
            roleGroup: typeof filters.roleGroup === 'string' ? filters.roleGroup : undefined,
            isBanned: typeof filters.isBanned === 'boolean' ? filters.isBanned : undefined,
          },
          format,
        );
        break;
      case 'admin/orders':
        await this.exportService.exportOrders({}, format);
        break;
      case 'admin/reports':
        await this.exportService.exportReports({}, format);
        break;
      case 'admin/news':
        await this.exportService.exportNews({}, format);
        break;
      case 'admin/audit-log':
        await this.exportService.exportAuditLog({}, format);
        break;
      default:
        break;
    }

    await this.prisma.scheduledExport.update({
      where: { id },
      data: {
        lastRunAt: new Date(),
        nextRunAt: computeNextRun(job.schedule),
      },
    });
  }

  // ── Site settings ──────────────────────────────────────────────

  async getSiteSettings() {
    const existing = await this.prisma.siteSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    });
    if (existing) return existing;
    return this.prisma.siteSettings.create({ data: {} });
  }

  async updateSiteSettings(userId: string, data: Prisma.SiteSettingsUpdateInput) {
    const current = await this.getSiteSettings();
    return this.prisma.siteSettings.update({
      where: { id: current.id },
      data: { ...data, updatedBy: userId },
    });
  }

  // ── Security ───────────────────────────────────────────────────

  async listActiveSessions(opts: { page?: number; limit?: number; userId?: string }) {
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(100, Math.max(1, opts.limit ?? 50));
    const where: Prisma.RefreshTokenWhereInput = {
      revokedAt: null,
      expiresAt: { gt: new Date() },
      ...(opts.userId ? { userId: opts.userId } : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.refreshToken.count({ where }),
      this.prisma.refreshToken.findMany({
        where,
        include: {
          user: { select: { id: true, username: true, avatar: true, roleGroup: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        user: row.user,
        userAgent: row.userAgent,
        ipAddress: row.ipAddress,
        createdAt: row.createdAt.toISOString(),
        expiresAt: row.expiresAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }

  async listSuspiciousActivity() {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [failedLogins, criticalAudit, multiIp] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: {
          createdAt: { gte: since },
          OR: [
            { action: { contains: 'login.fail', mode: 'insensitive' } },
            { severity: 'critical' },
          ],
        },
        include: { actor: { select: { id: true, username: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.auditLog.count({
        where: { createdAt: { gte: since }, severity: 'critical' },
      }),
      this.prisma.$queryRaw<Array<{ userId: string; ips: bigint }>>`
        SELECT "userId", COUNT(DISTINCT "ipAddress") as ips
        FROM "refresh_tokens"
        WHERE "createdAt" >= ${since} AND "ipAddress" IS NOT NULL
        GROUP BY "userId"
        HAVING COUNT(DISTINCT "ipAddress") >= 4
        LIMIT 20
      `,
    ]);

    return {
      criticalCount: criticalAudit,
      recent: failedLogins.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
      })),
      multiIpUsers: multiIp.map((row) => ({
        userId: row.userId,
        distinctIps: Number(row.ips),
      })),
    };
  }

  async listLoginHistory(opts: { userId?: string; page?: number; limit?: number }) {
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(100, Math.max(1, opts.limit ?? 50));
    const where: Prisma.AuditLogWhereInput = {
      action: { contains: 'login', mode: 'insensitive' },
      ...(opts.userId ? { actorId: opts.userId } : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        include: { actor: { select: { id: true, username: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        action: row.action,
        severity: row.severity,
        ipAddress: row.ipAddress,
        userAgent: row.userAgent,
        createdAt: row.createdAt.toISOString(),
        actor: row.actor,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }

  async updateIpWhitelist(ips: string[], userId: string) {
    const settings = await this.getSiteSettings();
    return this.prisma.siteSettings.update({
      where: { id: settings.id },
      data: { ipWhitelist: ips, updatedBy: userId },
    });
  }
}

function computeNextRun(schedule: string): Date {
  const now = new Date();
  // daily:HH:MM | weekly:D:HH:MM | monthly:DD:HH:MM | cron-like fallback = +24h
  const daily = /^daily:(\d{2}):(\d{2})$/i.exec(schedule);
  if (daily) {
    const next = new Date(now);
    next.setHours(Number(daily[1]), Number(daily[2]), 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    return next;
  }
  const weekly = /^weekly:(\d):(\d{2}):(\d{2})$/i.exec(schedule);
  if (weekly) {
    const next = new Date(now);
    next.setHours(Number(weekly[2]), Number(weekly[3]), 0, 0);
    const targetDow = Number(weekly[1]);
    const delta = (targetDow - next.getDay() + 7) % 7 || 7;
    next.setDate(next.getDate() + delta);
    return next;
  }
  const monthly = /^monthly:(\d{1,2}):(\d{2}):(\d{2})$/i.exec(schedule);
  if (monthly) {
    const next = new Date(now);
    next.setDate(Number(monthly[1]));
    next.setHours(Number(monthly[2]), Number(monthly[3]), 0, 0);
    if (next <= now) next.setMonth(next.getMonth() + 1);
    return next;
  }
  return new Date(now.getTime() + 24 * 60 * 60 * 1000);
}
