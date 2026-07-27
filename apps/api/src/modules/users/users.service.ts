import { Injectable, NotFoundException } from '@nestjs/common';
import { UserProfile, UserSearchResult } from '@twomc/shared';
import { toPublicPosition } from '../positions/position.mapper';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublicProfile(username: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        avatar: true,
        minecraftNick: true,
        createdAt: true,
        position: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      minecraftNick: user.minecraftNick,
      position: toPublicPosition(user.position),
      createdAt: user.createdAt.toISOString(),
    };
  }

  /** Username lookup for the assign dialog in the admin panel */
  async search(query: string, limit = 10): Promise<UserSearchResult[]> {
    const users = await this.prisma.user.findMany({
      where: { username: { contains: query, mode: 'insensitive' } },
      orderBy: { username: 'asc' },
      take: limit,
      select: {
        id: true,
        username: true,
        avatar: true,
        roleGroup: true,
        position: true,
      },
    });

    return users.map((user) => ({
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      roleGroup: user.roleGroup,
      position: toPublicPosition(user.position),
    }));
  }
}
