import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DecorationGrantSource, NotificationType } from '@prisma/client';
import {
  OwnedProfileDecoration,
  ProfileDecoration,
} from '@twomc/shared';
import { findUserByIdentifier } from '../../common/user-identifier';
import { CacheService } from '../cache/cache.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateDecorationDto } from './dto/decorations.dto';

@Injectable()
export class DecorationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly notifications: NotificationsService,
  ) {}

  async catalog(userId?: string | null): Promise<ProfileDecoration[]> {
    const rows = await this.prisma.profileDecoration.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      include: {
        product: {
          select: {
            id: true,
            slug: true,
            name: true,
            isActive: true,
            variants: {
              where: { isActive: true },
              orderBy: { price: 'asc' },
              take: 1,
              select: { price: true },
            },
          },
        },
        owners: {
          where: { userId: userId ?? '__anonymous__' },
          select: { userId: true },
        },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      imageUrl: row.imageUrl,
      availability: row.availability,
      isActive: row.isActive,
      order: row.order,
      owned: userId ? row.owners.length > 0 : undefined,
      product: row.product?.isActive
        ? {
            id: row.product.id,
            slug: row.product.slug,
            name: row.product.name,
            price: row.product.variants[0]?.price.toString() ?? '0',
          }
        : null,
    }));
  }

  async owned(userId: string): Promise<OwnedProfileDecoration[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        selectedDecorationId: true,
        ownedDecorations: {
          include: { decoration: true },
          orderBy: { decoration: { order: 'asc' } },
        },
      },
    });
    if (!user) throw new NotFoundException('Пользователь не найден');

    return user.ownedDecorations
      .filter((owned) => owned.decoration.isActive)
      .map((owned) => ({
        ...this.mapDecoration(owned.decoration),
        owned: true,
        selected: user.selectedDecorationId === owned.decorationId,
        acquiredAt: owned.acquiredAt.toISOString(),
        source: owned.source,
      }));
  }

  async select(userId: string, decorationId?: string | null): Promise<{ selected: string | null }> {
    if (decorationId) {
      const owned = await this.prisma.userDecoration.findUnique({
        where: { userId_decorationId: { userId, decorationId } },
        include: { decoration: { select: { isActive: true } } },
      });
      if (!owned || !owned.decoration.isActive) {
        throw new BadRequestException('Это украшение не принадлежит пользователю');
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { selectedDecorationId: decorationId || null },
    });
    await this.invalidateUser(userId);
    return { selected: decorationId || null };
  }

  async adminCatalog() {
    return this.prisma.profileDecoration.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { owners: true } }, product: true },
    });
  }

  async grant(identifier: string, decorationId: string, actorId: string) {
    const [user, decoration] = await Promise.all([
      findUserByIdentifier(this.prisma, identifier, {
        select: { id: true, username: true },
      }),
      this.prisma.profileDecoration.findUnique({ where: { id: decorationId } }),
    ]);
    if (!user) throw new NotFoundException('Пользователь не найден');
    if (!decoration) throw new NotFoundException('Украшение не найдено');

    const ownership = await this.prisma.userDecoration.upsert({
      where: { userId_decorationId: { userId: user.id, decorationId } },
      create: {
        userId: user.id,
        decorationId,
        source: DecorationGrantSource.ADMIN,
        grantedById: actorId,
      },
      update: { source: DecorationGrantSource.ADMIN, grantedById: actorId },
      include: { decoration: true },
    });
    await this.invalidateUser(user.id);
    await this.notifications.createNotification({
      userId: user.id,
      type: NotificationType.DECORATION_GRANTED,
      title: 'Новое украшение профиля',
      message: `Вам выдано украшение «${decoration.name}»`,
      link: '/profile/settings#display',
      imageUrl: decoration.imageUrl,
    });
    return { ...ownership, user };
  }

  async revoke(userId: string, decorationId: string): Promise<void> {
    const ownership = await this.prisma.userDecoration.findUnique({
      where: { userId_decorationId: { userId, decorationId } },
    });
    if (!ownership) throw new NotFoundException('Украшение не выдано пользователю');

    await this.prisma.$transaction([
      this.prisma.user.updateMany({
        where: { id: userId, selectedDecorationId: decorationId },
        data: { selectedDecorationId: null },
      }),
      this.prisma.userDecoration.delete({
        where: { userId_decorationId: { userId, decorationId } },
      }),
    ]);
    await this.invalidateUser(userId);
  }

  async update(id: string, dto: UpdateDecorationDto) {
    if (dto.isActive === false) {
      return this.prisma.$transaction(async (tx) => {
        await tx.user.updateMany({
          where: { selectedDecorationId: id },
          data: { selectedDecorationId: null },
        });
        return tx.profileDecoration.update({ where: { id }, data: dto });
      });
    }
    return this.prisma.profileDecoration.update({ where: { id }, data: dto });
  }

  async userOwnerships(identifier: string) {
    const user = await findUserByIdentifier(this.prisma, identifier, {
      select: {
        id: true,
        username: true,
        shortId: true,
        avatar: true,
        selectedDecorationId: true,
        ownedDecorations: { include: { decoration: true }, orderBy: { acquiredAt: 'desc' } },
      },
    });
    if (!user) throw new NotFoundException('Пользователь не найден');
    return user;
  }

  private mapDecoration(row: {
    id: string; slug: string; name: string; imageUrl: string;
    availability: ProfileDecoration['availability']; isActive: boolean; order: number;
  }): ProfileDecoration {
    return { ...row };
  }

  private async invalidateUser(userId: string) {
    await Promise.all([
      this.cache.del(`auth:me:${userId}`),
      this.cache.delPattern(`user:*${userId}*`),
    ]);
  }
}
