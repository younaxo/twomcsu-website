import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, Prisma, RoleGroup } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit.service';

export type BulkUserAction = 'ban' | 'unban' | 'change_role' | 'send_notification';

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
  ) {}

  async listUsers(opts: {
    page?: number;
    limit?: number;
    search?: string;
    roleGroup?: RoleGroup;
    isBanned?: boolean;
    positionId?: string;
    departmentId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    lastLoginFrom?: Date;
    lastLoginTo?: Date;
    sort?: string;
    order?: 'asc' | 'desc';
  }) {
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(100, Math.max(1, opts.limit ?? 25));
    const order = opts.order === 'asc' ? 'asc' : 'desc';
    const sortField = opts.sort ?? 'createdAt';

    const where: Prisma.UserWhereInput = {
      ...(opts.roleGroup ? { roleGroup: opts.roleGroup } : {}),
      ...(opts.isBanned !== undefined ? { isBanned: opts.isBanned } : {}),
      ...(opts.positionId ? { positionId: opts.positionId } : {}),
      ...(opts.departmentId
        ? { departments: { some: { departmentId: opts.departmentId } } }
        : {}),
      ...(opts.dateFrom || opts.dateTo
        ? {
            createdAt: {
              ...(opts.dateFrom ? { gte: opts.dateFrom } : {}),
              ...(opts.dateTo ? { lte: opts.dateTo } : {}),
            },
          }
        : {}),
      ...(opts.lastLoginFrom || opts.lastLoginTo
        ? {
            lastLoginAt: {
              ...(opts.lastLoginFrom ? { gte: opts.lastLoginFrom } : {}),
              ...(opts.lastLoginTo ? { lte: opts.lastLoginTo } : {}),
            },
          }
        : {}),
      ...(opts.search
        ? {
            OR: [
              { username: { contains: opts.search, mode: 'insensitive' } },
              { email: { contains: opts.search, mode: 'insensitive' } },
              { tag: { contains: opts.search, mode: 'insensitive' } },
              ...(Number.isFinite(Number(opts.search))
                ? [{ shortId: Number(opts.search) }]
                : []),
            ],
          }
        : {}),
    };

    const orderBy = buildUserOrderBy(sortField, order);

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: {
          position: {
            select: { id: true, displayName: true, color: true, slug: true },
          },
          departments: {
            include: { department: { select: { id: true, name: true } } },
          },
          _count: {
            select: { orders: true, authoredReports: true },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const last5min = new Date(Date.now() - 5 * 60 * 1000);

    return {
      items: rows.map((user) => ({
        id: user.id,
        shortId: user.shortId,
        tag: user.tag,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        roleGroup: user.roleGroup,
        position: user.position,
        departments: user.departments.map((d) => d.department),
        isBanned: user.isBanned,
        banReason: user.banReason,
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        lastActivityAt: user.lastActivityAt?.toISOString() ?? null,
        isOnlineInGame: user.isOnlineInGame,
        isOnline:
          Boolean(user.lastActivityAt && user.lastActivityAt >= last5min) ||
          user.isOnlineInGame,
        ordersCount: user._count.orders,
        reportsCount: user._count.authoredReports,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }

  async getUserFull(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        position: true,
        customPosition: { include: { customPosition: true } },
        departments: { include: { department: true } },
        statistics: true,
        badges: true,
        awards: { include: { award: true } },
        notificationSettings: true,
      },
    });
    if (!user) throw new NotFoundException('Пользователь не найден');

    const [
      orders,
      authoredReports,
      reportedIn,
      comments,
      friendships,
      punishments,
      auditLogs,
      sessions,
    ] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { items: true },
      }),
      this.prisma.report.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.reportTarget.findMany({
        where: { userId },
        include: { report: true },
        take: 50,
      }),
      this.prisma.profileComment.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.friendship.findMany({
        where: {
          OR: [{ requesterId: userId }, { addresseeId: userId }],
          status: 'ACCEPTED',
        },
        include: {
          requester: { select: { id: true, username: true, avatar: true } },
          addressee: { select: { id: true, username: true, avatar: true } },
        },
        take: 100,
      }),
      this.prisma.userPunishment.findMany({
        where: { userId },
        orderBy: { issuedAt: 'desc' },
        include: {
          issuedByUser: { select: { id: true, username: true, avatar: true } },
        },
      }),
      this.prisma.auditLog.findMany({
        where: {
          OR: [{ actorId: userId }, { targetId: userId }],
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { actor: { select: { id: true, username: true, avatar: true } } },
      }),
      this.prisma.refreshToken.findMany({
        where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          userAgent: true,
          ipAddress: true,
          createdAt: true,
          expiresAt: true,
        },
      }),
    ]);

    const { password: _password, ...safeUser } = user;

    return {
      user: {
        ...safeUser,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        lastActivityAt: user.lastActivityAt?.toISOString() ?? null,
        bannedUntil: user.bannedUntil?.toISOString() ?? null,
        birthDate: user.birthDate?.toISOString() ?? null,
      },
      stats: {
        orders: orders.length,
        reportsAuthored: authoredReports.length,
        reportsAgainst: reportedIn.length,
        comments: comments.length,
        friends: friendships.length,
        punishments: punishments.filter((p) => p.isActive).length,
      },
      orders,
      reports: {
        authored: authoredReports,
        against: reportedIn.map((r) => r.report),
      },
      comments,
      friends: friendships.map((f) =>
        f.requesterId === userId ? f.addressee : f.requester,
      ),
      punishments,
      activity: auditLogs.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
      })),
      sessions: sessions.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
        expiresAt: s.expiresAt.toISOString(),
      })),
    };
  }

  async bulkUpdate(
    actorId: string,
    input: {
      userIds: string[];
      action: BulkUserAction;
      data?: {
        roleGroup?: RoleGroup;
        banReason?: string;
        bannedUntil?: string | null;
        notificationTitle?: string;
        notificationMessage?: string;
      };
    },
  ) {
    if (!input.userIds?.length) {
      throw new BadRequestException('Не выбраны пользователи');
    }
    if (input.userIds.includes(actorId) && input.action === 'ban') {
      throw new BadRequestException('Нельзя забанить самого себя');
    }

    let affected = 0;

    switch (input.action) {
      case 'ban': {
        const result = await this.prisma.user.updateMany({
          where: { id: { in: input.userIds } },
          data: {
            isBanned: true,
            banReason: input.data?.banReason ?? 'Массовый бан',
            bannedUntil: input.data?.bannedUntil
              ? new Date(input.data.bannedUntil)
              : null,
          },
        });
        affected = result.count;
        break;
      }
      case 'unban': {
        const result = await this.prisma.user.updateMany({
          where: { id: { in: input.userIds } },
          data: { isBanned: false, banReason: null, bannedUntil: null },
        });
        affected = result.count;
        break;
      }
      case 'change_role': {
        if (!input.data?.roleGroup) {
          throw new BadRequestException('Укажите роль');
        }
        const result = await this.prisma.user.updateMany({
          where: { id: { in: input.userIds } },
          data: { roleGroup: input.data.roleGroup },
        });
        affected = result.count;
        break;
      }
      case 'send_notification': {
        const title = input.data?.notificationTitle?.trim();
        if (!title) throw new BadRequestException('Укажите заголовок уведомления');
        for (const userId of input.userIds) {
          await this.notifications.createNotification({
            userId,
            type: NotificationType.SYSTEM,
            title,
            message: input.data?.notificationMessage ?? null,
          });
          affected += 1;
        }
        break;
      }
      default:
        throw new BadRequestException('Неизвестное действие');
    }

    await this.audit.log({
      actorId,
      action: `users.bulk.${input.action}`,
      targetType: 'User',
      severity: input.action === 'ban' ? 'warning' : 'info',
      changes: {
        after: {
          userIds: input.userIds,
          action: input.action,
          data: input.data ?? null,
          affected,
        },
      },
    });

    return { affected };
  }
}

function buildUserOrderBy(
  sort: string,
  order: 'asc' | 'desc',
): Prisma.UserOrderByWithRelationInput {
  switch (sort) {
    case 'username':
      return { username: order };
    case 'email':
      return { email: order };
    case 'roleGroup':
      return { roleGroup: order };
    case 'lastLoginAt':
      return { lastLoginAt: order };
    case 'lastActivityAt':
      return { lastActivityAt: order };
    case 'shortId':
      return { shortId: order };
    default:
      return { createdAt: order };
  }
}
