import { DiscountType, Prisma } from '@prisma/client';

export interface SeedPromoCode {
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: Prisma.Decimal.Value;
  maxUses?: number;
}

export const seedPromoCodes: SeedPromoCode[] = [
  {
    code: 'WELCOME2024',
    description: '10% на первую покупку',
    discountType: DiscountType.PERCENT,
    discountValue: 10,
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
