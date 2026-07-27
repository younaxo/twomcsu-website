import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CartResponse, PromoValidationResult } from '@twomc/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto/store.dto';
import { PricingService } from './pricing.service';
import { decimalToNumber, toCartItem } from './store.mapper';

const cartItemInclude = {
  product: {
    include: {
      variants: {
        where: { isActive: true },
        orderBy: [{ order: 'asc' as const }, { price: 'asc' as const }],
      },
      category: { select: { id: true, name: true, slug: true } },
      position: {
        select: { id: true, slug: true, name: true, color: true, backgroundColor: true },
      },
    },
  },
  variant: true,
  bundle: {
    include: {
      items: {
        include: {
          product: {
            select: { id: true, name: true, slug: true, image: true, type: true },
          },
        },
      },
    },
  },
};

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PricingService,
  ) {}

  async getCart(userId: string): Promise<CartResponse> {
    const cart = await this.getOrCreateCart(userId);
    return this.toCartResponse(cart.id);
  }

  async addItem(userId: string, dto: AddCartItemDto): Promise<CartResponse> {
    if (!dto.productId && !dto.bundleId) {
      throw new BadRequestException('Укажите товар или набор');
    }
    if (dto.productId && dto.bundleId) {
      throw new BadRequestException('Нельзя добавить товар и набор одновременно');
    }

    const quantity = dto.quantity ?? 1;
    if (quantity < 1) {
      throw new BadRequestException('Количество должно быть больше 0');
    }

    const cart = await this.getOrCreateCart(userId);

    if (dto.bundleId) {
      await this.addBundleItem(cart.id, dto.bundleId, quantity, dto.giftToUserId, dto.giftMessage);
    } else {
      await this.addProductItem(cart.id, dto, quantity);
    }

    return this.toCartResponse(cart.id);
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto): Promise<CartResponse> {
    const cart = await this.getOrCreateCart(userId);
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: { product: true },
    });

    if (!item) {
      throw new NotFoundException('Позиция корзины не найдена');
    }

    this.validateQuantity(item.product, dto.quantity);

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    });

    return this.toCartResponse(cart.id);
  }

  async removeItem(userId: string, itemId: string): Promise<CartResponse> {
    const cart = await this.getOrCreateCart(userId);
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });

    if (!item) {
      throw new NotFoundException('Позиция корзины не найдена');
    }

    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.toCartResponse(cart.id);
  }

  async clear(userId: string): Promise<CartResponse> {
    const cart = await this.getOrCreateCart(userId);
    await this.prisma.$transaction([
      this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } }),
      this.prisma.cart.update({
        where: { id: cart.id },
        data: { promoCodeId: null },
      }),
    ]);
    return this.toCartResponse(cart.id);
  }

  async applyPromo(userId: string, code: string): Promise<CartResponse> {
    const cart = await this.getOrCreateCart(userId);
    const items = await this.loadPricingItems(cart.id);
    if (items.length === 0) {
      throw new BadRequestException('Корзина пуста');
    }

    const promo = await this.pricing.requireValidPromo(code, userId, items);
    await this.prisma.cart.update({
      where: { id: cart.id },
      data: { promoCodeId: promo.id },
    });

    return this.toCartResponse(cart.id);
  }

  async removePromo(userId: string): Promise<CartResponse> {
    const cart = await this.getOrCreateCart(userId);
    await this.prisma.cart.update({
      where: { id: cart.id },
      data: { promoCodeId: null },
    });
    return this.toCartResponse(cart.id);
  }

  async calculate(userId: string, promoCode?: string): Promise<CartResponse> {
    const cart = await this.getOrCreateCart(userId);
    const items = await this.loadPricingItems(cart.id);

    let promo = cart.promoCodeId
      ? await this.prisma.promoCode.findUnique({ where: { id: cart.promoCodeId } })
      : null;

    if (promoCode) {
      promo = await this.pricing.requireValidPromo(promoCode, userId, items);
    }

    const totals = await this.pricing.calculateCartTotal(items, promo, userId);
    const response = await this.toCartResponse(cart.id, totals);
    if (promoCode && promo) {
      response.promoCode = promo.code;
    }
    return response;
  }

  async validatePromo(userId: string | undefined, code: string): Promise<PromoValidationResult> {
    if (!userId) {
      return this.pricing.validatePromoCode(code, undefined, []);
    }

    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    const items = cart ? await this.loadPricingItems(cart.id) : [];
    return this.pricing.validatePromoCode(code, userId, items);
  }

  private async addProductItem(cartId: string, dto: AddCartItemDto, quantity: number) {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId!, isActive: true },
      include: { variants: { where: { isActive: true } } },
    });

    if (!product) {
      throw new NotFoundException('Товар не найден');
    }

    let variantId = dto.variantId;
    if (!variantId) {
      if (product.type === 'CURRENCY') {
        variantId = undefined;
      } else if (product.variants.length === 1) {
        variantId = product.variants[0].id;
      } else if (product.variants.length > 1) {
        throw new BadRequestException('Укажите вариант товара');
      }
    }

    if (variantId) {
      const variant = product.variants.find((v) => v.id === variantId);
      if (!variant) {
        throw new NotFoundException('Вариант товара не найден');
      }
    }

    if (dto.giftToUserId) {
      if (product.isSelfOnly) {
        throw new BadRequestException('Этот товар нельзя подарить');
      }
      if (!product.isGiftable) {
        throw new BadRequestException('Этот товар нельзя подарить');
      }
      await this.requireUser(dto.giftToUserId);
    }

    this.validateQuantity(product, quantity);

    if (product.isUnique) {
      const existingUnique = await this.prisma.cartItem.findFirst({
        where: {
          cartId,
          productId: product.id,
          giftToUserId: dto.giftToUserId ?? null,
        },
      });
      if (existingUnique) {
        throw new BadRequestException('Этот уникальный товар уже в корзине');
      }

      const cartOwner = await this.prisma.cart.findUniqueOrThrow({
        where: { id: cartId },
        select: { userId: true },
      });
      const owned = await this.prisma.orderItem.findFirst({
        where: {
          productId: product.id,
          giftToUserId: dto.giftToUserId ?? null,
          order: { userId: cartOwner.userId, status: 'COMPLETED' },
        },
      });
      if (owned) {
        throw new BadRequestException('У вас уже есть этот уникальный товар');
      }
    }

    const existing = await this.prisma.cartItem.findFirst({
      where: {
        cartId,
        productId: product.id,
        variantId: variantId ?? null,
        bundleId: null,
        giftToUserId: dto.giftToUserId ?? null,
      },
    });

    if (existing) {
      const nextQty = existing.quantity + quantity;
      this.validateQuantity(product, nextQty);
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: {
          quantity: nextQty,
          giftMessage: dto.giftMessage ?? existing.giftMessage,
        },
      });
      return;
    }

    await this.prisma.cartItem.create({
      data: {
        cartId,
        productId: product.id,
        variantId,
        quantity,
        giftToUserId: dto.giftToUserId,
        giftMessage: dto.giftMessage,
      },
    });
  }

  private async addBundleItem(
    cartId: string,
    bundleId: string,
    quantity: number,
    giftToUserId?: string,
    giftMessage?: string,
  ) {
    const bundle = await this.prisma.bundle.findFirst({
      where: { id: bundleId, isActive: true },
    });
    if (!bundle) {
      throw new NotFoundException('Набор не найден');
    }

    if (giftToUserId) {
      await this.requireUser(giftToUserId);
    }

    const existing = await this.prisma.cartItem.findFirst({
      where: {
        cartId,
        bundleId,
        productId: null,
        giftToUserId: giftToUserId ?? null,
      },
    });

    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + quantity,
          giftMessage: giftMessage ?? existing.giftMessage,
        },
      });
      return;
    }

    await this.prisma.cartItem.create({
      data: {
        cartId,
        bundleId,
        quantity,
        giftToUserId,
        giftMessage,
      },
    });
  }

  private validateQuantity(
    product: { maxPerPurchase: number | null; type: string } | null,
    quantity: number,
  ) {
    if (!product) return;
    if (product.maxPerPurchase != null && quantity > product.maxPerPurchase) {
      throw new BadRequestException(`Максимум ${product.maxPerPurchase} шт. за покупку`);
    }
  }

  private async requireUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Получатель подарка не найден');
    }
    return user;
  }

  private async getOrCreateCart(userId: string) {
    return this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  private async loadPricingItems(cartId: string) {
    const items = await this.prisma.cartItem.findMany({
      where: { cartId },
      include: {
        product: { select: { id: true, type: true, name: true } },
        variant: { select: { price: true } },
        bundle: { select: { totalPrice: true, name: true } },
      },
    });
    return items;
  }

  private async toCartResponse(
    cartId: string,
    totalsOverride?: CartResponse['totals'],
  ): Promise<CartResponse> {
    const cart = await this.prisma.cart.findUniqueOrThrow({
      where: { id: cartId },
      include: {
        promoCode: true,
        items: {
          include: cartItemInclude,
          orderBy: { addedAt: 'asc' },
        },
      },
    });

    const giftUserIds = cart.items
      .map((i) => i.giftToUserId)
      .filter((id): id is string => !!id);
    const giftUsers =
      giftUserIds.length > 0
        ? await this.prisma.user.findMany({
            where: { id: { in: [...new Set(giftUserIds)] } },
            select: { id: true, username: true },
          })
        : [];
    const giftMap = new Map(giftUsers.map((u) => [u.id, u]));

    const variantIds = [
      ...new Set(
        cart.items
          .flatMap((i) => i.bundle?.items.map((bi) => bi.variantId) ?? [])
          .filter((id): id is string => !!id),
      ),
    ];
    const variants =
      variantIds.length > 0
        ? await this.prisma.productVariant.findMany({ where: { id: { in: variantIds } } })
        : [];
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    const pricingItems = cart.items.map((item) => ({
      quantity: item.quantity,
      product: item.product
        ? { id: item.product.id, type: item.product.type, name: item.product.name }
        : null,
      variant: item.variant,
      bundle: item.bundle
        ? { totalPrice: item.bundle.totalPrice, name: item.bundle.name }
        : null,
    }));

    const totals =
      totalsOverride ??
      (await this.pricing.calculateCartTotal(pricingItems, cart.promoCode, cart.userId));

    const items = cart.items.map((item) => {
      let unitPrice = 0;
      if (item.bundle) {
        unitPrice = decimalToNumber(item.bundle.totalPrice);
      } else if (item.product?.type === 'CURRENCY') {
        unitPrice = 1;
      } else if (item.variant) {
        unitPrice = decimalToNumber(item.variant.price);
      }

      const lineTotal =
        item.product?.type === 'CURRENCY'
          ? item.quantity
          : unitPrice * item.quantity;

      return toCartItem(
        {
          ...item,
          giftToUser: item.giftToUserId ? giftMap.get(item.giftToUserId) ?? null : null,
          bundle: item.bundle
            ? {
                ...item.bundle,
                items: item.bundle.items.map((bi) => ({
                  ...bi,
                  variant: bi.variantId ? variantMap.get(bi.variantId) ?? null : null,
                })),
              }
            : null,
        },
        unitPrice,
        Math.round(lineTotal * 100) / 100,
      );
    });

    return {
      id: cart.id,
      items,
      promoCode: cart.promoCode?.code ?? null,
      totals,
    };
  }
}
