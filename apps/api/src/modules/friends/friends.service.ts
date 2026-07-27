import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FriendshipStatus, Prisma } from '@prisma/client';
import {
  BlockedUserItem,
  FriendListItem,
  FriendRequestItem,
  FriendUser,
  FriendsCountResponse,
  FriendshipRelationStatus,
  FriendshipStatusResponse,
  PaginatedResponse,
} from '@twomc/shared';
import {
  buildPaginatedResult,
  normalizePagination,
} from '../../common/pagination';
import {
  MinimalUserRow,
  selectMinimalUser,
} from '../../common/prisma/user-selects';
import { CACHE_TTL, cacheKeys } from '../cache/cache.keys';
import { CacheService } from '../cache/cache.service';
import { toPublicPosition } from '../positions/position.mapper';
import { PrismaService } from '../prisma/prisma.service';
import { toUserBadge } from '../users/profile.mapper';

const friendSideSelect = { select: selectMinimalUser } as const;

@Injectable()
export class FriendsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async sendRequest(requesterId: string, addresseeUsername: string): Promise<FriendRequestItem> {
    const addressee = await this.requireUserByUsername(addresseeUsername);

    if (addressee.id === requesterId) {
      throw new BadRequestException('Нельзя добавить себя в друзья');
    }

    const existing = await this.findBetween(requesterId, addressee.id);

    if (existing) {
      if (existing.status === FriendshipStatus.BLOCKED) {
        throw new ForbiddenException('Пользователь заблокирован');
      }

      if (existing.status === FriendshipStatus.PENDING) {
        throw new ConflictException('Запрос уже отправлен');
      }

      if (existing.status === FriendshipStatus.ACCEPTED) {
        throw new ConflictException('Уже друзья');
      }

      await this.prisma.friendship.delete({ where: { id: existing.id } });
    }

    const friendship = await this.prisma.friendship.create({
      data: {
        requesterId,
        addresseeId: addressee.id,
        status: FriendshipStatus.PENDING,
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        addressee: friendSideSelect,
      },
    });

    await this.invalidateUserCaches(requesterId, addressee.id);

    return {
      id: friendship.id,
      status: friendship.status,
      createdAt: friendship.createdAt.toISOString(),
      user: this.toFriendUser(friendship.addressee),
    };
  }

  async acceptRequest(userId: string, requestId: string): Promise<FriendListItem> {
    const friendship = await this.requireRequest(requestId);

    if (friendship.addresseeId !== userId) {
      throw new ForbiddenException('Можно принять только входящий запрос');
    }

    if (friendship.status !== FriendshipStatus.PENDING) {
      throw new BadRequestException('Запрос уже обработан');
    }

    const updated = await this.prisma.friendship.update({
      where: { id: requestId },
      data: {
        status: FriendshipStatus.ACCEPTED,
        acceptedAt: new Date(),
      },
      select: {
        id: true,
        acceptedAt: true,
        createdAt: true,
        requesterId: true,
        addresseeId: true,
        requester: friendSideSelect,
      },
    });

    await this.invalidateUserCaches(updated.requesterId, updated.addresseeId);

    return {
      id: updated.id,
      acceptedAt: updated.acceptedAt?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
      user: this.toFriendUser(updated.requester),
    };
  }

  async rejectRequest(userId: string, requestId: string): Promise<void> {
    const friendship = await this.requireRequest(requestId);

    if (friendship.addresseeId !== userId) {
      throw new ForbiddenException('Можно отклонить только входящий запрос');
    }

    if (friendship.status !== FriendshipStatus.PENDING) {
      throw new BadRequestException('Запрос уже обработан');
    }

    await this.prisma.friendship.update({
      where: { id: requestId },
      data: { status: FriendshipStatus.REJECTED },
    });

    await this.invalidateUserCaches(friendship.requesterId, friendship.addresseeId);
  }

  async cancelRequest(userId: string, requestId: string): Promise<void> {
    const friendship = await this.requireRequest(requestId);

    if (friendship.requesterId !== userId) {
      throw new ForbiddenException('Можно отменить только свой исходящий запрос');
    }

    if (friendship.status !== FriendshipStatus.PENDING) {
      throw new BadRequestException('Запрос уже обработан');
    }

    await this.prisma.friendship.delete({ where: { id: requestId } });
    await this.invalidateUserCaches(friendship.requesterId, friendship.addresseeId);
  }

  async removeFriend(userId: string, friendUsername: string): Promise<void> {
    const friend = await this.requireUserByUsername(friendUsername);
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [
          { requesterId: userId, addresseeId: friend.id },
          { requesterId: friend.id, addresseeId: userId },
        ],
      },
      select: { id: true, requesterId: true, addresseeId: true },
    });

    if (!friendship) {
      throw new NotFoundException('Дружба не найдена');
    }

    await this.prisma.friendship.delete({ where: { id: friendship.id } });
    await this.invalidateUserCaches(friendship.requesterId, friendship.addresseeId);
  }

  async blockUser(userId: string, targetUsername: string): Promise<BlockedUserItem> {
    const target = await this.requireUserByUsername(targetUsername);

    if (target.id === userId) {
      throw new BadRequestException('Нельзя заблокировать себя');
    }

    const related = await this.prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: userId, addresseeId: target.id },
          { requesterId: target.id, addresseeId: userId },
        ],
      },
      select: { id: true },
    });

    if (related.length > 0) {
      await this.prisma.friendship.deleteMany({
        where: { id: { in: related.map((row) => row.id) } },
      });
    }

    const blocked = await this.prisma.friendship.create({
      data: {
        requesterId: userId,
        addresseeId: target.id,
        status: FriendshipStatus.BLOCKED,
      },
      select: {
        id: true,
        createdAt: true,
        addressee: friendSideSelect,
      },
    });

    await this.invalidateUserCaches(userId, target.id);

    return {
      id: blocked.id,
      createdAt: blocked.createdAt.toISOString(),
      user: this.toFriendUser(blocked.addressee),
    };
  }

  async unblockUser(userId: string, targetUsername: string): Promise<void> {
    const target = await this.requireUserByUsername(targetUsername);
    const blocked = await this.prisma.friendship.findFirst({
      where: {
        requesterId: userId,
        addresseeId: target.id,
        status: FriendshipStatus.BLOCKED,
      },
      select: { id: true },
    });

    if (!blocked) {
      throw new NotFoundException('Пользователь не в чёрном списке');
    }

    await this.prisma.friendship.delete({ where: { id: blocked.id } });
    await this.invalidateUserCaches(userId, target.id);
  }

  async getFriendsList(
    userId: string,
    page = 1,
    limit = 20,
    search?: string,
  ): Promise<PaginatedResponse<FriendListItem>> {
    const { page: currentPage, limit: take, skip } = normalizePagination({ page, limit });

    const where: Prisma.FriendshipWhereInput = {
      status: FriendshipStatus.ACCEPTED,
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.friendship.count({ where }),
      this.prisma.friendship.findMany({
        where,
        select: {
          id: true,
          acceptedAt: true,
          createdAt: true,
          requesterId: true,
          requester: friendSideSelect,
          addressee: friendSideSelect,
        },
        orderBy: [{ acceptedAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
    ]);

    let items = rows.map((row) => {
      const friend = row.requesterId === userId ? row.addressee : row.requester;

      return {
        id: row.id,
        acceptedAt: row.acceptedAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        user: this.toFriendUser(friend),
      };
    });

    const q = search?.trim().toLowerCase();
    if (q) {
      items = items.filter((item) => item.user.username.toLowerCase().includes(q));
    }

    return buildPaginatedResult(items, q ? items.length : total, currentPage, take);
  }

  async getIncomingRequests(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<FriendRequestItem>> {
    const { page: currentPage, limit: take, skip } = normalizePagination({ page, limit });
    const where: Prisma.FriendshipWhereInput = {
      addresseeId: userId,
      status: FriendshipStatus.PENDING,
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.friendship.count({ where }),
      this.prisma.friendship.findMany({
        where,
        select: {
          id: true,
          status: true,
          createdAt: true,
          requester: friendSideSelect,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    return buildPaginatedResult(
      rows.map((row) => ({
        id: row.id,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
        user: this.toFriendUser(row.requester),
      })),
      total,
      currentPage,
      take,
    );
  }

  async getOutgoingRequests(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<FriendRequestItem>> {
    const { page: currentPage, limit: take, skip } = normalizePagination({ page, limit });
    const where: Prisma.FriendshipWhereInput = {
      requesterId: userId,
      status: FriendshipStatus.PENDING,
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.friendship.count({ where }),
      this.prisma.friendship.findMany({
        where,
        select: {
          id: true,
          status: true,
          createdAt: true,
          addressee: friendSideSelect,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    return buildPaginatedResult(
      rows.map((row) => ({
        id: row.id,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
        user: this.toFriendUser(row.addressee),
      })),
      total,
      currentPage,
      take,
    );
  }

  async getBlockedUsers(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<BlockedUserItem>> {
    const { page: currentPage, limit: take, skip } = normalizePagination({ page, limit });
    const where: Prisma.FriendshipWhereInput = {
      requesterId: userId,
      status: FriendshipStatus.BLOCKED,
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.friendship.count({ where }),
      this.prisma.friendship.findMany({
        where,
        select: {
          id: true,
          createdAt: true,
          addressee: friendSideSelect,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    return buildPaginatedResult(
      rows.map((row) => ({
        id: row.id,
        createdAt: row.createdAt.toISOString(),
        user: this.toFriendUser(row.addressee),
      })),
      total,
      currentPage,
      take,
    );
  }

  async getFriendshipStatus(
    userId: string,
    targetUsername: string,
  ): Promise<FriendshipStatusResponse> {
    const target = await this.requireUserByUsername(targetUsername);

    if (target.id === userId) {
      return { status: 'self', requestId: null };
    }

    const friendship = await this.findBetween(userId, target.id);

    if (!friendship) {
      return { status: 'none', requestId: null };
    }

    if (friendship.status === FriendshipStatus.ACCEPTED) {
      return { status: 'friends', requestId: friendship.id };
    }

    if (friendship.status === FriendshipStatus.BLOCKED) {
      const status: FriendshipRelationStatus =
        friendship.requesterId === userId ? 'blocked_by_me' : 'blocked_by_them';

      return { status, requestId: friendship.id };
    }

    if (friendship.status === FriendshipStatus.PENDING) {
      if (friendship.requesterId === userId) {
        return { status: 'pending_sent', requestId: friendship.id };
      }

      return { status: 'pending_received', requestId: friendship.id };
    }

    return { status: 'none', requestId: null };
  }

  async getFriendsCount(userId: string): Promise<FriendsCountResponse> {
    return this.cache.wrap(cacheKeys.friendsCount(userId), CACHE_TTL.FRIENDS_COUNT, async () => {
      const count = await this.prisma.friendship.count({
        where: {
          status: FriendshipStatus.ACCEPTED,
          OR: [{ requesterId: userId }, { addresseeId: userId }],
        },
      });

      return { count };
    });
  }

  async getIncomingCount(userId: string): Promise<FriendsCountResponse> {
    return this.cache.wrap(
      cacheKeys.incomingCount(userId),
      CACHE_TTL.INCOMING_REQUESTS_COUNT,
      async () => {
        const count = await this.prisma.friendship.count({
          where: {
            addresseeId: userId,
            status: FriendshipStatus.PENDING,
          },
        });

        return { count };
      },
    );
  }

  async getFriendsCountByUsername(username: string): Promise<FriendsCountResponse> {
    const user = await this.requireUserByUsername(username);

    return this.getFriendsCount(user.id);
  }

  async areFriends(userA: string, userB: string): Promise<boolean> {
    if (userA === userB) {
      return true;
    }

    const friendship = await this.prisma.friendship.findFirst({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [
          { requesterId: userA, addresseeId: userB },
          { requesterId: userB, addresseeId: userA },
        ],
      },
      select: { id: true },
    });

    return friendship !== null;
  }

  private async invalidateUserCaches(...userIds: string[]): Promise<void> {
    const keys = userIds.flatMap((id) => [
      cacheKeys.friendsCount(id),
      cacheKeys.incomingCount(id),
      cacheKeys.authMe(id),
    ]);

    await this.cache.del(keys);

    for (const id of userIds) {
      await this.cache.delPattern(`user:*${id}*`);
    }
  }

  private async requireUserByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return user;
  }

  private async requireRequest(requestId: string) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        requesterId: true,
        addresseeId: true,
        status: true,
      },
    });

    if (!friendship) {
      throw new NotFoundException('Запрос не найден');
    }

    return friendship;
  }

  private findBetween(userA: string, userB: string) {
    return this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userA, addresseeId: userB },
          { requesterId: userB, addresseeId: userA },
        ],
      },
      select: {
        id: true,
        requesterId: true,
        addresseeId: true,
        status: true,
      },
    });
  }

  private toFriendUser(user: MinimalUserRow): FriendUser {
    return {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      minecraftNick: user.minecraftNick,
      position: toPublicPosition(user.position),
      badges: user.badges.map(toUserBadge),
    };
  }
}
