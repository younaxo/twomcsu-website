import { CurrencyType, ProductDuration, ProductType } from '@prisma/client';
import { Prisma } from '@prisma/client';

export interface SeedVariant {
  duration: ProductDuration;
  price: Prisma.Decimal.Value;
  oldPrice?: Prisma.Decimal.Value;
  order?: number;
}

export interface SeedProduct {
  name: string;
  slug: string;
  description: string;
  fullDescription?: string;
  type: ProductType;
  categorySlug: string;
  positionSlug?: string;
  isGiftable?: boolean;
  isSelfOnly?: boolean;
  isUnique?: boolean;
  isSeasonalOnly?: boolean;
  maxPerPurchase?: number;
  currencyType?: CurrencyType;
  currencyAmount?: number;
  isFeatured?: boolean;
  isNew?: boolean;
  isPopular?: boolean;
  order?: number;
  variants: SeedVariant[];
}

export const seedProducts: SeedProduct[] = [
  // Privileges
  {
    name: 'Polemicism',
    slug: 'polemicism',
    description: 'Высший донат-ранг с максимальными возможностями',
    type: ProductType.PRIVILEGE,
    categorySlug: 'privileges',
    positionSlug: 'polemicism',
    isFeatured: true,
    isPopular: true,
    order: 0,
    variants: [
      { duration: ProductDuration.FOREVER, price: 4999, order: 0 },
      { duration: ProductDuration.MONTHS_3, price: 2499, order: 1 },
      { duration: ProductDuration.MONTH_1, price: 1499, order: 2 },
    ],
  },
  {
    name: 'Svarog',
    slug: 'svarog',
    description: 'Мощный ранг для уверенных донатеров',
    type: ProductType.PRIVILEGE,
    categorySlug: 'privileges',
    positionSlug: 'svarog',
    isPopular: true,
    order: 1,
    variants: [
      { duration: ProductDuration.FOREVER, price: 2999, order: 0 },
      { duration: ProductDuration.MONTHS_3, price: 1499, order: 1 },
      { duration: ProductDuration.MONTH_1, price: 799, order: 2 },
    ],
  },
  {
    name: 'Kratos',
    slug: 'kratos',
    description: 'Сильный ранг с расширенными привилегиями',
    type: ProductType.PRIVILEGE,
    categorySlug: 'privileges',
    positionSlug: 'kratos',
    order: 2,
    variants: [
      { duration: ProductDuration.FOREVER, price: 1899, order: 0 },
      { duration: ProductDuration.MONTHS_3, price: 1199, order: 1 },
      { duration: ProductDuration.MONTH_1, price: 599, order: 2 },
    ],
  },
  {
    name: 'Apollon',
    slug: 'apollon',
    description: 'Сбалансированный ранг для активной игры',
    type: ProductType.PRIVILEGE,
    categorySlug: 'privileges',
    positionSlug: 'apollon',
    order: 3,
    variants: [
      { duration: ProductDuration.FOREVER, price: 1499, order: 0 },
      { duration: ProductDuration.MONTHS_3, price: 699, order: 1 },
      { duration: ProductDuration.MONTH_1, price: 399, order: 2 },
    ],
  },
  {
    name: 'Deimos',
    slug: 'deimos',
    description: 'Хороший старт для донатера',
    type: ProductType.PRIVILEGE,
    categorySlug: 'privileges',
    positionSlug: 'deimos',
    order: 4,
    variants: [
      { duration: ProductDuration.FOREVER, price: 1159, order: 0 },
      { duration: ProductDuration.MONTHS_3, price: 599, order: 1 },
      { duration: ProductDuration.MONTH_1, price: 299, order: 2 },
    ],
  },
  {
    name: 'Ares',
    slug: 'ares',
    description: 'Доступный ранг с полезными бонусами',
    type: ProductType.PRIVILEGE,
    categorySlug: 'privileges',
    positionSlug: 'ares',
    order: 5,
    variants: [
      { duration: ProductDuration.FOREVER, price: 519, order: 0 },
      { duration: ProductDuration.MONTHS_3, price: 259, order: 1 },
      { duration: ProductDuration.MONTH_1, price: 129, order: 2 },
    ],
  },
  {
    name: 'Gefest',
    slug: 'gefest',
    description: 'Начальный донат-ранг',
    type: ProductType.PRIVILEGE,
    categorySlug: 'privileges',
    positionSlug: 'gefest',
    isNew: true,
    order: 6,
    variants: [
      { duration: ProductDuration.FOREVER, price: 179, order: 0 },
      { duration: ProductDuration.MONTHS_3, price: 79, order: 1 },
      { duration: ProductDuration.MONTH_1, price: 39, order: 2 },
    ],
  },

  // Keys
  {
    name: 'Ключ к кейсу с донатом',
    slug: 'key-donate',
    description: 'Открывает кейс с донат-предметами',
    type: ProductType.KEY,
    categorySlug: 'keys',
    maxPerPurchase: 50,
    isPopular: true,
    order: 0,
    variants: [{ duration: ProductDuration.ONE_TIME, price: 79 }],
  },
  {
    name: 'Ключ к кейсу с рубинами',
    slug: 'key-rubies',
    description: 'Открывает кейс с рубинами',
    type: ProductType.KEY,
    categorySlug: 'keys',
    maxPerPurchase: 50,
    order: 1,
    variants: [{ duration: ProductDuration.ONE_TIME, price: 49 }],
  },
  {
    name: 'Ключ к кейсу с титулами',
    slug: 'key-titles',
    description: 'Открывает кейс с титулами',
    type: ProductType.KEY,
    categorySlug: 'keys',
    maxPerPurchase: 50,
    order: 2,
    variants: [{ duration: ProductDuration.ONE_TIME, price: 19 }],
  },

  // Other
  {
    name: 'Подписка Плюс',
    slug: 'subscription-plus',
    description: 'Премиум-подписка с бонусами на сайте и в игре',
    type: ProductType.SUBSCRIPTION,
    categorySlug: 'other',
    isGiftable: false,
    isSelfOnly: true,
    isFeatured: true,
    order: 0,
    variants: [
      { duration: ProductDuration.FOREVER, price: 899, order: 0 },
      { duration: ProductDuration.MONTHS_3, price: 499, order: 1 },
      { duration: ProductDuration.MONTH_1, price: 199, order: 2 },
    ],
  },
  {
    name: 'Значок «Верифицирован»',
    slug: 'badge-verified',
    description: 'Галочка верификации рядом с ником',
    type: ProductType.BADGE,
    categorySlug: 'other',
    isGiftable: false,
    isSelfOnly: true,
    order: 1,
    variants: [
      { duration: ProductDuration.FOREVER, price: 599, order: 0 },
      { duration: ProductDuration.MONTHS_3, price: 299, order: 1 },
      { duration: ProductDuration.MONTH_1, price: 99, order: 2 },
    ],
  },
  {
    name: 'Боевой пропуск',
    slug: 'battle-pass',
    description: 'Сезонный боевой пропуск с наградами',
    type: ProductType.BATTLE_PASS,
    categorySlug: 'other',
    isSeasonalOnly: true,
    isNew: true,
    order: 2,
    variants: [{ duration: ProductDuration.SEASON, price: 349 }],
  },
  {
    name: 'Усилитель Боевого пропуска',
    slug: 'battle-pass-booster',
    description: 'Ускоряет прогресс боевого пропуска на неделю',
    type: ProductType.BATTLE_PASS_BOOSTER,
    categorySlug: 'other',
    isGiftable: false,
    isSelfOnly: true,
    order: 3,
    variants: [{ duration: ProductDuration.WEEK_1, price: 99 }],
  },
  {
    name: 'Размут',
    slug: 'unmute',
    description: 'Снятие мута с вашего аккаунта',
    type: ProductType.UNMUTE,
    categorySlug: 'other',
    isGiftable: false,
    isSelfOnly: true,
    isUnique: true,
    maxPerPurchase: 1,
    order: 4,
    variants: [{ duration: ProductDuration.ONE_TIME, price: 60 }],
  },
  {
    name: 'Разбан',
    slug: 'unban',
    description: 'Снятие бана с вашего аккаунта',
    type: ProductType.UNBAN,
    categorySlug: 'other',
    isGiftable: false,
    isSelfOnly: true,
    isUnique: true,
    maxPerPurchase: 1,
    order: 5,
    variants: [{ duration: ProductDuration.ONE_TIME, price: 199 }],
  },

  // Currency
  {
    name: 'Рубины',
    slug: 'rubies',
    description: 'Валюта сайта и игры. 1₽ = 2 рубина',
    type: ProductType.CURRENCY,
    categorySlug: 'currency',
    currencyType: CurrencyType.RUBIES,
    currencyAmount: 2,
    isFeatured: true,
    order: 0,
    variants: [{ duration: ProductDuration.ONE_TIME, price: 1 }],
  },
  {
    name: 'Монеты',
    slug: 'coins',
    description: 'Игровая валюта. 1₽ = 8 монет',
    type: ProductType.CURRENCY,
    categorySlug: 'currency',
    currencyType: CurrencyType.COINS,
    currencyAmount: 8,
    order: 1,
    variants: [{ duration: ProductDuration.ONE_TIME, price: 1 }],
  },

  // Decorations
  {
    name: 'Цветущая сакура',
    slug: 'decoration-sakura',
    description: 'Украшение профиля: цветущая сакура',
    type: ProductType.DECORATION,
    categorySlug: 'decorations',
    order: 0,
    variants: [{ duration: ProductDuration.FOREVER, price: 49 }],
  },
  {
    name: 'Милый котик',
    slug: 'decoration-cat',
    description: 'Украшение профиля: милый котик',
    type: ProductType.DECORATION,
    categorySlug: 'decorations',
    isPopular: true,
    order: 1,
    variants: [{ duration: ProductDuration.FOREVER, price: 199 }],
  },
  {
    name: 'Белая звёздочка',
    slug: 'decoration-star',
    description: 'Украшение профиля: белая звёздочка',
    type: ProductType.DECORATION,
    categorySlug: 'decorations',
    order: 2,
    variants: [{ duration: ProductDuration.FOREVER, price: 139 }],
  },
  {
    name: 'Фермерская шляпка',
    slug: 'decoration-hat',
    description: 'Украшение профиля: фермерская шляпка',
    type: ProductType.DECORATION,
    categorySlug: 'decorations',
    order: 3,
    variants: [{ duration: ProductDuration.FOREVER, price: 49 }],
  },
  {
    name: 'Добрые сердечки',
    slug: 'decoration-hearts',
    description: 'Украшение профиля: добрые сердечки',
    type: ProductType.DECORATION,
    categorySlug: 'decorations',
    order: 4,
    variants: [{ duration: ProductDuration.FOREVER, price: 99 }],
  },
  {
    name: 'Наруто',
    slug: 'decoration-naruto',
    description: 'Украшение профиля: Наруто',
    type: ProductType.DECORATION,
    categorySlug: 'decorations',
    isNew: true,
    order: 5,
    variants: [{ duration: ProductDuration.FOREVER, price: 199 }],
  },
  {
    name: 'Зловещая маска',
    slug: 'decoration-mask',
    description: 'Украшение профиля: зловещая маска',
    type: ProductType.DECORATION,
    categorySlug: 'decorations',
    order: 6,
    variants: [{ duration: ProductDuration.FOREVER, price: 139 }],
  },
  {
    name: 'Светящиеся сердечки',
    slug: 'decoration-glow-hearts',
    description: 'Украшение профиля: светящиеся сердечки',
    type: ProductType.DECORATION,
    categorySlug: 'decorations',
    order: 7,
    variants: [{ duration: ProductDuration.FOREVER, price: 99 }],
  },
];
