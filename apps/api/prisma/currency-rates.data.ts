import { DiscountType, Prisma } from '@prisma/client';

export interface SeedCurrencyRate {
  currency: string;
  rate: Prisma.Decimal.Value;
  symbol: string;
  flag: string;
}

export const seedCurrencyRates: SeedCurrencyRate[] = [
  { currency: 'USD', rate: 95, symbol: '$', flag: '🇺🇸' },
  { currency: 'EUR', rate: 105, symbol: '€', flag: '🇪🇺' },
  { currency: 'UAH', rate: 2.3, symbol: '₴', flag: '🇺🇦' },
  { currency: 'KZT', rate: 0.2, symbol: '₸', flag: '🇰🇿' },
];
