import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PublicWishlistResponse,
  WishlistResponse,
} from '@twomc/shared';
import { findUserByIdentifier } from '../../common/user-identifier';
import { PrismaService } from '../prisma/prisma.service';
import { CartService } from './cart.service';
import { toStoreProduct } from './store.mapper';

const wishlistProductInclude = {
  variants: {
    where: { isActive: true },
    orderBy: [{ order: 'asc' as const }, { price: 'asc' as const }],
  },
  category: { select: { id: true, name: true, slug: true } },
  position: {
    select: { id: true, slug: true, name: true, color: true, backgroundColor: true },
  },
};

@Injectable()
export class WishlistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cart: CartService,
  ) {}

  async getWishlist(userId: string): Promise<WishlistResponse> {
    const wishlist = await this.getOrCreateWishlist(userId);
    return this.mapWishlist(wishlist.id);
  }

  async addItem(userId: string, productId: string): Promise<WishlistResponse> {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, isActive: true },
    });
    if (!product) {
      throw new NotFoundException('Товар не найден');
    }

    const wishlist = await this.getOrCreateWishlist(userId);

    await this.prisma.wishlistItem.upsert({
      where: {
        wishlistId_productId: { wishlistId: wishlist.id, productId },
      },
      create: { wishlistId: wishlist.id, productId },
      update: {},
    });

    return this.mapWishlist(wishlist.id);
  }

  async removeItem(userId: string, productId: string): Promise<WishlistResponse> {
    const wishlist = await this.getOrCreateWishlist(userId);
    await this.prisma.wishlistItem.deleteMany({
      where: { wishlistId: wishlist.id, productId },
    });
    return this.mapWishlist(wishlist.id);
  }

  async updateVisibility(userId: string, isPublic: boolean): Promise<WishlistResponse> {
    const wishlist = await this.getOrCreateWishlist(userId);
    await this.prisma.wishlist.update({
      where: { id: wishlist.id },
      data: { isPublic },
    });
    return this.mapWishlist(wishlist.id);
  }

  async giftFromWishlist(
    buyerId: string,
    productId: string,
    wishlistUsername?: string,
  ): Promise<{ cart: Awaited<ReturnType<CartService['getCart']>> }> {
    // Gift TO wishlist owner — buyer pays
    let ownerId: string;

    if (wishlistUsername) {
      const owner = await findUserByIdentifier(this.prisma, wishlistUsername, {
        select: { id: true },
      });
      if (!owner) {
        throw new NotFoundException('Пользователь не найден');
      }
      ownerId = owner.id;
    } else {
      throw new BadRequestException('Укажите владельца вишлиста');
    }

    if (ownerId === buyerId) {
      throw new BadRequestException('Нельзя подарить товар самому себе');
    }

    const wishlist = await this.prisma.wishlist.findUnique({
      where: { userId: ownerId },
      include: {
        items: { where: { productId }, select: { id: true } },
      },
    });

    if (!wishlist || !wishlist.isPublic) {
      throw new ForbiddenException('Вишлист недоступен');
    }
    if (wishlist.items.length === 0) {
      throw new NotFoundException('Товара нет в вишлисте');
    }

    const product = await this.prisma.product.findFirst({
      where: { id: productId, isActive: true },
      include: { variants: { where: { isActive: true }, orderBy: { order: 'asc' } } },
    });
    if (!product) {
      throw new NotFoundException('Товар не найден');
    }
    if (!product.isGiftable || product.isSelfOnly) {
      throw new BadRequestException('Этот товар нельзя подарить');
    }

    const cart = await this.cart.addItem(buyerId, {
      productId: product.id,
      variantId: product.variants[0]?.id,
      quantity: 1,
      giftToUserId: ownerId,
      giftMessage: `Подарок из вишлиста`,
    });

    return { cart };
  }

  async getPublicByUsername(username: string): Promise<PublicWishlistResponse> {
    const user = await findUserByIdentifier(this.prisma, username, {
      select: { id: true, username: true },
    });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const wishlist = await this.prisma.wishlist.findUnique({
      where: { userId: user.id },
    });

    if (!wishlist || !wishlist.isPublic) {
      throw new ForbiddenException('Вишлист скрыт');
    }

    const mapped = await this.mapWishlist(wishlist.id);
    return {
      username: user.username,
      isPublic: mapped.isPublic,
      items: mapped.items,
    };
  }

  private async getOrCreateWishlist(userId: string) {
    return this.prisma.wishlist.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  private async mapWishlist(wishlistId: string): Promise<WishlistResponse> {
    const wishlist = await this.prisma.wishlist.findUniqueOrThrow({
      where: { id: wishlistId },
      include: {
        items: {
          orderBy: { addedAt: 'desc' },
          include: {
            product: { include: wishlistProductInclude },
          },
        },
      },
    });

    return {
      id: wishlist.id,
      isPublic: wishlist.isPublic,
      items: wishlist.items.map((item) => ({
        id: item.id,
        addedAt: item.addedAt.toISOString(),
        product: toStoreProduct(item.product),
      })),
    };
  }
}
