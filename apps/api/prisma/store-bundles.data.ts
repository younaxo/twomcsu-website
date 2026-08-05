import { Prisma } from '@prisma/client';

export interface SeedBundleItem {
  productSlug: string;
  variantDuration?: string;
  quantity: number;
}

export interface SeedBundle {
  name: string;
  slug: string;
  description: string;
  totalPrice: Prisma.Decimal.Value;
  originalPrice: Prisma.Decimal.Value;
  isFeatured?: boolean;
  items: SeedBundleItem[];
}

export const seedBundles: SeedBundle[] = [
  {
    name: 'Стартовый набор',
    slug: 'starter-pack',
    description: 'Gefest навсегда и 3 ключа к кейсу с титулами',
    totalPrice: 199,
    originalPrice: 279,
    isFeatured: true,
    items: [
      { productSlug: 'gefest', variantDuration: 'FOREVER', quantity: 1 },
      { productSlug: 'key-titles', variantDuration: 'ONE_TIME', quantity: 3 },
    ],
  },
  {
    name: 'Донатерский набор',
    slug: 'donator-pack',
    description: 'Три ключа: донат, рубины и титулы',
    totalPrice: 129,
    originalPrice: 147,
    items: [
      { productSlug: 'key-donate', variantDuration: 'ONE_TIME', quantity: 1 },
      { productSlug: 'key-rubies', variantDuration: 'ONE_TIME', quantity: 1 },
      { productSlug: 'key-titles', variantDuration: 'ONE_TIME', quantity: 1 },
    ],
  },
  {
    name: 'Про пак',
    slug: 'pro-pack',
    description: 'Svarog на 3 месяца, боевой пропуск и подписка Плюс',
    totalPrice: 1999,
    originalPrice: 2397,
    isFeatured: true,
    items: [
      { productSlug: 'svarog', variantDuration: 'MONTHS_3', quantity: 1 },
      { productSlug: 'battle-pass', variantDuration: 'SEASON', quantity: 1 },
      { productSlug: 'subscription-plus', variantDuration: 'MONTH_1', quantity: 1 },
    ],
  },
];
