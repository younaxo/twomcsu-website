import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, OrderStatus, Prisma, ProductType } from '@prisma/client';
import {
  CreateOrderResponse,
  OrdersResponse,
  QuickBuyResponse,
  RecentPurchaseItem,
  StoreOrder,
} from '@twomc/shared';
import { CACHE_TTL, cacheKeys } from '../cache/cache.keys';
import { CacheService } from '../cache/cache.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { QuickBuyDto } from './dto/store.dto';
import { PricingService } from './pricing.service';
import { decimalToNumber, toStoreOrder } from './store.mapper';

const QUICK_BUY_BLOCKED_TYPES: ProductType[] = [
  ProductType.DECORATION,
  ProductType.SUBSCRIPTION,
  ProductType.BADGE,
  ProductType.UNMUTE,
  ProductType.UNBAN,
  ProductType.BATTLE_PASS_BOOSTER,
];

const orderInclude = {
  promoCode: { select: { code: true } },
  items: {
    include: {
      product: {
        select: { id: true, name: true, slug: true, image: true, type: true },
      },
      variant: true,
      bundle: {
        select: { id: true, name: true, slug: true, image: true },
      },
    },
  },
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PricingService,
    private readonly notifications: NotificationsService,
    private readonly cache: CacheService,
  ) {}

  async createFromCart(
    userId: string,
    promoCode?: string,
  ): Promise<CreateOrderResponse> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        promoCode: true,
        items: {
          include: {
            product: true,
            variant: true,
            bundle: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Корзина пуста');
    }

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

    let promo = cart.promoCode;
    if (promoCode) {
      promo = await this.pricing.requireValidPromo(promoCode, userId, pricingItems);
    } else if (promo) {
      const validation = await this.pricing.validatePromoCode(
        promo.code,
        userId,
        pricingItems,
      );
      if (!validation.valid) {
        promo = null;
      }
    }

    const totals = await this.pricing.calculateCartTotal(pricingItems, promo, userId);
    const orderNumber = await this.nextOrderNumber();

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: OrderStatus.PENDING,
          subtotal: totals.subtotal,
          discountAmount: totals.discountAmount,
          total: totals.total,
          promoCodeId: promo?.id,
          items: {
            create: cart.items.map((item) => {
              let unitPrice = 0;
              if (item.bundle) {
                unitPrice = decimalToNumber(item.bundle.totalPrice);
              } else if (item.product?.type === 'CURRENCY') {
                unitPrice = 1;
              } else if (item.variant) {
                unitPrice = decimalToNumber(item.variant.price);
              }

              const totalPrice =
                item.product?.type === 'CURRENCY'
                  ? item.quantity
                  : Math.round(unitPrice * item.quantity * 100) / 100;

              return {
                productId: item.productId,
                variantId: item.variantId,
                bundleId: item.bundleId,
                quantity: item.quantity,
                unitPrice,
                totalPrice,
                giftToUserId: item.giftToUserId,
                giftMessage: item.giftMessage,
              };
            }),
          },
        },
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.update({
        where: { id: cart.id },
        data: { promoCodeId: null },
      });

      return created;
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentUrl: `/store/mock-payment?orderId=${order.id}`,
    };
  }

  async listMine(userId: string, page = 1, limit = 20): Promise<OrdersResponse> {
    const take = Math.min(100, Math.max(1, limit));
    const currentPage = Math.max(1, page);
    const skip = (currentPage - 1) * take;

    const where = { userId };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    return {
      items: rows.map(toStoreOrder),
      total,
      page: currentPage,
      limit: take,
      totalPages: Math.ceil(total / take) || 0,
    };
  }

  async recentPurchases(limit = 10): Promise<RecentPurchaseItem[]> {
    const take = Math.min(50, Math.max(1, limit));

    return this.cache.wrap(
      `${cacheKeys.storeRecentPurchases()}:${take}`,
      CACHE_TTL.STORE_RECENT_PURCHASES,
      async () => {
        const items = await this.prisma.orderItem.findMany({
          where: {
            order: { status: OrderStatus.COMPLETED },
            OR: [{ productId: { not: null } }, { bundleId: { not: null } }],
          },
          include: {
            product: { select: { name: true, slug: true, image: true } },
            bundle: { select: { name: true, slug: true, image: true } },
            order: {
              select: {
                createdAt: true,
                guestMinecraftNick: true,
                user: { select: { username: true } },
              },
            },
          },
          orderBy: { order: { createdAt: 'desc' } },
          take,
        });

        return items.map((item) => ({
          id: item.id,
          productName: item.product?.name ?? item.bundle?.name ?? 'Товар',
          productSlug: item.product?.slug ?? item.bundle?.slug ?? null,
          productImage: item.product?.image ?? item.bundle?.image ?? null,
          username: item.order.user?.username ?? item.order.guestMinecraftNick ?? null,
          createdAt: item.order.createdAt.toISOString(),
        }));
      },
    );
  }

  async quickBuy(dto: QuickBuyDto): Promise<QuickBuyResponse> {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, isActive: true },
      include: {
        variants: {
          where: { isActive: true },
          orderBy: [{ order: 'asc' }, { price: 'asc' }],
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Товар не найден');
    }

    if (QUICK_BUY_BLOCKED_TYPES.includes(product.type)) {
      throw new BadRequestException('Этот товар нельзя купить без входа в аккаунт');
    }

    const quantity = dto.quantity ?? 1;
    let variant = product.variants.find((v) => v.id === dto.variantId) ?? null;

    if (dto.variantId && !variant) {
      throw new NotFoundException('Вариант не найден');
    }

    if (!variant && product.type !== ProductType.CURRENCY) {
      variant = product.variants[0] ?? null;
      if (!variant) {
        throw new BadRequestException('У товара нет доступных вариантов');
      }
    }

    let unitPrice = 0;
    if (product.type === ProductType.CURRENCY) {
      unitPrice = 1;
    } else if (variant) {
      unitPrice = decimalToNumber(variant.price);
    }

    const totalPrice =
      product.type === ProductType.CURRENCY
        ? quantity
        : Math.round(unitPrice * quantity * 100) / 100;

    const orderNumber = await this.nextOrderNumber();
    const nick = dto.minecraftNick.trim();

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        userId: null,
        guestMinecraftNick: nick,
        status: OrderStatus.PENDING,
        subtotal: totalPrice,
        discountAmount: 0,
        total: totalPrice,
        items: {
          create: [
            {
              productId: product.id,
              variantId: variant?.id ?? null,
              quantity,
              unitPrice,
              totalPrice,
            },
          ],
        },
      },
    });

    await this.cache.delPattern(`${cacheKeys.storeRecentPurchases()}*`);

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentUrl: `/store/mock-payment?orderId=${order.id}`,
    };
  }

  async getByOrderNumber(userId: string, orderNumber: string): Promise<StoreOrder> {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: orderInclude,
    });

    if (!order) {
      throw new NotFoundException('Заказ не найден');
    }
    if (order.userId !== userId) {
      throw new ForbiddenException('Нет доступа к заказу');
    }

    return toStoreOrder(order);
  }

  async mockComplete(userId: string, orderId: string): Promise<StoreOrder> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: orderInclude,
    });

    if (!order) {
      throw new NotFoundException('Заказ не найден');
    }
    if (order.userId !== userId) {
      throw new ForbiddenException('Нет доступа к заказу');
    }
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Заказ уже обработан');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.COMPLETED,
          paidAt: new Date(),
          paymentMethod: 'mock',
        },
        include: orderInclude,
      });

      if (order.promoCodeId) {
        const existingUsage = await tx.promoCodeUsage.findUnique({
          where: {
            promoCodeId_userId: {
              promoCodeId: order.promoCodeId,
              userId,
            },
          },
        });

        if (!existingUsage) {
          await tx.promoCodeUsage.create({
            data: { promoCodeId: order.promoCodeId, userId },
          });
          await tx.promoCode.update({
            where: { id: order.promoCodeId },
            data: { usedCount: { increment: 1 } },
          });
        }
      }

      return result;
    });

    await this.emitOrderNotifications(updated, OrderStatus.COMPLETED);
    return toStoreOrder(updated);
  }

  async listAdmin(
    page = 1,
    limit = 20,
    status?: OrderStatus,
    search?: string,
  ): Promise<OrdersResponse> {
    const take = Math.min(100, Math.max(1, limit));
    const currentPage = Math.max(1, page);
    const skip = (currentPage - 1) * take;
    const q = search?.trim();
    const where: Prisma.OrderWhereInput = {
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { orderNumber: { contains: q, mode: 'insensitive' } },
              { guestMinecraftNick: { contains: q, mode: 'insensitive' } },
              { user: { username: { contains: q, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    return {
      items: rows.map(toStoreOrder),
      total,
      page: currentPage,
      limit: take,
      totalPages: Math.ceil(total / take) || 0,
    };
  }

  async stats() {
    const [pending, completed, cancelled, refunded, revenue] = await this.prisma.$transaction([
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.order.count({ where: { status: OrderStatus.COMPLETED } }),
      this.prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
      this.prisma.order.count({ where: { status: OrderStatus.REFUNDED } }),
      this.prisma.order.aggregate({
        where: { status: OrderStatus.COMPLETED },
        _sum: { total: true },
      }),
    ]);

    return {
      pending,
      completed,
      cancelled,
      refunded,
      revenue: decimalToNumber(revenue._sum.total ?? 0),
    };
  }

  async cancel(orderId: string, reason?: string): Promise<StoreOrder> {
    const order = await this.requireOrder(orderId);
    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.COMPLETED) {
      throw new BadRequestException('Нельзя отменить этот заказ');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelReason: reason,
      },
      include: orderInclude,
    });

    await this.emitOrderNotifications(updated, OrderStatus.CANCELLED);
    return toStoreOrder(updated);
  }

  async refund(orderId: string, reason?: string): Promise<StoreOrder> {
    const order = await this.requireOrder(orderId);
    if (order.status !== OrderStatus.COMPLETED) {
      throw new BadRequestException('Возврат возможен только для завершённых заказов');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.REFUNDED,
        refundedAt: new Date(),
        cancelReason: reason,
      },
      include: orderInclude,
    });

    await this.emitOrderNotifications(updated, OrderStatus.REFUNDED);
    return toStoreOrder(updated);
  }

  private async emitOrderNotifications(
    order: Prisma.OrderGetPayload<{ include: typeof orderInclude }>,
    status: OrderStatus,
  ) {
    const statusLabels: Partial<Record<OrderStatus, string>> = {
      [OrderStatus.COMPLETED]: 'оплачен',
      [OrderStatus.CANCELLED]: 'отменён',
      [OrderStatus.REFUNDED]: 'возвращён',
      [OrderStatus.FAILED]: 'не удался',
      [OrderStatus.PENDING]: 'ожидает оплаты',
    };

    if (order.userId) {
      const owner = await this.prisma.user.findUnique({
        where: { id: order.userId },
        select: { notifyOnOrder: true },
      });

      if (owner?.notifyOnOrder) {
        await this.notifications.createNotification({
          userId: order.userId,
          type: NotificationType.ORDER_STATUS_CHANGED,
          title: 'Статус заказа изменён',
          message: `Заказ ${order.orderNumber} ${statusLabels[status] ?? status}`,
          link: `/store/orders/${order.orderNumber}`,
          metadata: { orderId: order.id, orderNumber: order.orderNumber, status },
        });
      }
    }

    if (status !== OrderStatus.COMPLETED) {
      return;
    }

    const giftItems = order.items.filter((item) => item.giftToUserId);
    if (giftItems.length === 0) {
      return;
    }

    const giftUserIds = [...new Set(giftItems.map((item) => item.giftToUserId!))];
    const recipients = await this.prisma.user.findMany({
      where: { id: { in: giftUserIds } },
      select: { id: true, username: true, notifyOnGift: true },
    });
    const recipientMap = new Map(recipients.map((u) => [u.id, u]));

    const fromUser = order.userId
      ? await this.prisma.user.findUnique({
          where: { id: order.userId },
          select: { username: true },
        })
      : null;

    for (const item of giftItems) {
      const recipient = recipientMap.get(item.giftToUserId!);
      if (!recipient?.notifyOnGift) continue;

      const productName =
        item.product?.name ?? item.bundle?.name ?? 'Подарок';

      await this.notifications.createNotification({
        userId: recipient.id,
        type: NotificationType.GIFT_RECEIVED,
        title: 'Вам подарок!',
        message: fromUser
          ? `${fromUser.username} отправил(а) вам «${productName}»`
          : `Вам подарили «${productName}»`,
        link: `/users/${recipient.username}`,
        fromUserId: order.userId,
        imageUrl: item.product?.image ?? item.bundle?.image ?? null,
        metadata: {
          orderId: order.id,
          productId: item.productId,
          bundleId: item.bundleId,
        },
      });
    }
  }

  private async requireOrder(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException('Заказ не найден');
    }
    return order;
  }

  private async nextOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `TWO-${year}-`;

    const last = await this.prisma.order.findFirst({
      where: { orderNumber: { startsWith: prefix } },
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true },
    });

    let seq = 1;
    if (last) {
      const part = last.orderNumber.slice(prefix.length);
      const parsed = Number.parseInt(part, 10);
      if (!Number.isNaN(parsed)) {
        seq = parsed + 1;
      }
    }

    return `${prefix}${String(seq).padStart(5, '0')}`;
  }
}
