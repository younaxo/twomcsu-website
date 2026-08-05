import { BadRequestException, Injectable } from '@nestjs/common';
import {
  BulkDiscount as BulkDiscountRow,
  DiscountType,
  LoyaltyDiscount as LoyaltyDiscountRow,
  ProductType,
  PromoCode as PromoCodeRow,
} from '@prisma/client';
import {
  CartTotals,
  PriceDiscount,
  ProductType as SharedProductType,
  PromoValidationResult,
  StoreDiscountType,
} from '@twomc/shared';
import { PrismaService } from '../prisma/prisma.service';
import { decimalToNumber } from './store.mapper';

export type PricingCartItem = {
  quantity: number;
  product?: {
    id: string;
    type: ProductType;
    name: string;
  } | null;
  variant?: {
    price: { toString(): string } | number;
  } | null;
  bundle?: {
    totalPrice: { toString(): string } | number;
    name: string;
  } | null;
};

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateCartTotal(
    cartItems: PricingCartItem[],
    promoCode?: PromoCodeRow | null,
    userId?: string,
  ): Promise<CartTotals> {
    const bulkDiscounts = await this.prisma.bulkDiscount.findMany({
      where: { isActive: true },
    });

    const discounts: PriceDiscount[] = [];
    let currencyBonusPercent: number | undefined;
    let subtotal = 0;

    for (const item of cartItems) {
      const line = this.calculateLine(item, bulkDiscounts);
      subtotal += line.lineTotal;

      if (line.bulkDiscountAmount > 0 && line.bulkLabel) {
        discounts.push({
          type: 'bulk',
          label: line.bulkLabel,
          amount: roundMoney(line.bulkDiscountAmount),
        });
      }

      if (line.currencyBonusPercent != null) {
        currencyBonusPercent = Math.max(currencyBonusPercent ?? 0, line.currencyBonusPercent);
      }
    }

    subtotal = roundMoney(subtotal);
    let runningTotal = subtotal;
    let discountAmount = discounts.reduce((sum, d) => sum + d.amount, 0);

    if (promoCode) {
      const promoDiscount = this.applyPromoDiscount(cartItems, subtotal, promoCode);
      if (promoDiscount > 0) {
        discounts.push({
          type: 'promo',
          label: `Промокод ${promoCode.code}`,
          amount: promoDiscount,
        });
        discountAmount += promoDiscount;
        runningTotal -= promoDiscount;
      }
    }

    if (userId) {
      const loyalty = await this.getBestLoyaltyDiscount(userId);
      if (loyalty) {
        const amount = roundMoney((Math.max(0, runningTotal) * decimalToNumber(loyalty.discountPercent)) / 100);
        if (amount > 0) {
          discounts.push({
            type: 'loyalty',
            label: loyalty.name,
            amount,
          });
          discountAmount += amount;
          runningTotal -= amount;
        }
      }
    }

    return {
      subtotal,
      discounts,
      discountAmount: roundMoney(discountAmount),
      total: roundMoney(Math.max(0, runningTotal)),
      ...(currencyBonusPercent != null ? { currencyBonusPercent } : {}),
    };
  }

  async validatePromoCode(
    code: string,
    userId: string | undefined,
    cartItems: PricingCartItem[],
    subtotal?: number,
  ): Promise<PromoValidationResult> {
    const promo = await this.prisma.promoCode.findFirst({
      where: { code: { equals: code.trim(), mode: 'insensitive' } },
    });

    if (!promo || !promo.isActive) {
      return { valid: false, message: 'Промокод не найден или неактивен' };
    }

    const now = new Date();
    if (promo.validFrom && promo.validFrom > now) {
      return { valid: false, message: 'Промокод ещё не действует' };
    }
    if (promo.validUntil && promo.validUntil < now) {
      return { valid: false, message: 'Срок действия промокода истёк' };
    }
    if (promo.maxUses != null && promo.usedCount >= promo.maxUses) {
      return { valid: false, message: 'Промокод больше недоступен' };
    }

    if (userId) {
      const usage = await this.prisma.promoCodeUsage.findUnique({
        where: {
          promoCodeId_userId: { promoCodeId: promo.id, userId },
        },
      });
      if (usage) {
        return { valid: false, message: 'Вы уже использовали этот промокод' };
      }

      if (promo.firstPurchaseOnly) {
        const completedOrders = await this.prisma.order.count({
          where: { userId, status: 'COMPLETED' },
        });
        if (completedOrders > 0) {
          return { valid: false, message: 'Промокод только для первой покупки' };
        }
      }
    }

    const orderSubtotal =
      subtotal ??
      cartItems.reduce((sum, item) => sum + this.calculateLine(item, []).lineTotal, 0);

    if (promo.minOrderAmount != null && orderSubtotal < decimalToNumber(promo.minOrderAmount)) {
      return {
        valid: false,
        message: `Минимальная сумма заказа — ${decimalToNumber(promo.minOrderAmount)} ₽`,
      };
    }

    if (promo.applicableToTypes.length > 0) {
      const hasApplicable = cartItems.some((item) => {
        const type = item.product?.type;
        return type && promo.applicableToTypes.includes(type);
      });
      if (!hasApplicable && cartItems.length > 0) {
        return { valid: false, message: 'Промокод не применим к товарам в корзине' };
      }
    }

    return {
      valid: true,
      code: promo.code,
      discountType: promo.discountType as StoreDiscountType,
      discountValue: decimalToNumber(promo.discountValue),
      applicableTypes: promo.applicableToTypes as SharedProductType[],
      message: 'Промокод применён',
    };
  }

  async requireValidPromo(
    code: string,
    userId: string,
    cartItems: PricingCartItem[],
    subtotal?: number,
  ): Promise<PromoCodeRow> {
    const result = await this.validatePromoCode(code, userId, cartItems, subtotal);
    if (!result.valid) {
      throw new BadRequestException(result.message ?? 'Промокод недействителен');
    }

    const promo = await this.prisma.promoCode.findFirst({
      where: { code: { equals: code.trim(), mode: 'insensitive' } },
    });
    if (!promo) {
      throw new BadRequestException('Промокод не найден или неактивен');
    }
    return promo;
  }

  private calculateLine(
    item: PricingCartItem,
    bulkDiscounts: BulkDiscountRow[],
  ): {
    unitPrice: number;
    lineTotal: number;
    bulkDiscountAmount: number;
    bulkLabel?: string;
    currencyBonusPercent?: number;
  } {
    if (item.bundle) {
      const unitPrice = decimalToNumber(item.bundle.totalPrice);
      return {
        unitPrice,
        lineTotal: roundMoney(unitPrice * item.quantity),
        bulkDiscountAmount: 0,
      };
    }

    if (!item.product) {
      return { unitPrice: 0, lineTotal: 0, bulkDiscountAmount: 0 };
    }

    // Currency: quantity is ruble amount, unit price is 1
    if (item.product.type === ProductType.CURRENCY) {
      const amount = item.quantity;
      const bonus = this.findBestBulk(
        bulkDiscounts,
        item.product.id,
        item.product.type,
        amount,
        amount,
        DiscountType.BONUS,
      );

      return {
        unitPrice: 1,
        lineTotal: amount,
        bulkDiscountAmount: 0,
        ...(bonus
          ? { currencyBonusPercent: decimalToNumber(bonus.discountValue) }
          : {}),
      };
    }

    const unitPrice = item.variant ? decimalToNumber(item.variant.price) : 0;
    const baseTotal = unitPrice * item.quantity;

    if (item.product.type === ProductType.KEY) {
      const bulk = this.findBestBulk(
        bulkDiscounts,
        item.product.id,
        item.product.type,
        item.quantity,
        baseTotal,
        DiscountType.PERCENT,
      );

      if (bulk) {
        const percent = decimalToNumber(bulk.discountValue);
        const discountAmount = roundMoney((baseTotal * percent) / 100);
        return {
          unitPrice,
          lineTotal: roundMoney(baseTotal - discountAmount),
          bulkDiscountAmount: discountAmount,
          bulkLabel: `Скидка за объём ${percent}% (${item.product.name})`,
        };
      }
    }

    return {
      unitPrice,
      lineTotal: roundMoney(baseTotal),
      bulkDiscountAmount: 0,
    };
  }

  private findBestBulk(
    discounts: BulkDiscountRow[],
    productId: string,
    productType: ProductType,
    quantity: number,
    amount: number,
    discountType: DiscountType,
  ): BulkDiscountRow | null {
    const matched = discounts.filter((d) => {
      if (d.discountType !== discountType || !d.isActive) return false;
      if (d.productId && d.productId !== productId) return false;
      if (!d.productId && d.productType && d.productType !== productType) return false;
      if (!d.productId && !d.productType) return false;
      if (quantity < d.minQuantity) return false;
      if (d.minAmount != null && amount < decimalToNumber(d.minAmount)) return false;
      return true;
    });

    if (matched.length === 0) return null;

    return matched.reduce((best, current) =>
      decimalToNumber(current.discountValue) > decimalToNumber(best.discountValue)
        ? current
        : best,
    );
  }

  private applyPromoDiscount(
    cartItems: PricingCartItem[],
    subtotal: number,
    promo: PromoCodeRow,
  ): number {
    const value = decimalToNumber(promo.discountValue);

    if (promo.discountType === DiscountType.FIXED) {
      return roundMoney(Math.min(value, subtotal));
    }

    if (promo.discountType === DiscountType.PERCENT) {
      let applicable = 0;
      for (const item of cartItems) {
        if (item.bundle) {
          if (promo.applicableToTypes.length === 0) {
            applicable += decimalToNumber(item.bundle.totalPrice) * item.quantity;
          }
          continue;
        }
        if (!item.product) continue;
        if (
          promo.applicableToTypes.length > 0 &&
          !promo.applicableToTypes.includes(item.product.type)
        ) {
          continue;
        }
        applicable += this.calculateLine(item, []).lineTotal;
      }

      return roundMoney((applicable * value) / 100);
    }

    return 0;
  }

  private async getBestLoyaltyDiscount(userId: string): Promise<LoyaltyDiscountRow | null> {
    const completedCount = await this.prisma.order.count({
      where: { userId, status: 'COMPLETED' },
    });

    if (completedCount <= 0) return null;

    const tiers = await this.prisma.loyaltyDiscount.findMany({
      where: {
        isActive: true,
        minPurchases: { lte: completedCount },
      },
      orderBy: { minPurchases: 'desc' },
      take: 1,
    });

    return tiers[0] ?? null;
  }
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
