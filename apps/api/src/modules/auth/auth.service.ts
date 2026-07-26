import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PublicUser } from '@twomc/shared';
import { PrismaService } from '../prisma/prisma.service';

export interface RequestContext {
  ip: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(userId: string): Promise<PublicUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    return user ? this.toPublicUser(user) : null;
  }

  toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      roleGroup: user.roleGroup,
      minecraftNick: user.minecraftNick,
      avatar: user.avatar,
      isVerified: user.isVerified,
      isBanned: user.isBanned,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
