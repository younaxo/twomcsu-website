import { DiscountType, ProductType } from '@prisma/client';
import { Prisma } from '@prisma/client';

export interface SeedBulkDiscount {
  productType?: ProductType;
  minQuantity?: number;
  minAmount?: Prisma.Decimal.Value;
  discountType: DiscountType;
  discountValue: Prisma.Decimal.Value;
}

export const seedBulkDiscounts: SeedBulkDiscount[] = [
  {
    productType: ProductType.KEY,
    minQuantity: 10,
    discountType: DiscountType.PERCENT,
    discountValue: 10,
  },
  {
    productType: ProductType.KEY,
    minQuantity: 20,
    discountType: DiscountType.PERCENT,
    discountValue: 20,
  },
  {
    productType: ProductType.CURRENCY,
    minAmount: 500,
    discountType: DiscountType.BONUS,
    discountValue: 5,
  },
  {
    productType: ProductType.CURRENCY,
    minAmount: 1000,
    discountType: DiscountType.BONUS,
    discountValue: 10,
  },
  {
    productType: ProductType.CURRENCY,
    minAmount: 3000,
    discountType: DiscountType.BONUS,
    discountValue: 15,
  },
  {
    productType: ProductType.CURRENCY,
    minAmount: 5000,
    discountType: DiscountType.BONUS,
    discountValue: 20,
  },
];

export interface SeedLoyaltyDiscount {
  minPurchases: number;
  discountPercent: Prisma.Decimal.Value;
  name: string;
  description: string;
}

export const seedLoyaltyDiscounts: SeedLoyaltyDiscount[] = [
  {
    minPurchases: 5,
    discountPercent: 5,
    name: 'Друг проекта',
    description: 'Скидка 5% после 5 покупок',
  },
  {
    minPurchases: 10,
    discountPercent: 7,
    name: 'Постоянный клиент',
    description: 'Скидка 7% после 10 покупок',
  },
  {
    minPurchases: 25,
    discountPercent: 10,
    name: 'Легенда TWOMC',
    description: 'Скидка 10% после 25 покупок',
  },
];
