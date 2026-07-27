import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import {
  CreateOrderResponse,
  OrdersResponse,
  StoreOrder,
} from '@twomc/shared';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from './pricing.service';
import { decimalToNumber, toStoreOrder } from './store.mapper';

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

    return toStoreOrder(updated);
  }

  async listAdmin(page = 1, limit = 20, status?: OrderStatus): Promise<OrdersResponse> {
    const take = Math.min(100, Math.max(1, limit));
    const currentPage = Math.max(1, page);
    const skip = (currentPage - 1) * take;
    const where: Prisma.OrderWhereInput = status ? { status } : {};

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

    return toStoreOrder(updated);
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
