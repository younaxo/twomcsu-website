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
import { toPublicPosition } from '../positions/position.mapper';
import { PrismaService } from '../prisma/prisma.service';
import { toUserBadge } from '../users/profile.mapper';

const friendUserInclude = {
  position: true,
  badges: { where: { isActive: true }, orderBy: { grantedAt: 'asc' as const } },
} satisfies Prisma.UserInclude;

type FriendUserRow = Prisma.UserGetPayload<{ include: typeof friendUserInclude }>;

@Injectable()
export class FriendsService {
  constructor(private readonly prisma: PrismaService) {}

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

      // REJECTED — replace with a fresh pending request
      await this.prisma.friendship.delete({ where: { id: existing.id } });
    }

    const friendship = await this.prisma.friendship.create({
      data: {
        requesterId,
        addresseeId: addressee.id,
        status: FriendshipStatus.PENDING,
      },
      include: {
        addressee: { include: friendUserInclude },
      },
    });

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
      include: {
        requester: { include: friendUserInclude },
      },
    });

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
    });

    if (!friendship) {
      throw new NotFoundException('Дружба не найдена');
    }

    await this.prisma.friendship.delete({ where: { id: friendship.id } });
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
      include: {
        addressee: { include: friendUserInclude },
      },
    });

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
    });

    if (!blocked) {
      throw new NotFoundException('Пользователь не в чёрном списке');
    }

    await this.prisma.friendship.delete({ where: { id: blocked.id } });
  }

  async getFriendsList(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<FriendListItem>> {
    const take = Math.min(Math.max(limit, 1), 50);
    const currentPage = Math.max(page, 1);
    const skip = (currentPage - 1) * take;

    const where: Prisma.FriendshipWhereInput = {
      status: FriendshipStatus.ACCEPTED,
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.friendship.count({ where }),
      this.prisma.friendship.findMany({
        where,
        include: {
          requester: { include: friendUserInclude },
          addressee: { include: friendUserInclude },
        },
        orderBy: [{ acceptedAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
    ]);

    return {
      items: rows.map((row) => {
        const friend = row.requesterId === userId ? row.addressee : row.requester;

        return {
          id: row.id,
          acceptedAt: row.acceptedAt?.toISOString() ?? null,
          createdAt: row.createdAt.toISOString(),
          user: this.toFriendUser(friend),
        };
      }),
      total,
      page: currentPage,
      perPage: take,
    };
  }

  async getIncomingRequests(userId: string): Promise<FriendRequestItem[]> {
    const rows = await this.prisma.friendship.findMany({
      where: {
        addresseeId: userId,
        status: FriendshipStatus.PENDING,
      },
      include: {
        requester: { include: friendUserInclude },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => ({
      id: row.id,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      user: this.toFriendUser(row.requester),
    }));
  }

  async getOutgoingRequests(userId: string): Promise<FriendRequestItem[]> {
    const rows = await this.prisma.friendship.findMany({
      where: {
        requesterId: userId,
        status: FriendshipStatus.PENDING,
      },
      include: {
        addressee: { include: friendUserInclude },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => ({
      id: row.id,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      user: this.toFriendUser(row.addressee),
    }));
  }

  async getBlockedUsers(userId: string): Promise<BlockedUserItem[]> {
    const rows = await this.prisma.friendship.findMany({
      where: {
        requesterId: userId,
        status: FriendshipStatus.BLOCKED,
      },
      include: {
        addressee: { include: friendUserInclude },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => ({
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      user: this.toFriendUser(row.addressee),
    }));
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

    // REJECTED looks like no relationship to the client
    return { status: 'none', requestId: null };
  }

  async getFriendsCount(userId: string): Promise<FriendsCountResponse> {
    const count = await this.prisma.friendship.count({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
    });

    return { count };
  }

  async getFriendsCountByUsername(username: string): Promise<FriendsCountResponse> {
    const user = await this.requireUserByUsername(username);

    return this.getFriendsCount(user.id);
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
    });
  }

  private toFriendUser(user: FriendUserRow): FriendUser {
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
