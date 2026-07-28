import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type AuditLogInput = {
  actorId: string;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  changes?: Prisma.InputJsonValue | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(input: AuditLogInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: input.actorId,
          action: input.action,
          targetType: input.targetType ?? null,
          targetId: input.targetId ?? null,
          changes: input.changes ?? undefined,
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to write audit log ${input.action}`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  async list(opts: {
    page?: number;
    limit?: number;
    action?: string;
    actorId?: string;
    q?: string;
    from?: Date;
    to?: Date;
  }) {
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(100, Math.max(1, opts.limit ?? 50));
    const where: Prisma.AuditLogWhereInput = {
      ...(opts.action ? { action: { contains: opts.action, mode: 'insensitive' } } : {}),
      ...(opts.actorId ? { actorId: opts.actorId } : {}),
      ...(opts.q
        ? {
            OR: [
              { action: { contains: opts.q, mode: 'insensitive' } },
              { targetType: { contains: opts.q, mode: 'insensitive' } },
              { targetId: { contains: opts.q, mode: 'insensitive' } },
              { actor: { username: { contains: opts.q, mode: 'insensitive' } } },
            ],
          }
        : {}),
      ...(opts.from || opts.to
        ? {
            createdAt: {
              ...(opts.from ? { gte: opts.from } : {}),
              ...(opts.to ? { lte: opts.to } : {}),
            },
          }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        include: {
          actor: { select: { id: true, username: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        action: row.action,
        targetType: row.targetType,
        targetId: row.targetId,
        changes: row.changes,
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

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async cleanupOld(): Promise<void> {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const result = await this.prisma.auditLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    this.logger.log(`Deleted ${result.count} audit logs older than 90 days`);
  }
}
