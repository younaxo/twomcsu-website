import { DiscountType, Prisma, ProductType } from '@prisma/client';

export interface SeedPromoCode {
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: Prisma.Decimal.Value;
  maxUses?: number;
  applicableToTypes?: ProductType[];
  minOrderAmount?: Prisma.Decimal.Value;
  firstPurchaseOnly?: boolean;
}

export const seedPromoCodes: SeedPromoCode[] = [
  {
    code: 'WELCOME2024',
    description: '10% на первую покупку',
    discountType: DiscountType.PERCENT,
    discountValue: 10,
    firstPurchaseOnly: true,
  },
  {
    code: 'SUMMER20',
    description: '20% на все ранги',
    discountType: DiscountType.PERCENT,
    discountValue: 20,
    applicableToTypes: [ProductType.PRIVILEGE],
  },
  {
    code: 'KEYS50',
    description: '50% на любой ключ (1 использование на юзера)',
    discountType: DiscountType.PERCENT,
    discountValue: 50,
    applicableToTypes: [ProductType.KEY],
    maxUses: undefined,
  },
  {
    code: 'VIP50',
    description: '50 рублей скидки, первым сотне',
    discountType: DiscountType.FIXED,
    discountValue: 50,
    maxUses: 100,
  },
  {
    code: 'BONUS100',
    description: '100 бонусных монет',
    discountType: DiscountType.BONUS,
    discountValue: 100,
    maxUses: 1000,
  },
];
