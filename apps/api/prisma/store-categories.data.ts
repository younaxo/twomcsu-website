export interface SeedCategory {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  order: number;
  parentSlug?: string;
}

export const seedCategories: SeedCategory[] = [
  {
    name: 'Игровые',
    slug: 'games',
    description: 'Товары для Minecraft-сервера',
    icon: 'Gamepad2',
    order: 0,
  },
  {
    name: 'Привилегии',
    slug: 'privileges',
    description: 'Игровые ранги и привилегии',
    icon: 'Crown',
    order: 0,
    parentSlug: 'games',
  },
  {
    name: 'Ключи',
    slug: 'keys',
    description: 'Ключи к кейсам',
    icon: 'KeyRound',
    order: 1,
    parentSlug: 'games',
  },
  {
    name: 'Валюта',
    slug: 'currency',
    description: 'Рубины и монеты',
    icon: 'Coins',
    order: 2,
    parentSlug: 'games',
  },
  {
    name: 'Другое',
    slug: 'other',
    description: 'Подписки, БП, размут и разбан',
    icon: 'Package',
    order: 3,
    parentSlug: 'games',
  },
  {
    name: 'Сайт',
    slug: 'site',
    description: 'Товары для профиля на сайте',
    icon: 'Globe',
    order: 1,
  },
  {
    name: 'Украшения профиля',
    slug: 'decorations',
    description: 'Декорации для профиля',
    icon: 'Sparkles',
    order: 0,
    parentSlug: 'site',
  },
  {
    name: 'Наборы',
    slug: 'bundles',
    description: 'Готовые наборы со скидкой',
    icon: 'Gift',
    order: 2,
  },
];
