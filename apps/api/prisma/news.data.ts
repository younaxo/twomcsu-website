import { NewsCategory, NewsStatus } from '@prisma/client';

export interface SeedNewsItem {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverRandom: number;
  category: NewsCategory;
  status: NewsStatus;
  tags: string[];
  isPinned?: boolean;
  isFeatured?: boolean;
  publishedDaysAgo: number;
  authorUsername: 'owner' | 'admin';
  metaTitle?: string;
  metaDescription?: string;
}

export const seedNews: SeedNewsItem[] = [
  {
    slug: 'welcome-to-twomc',
    title: 'Добро пожаловать на TWOMC!',
    excerpt:
      'Официальный запуск сайта и обновлённой экосистемы сервера. Что нового и куда смотреть в первую очередь.',
    coverRandom: 11,
    category: NewsCategory.ANNOUNCEMENT,
    status: NewsStatus.PUBLISHED,
    tags: ['запуск', 'сайт', 'анонс'],
    isPinned: true,
    isFeatured: true,
    publishedDaysAgo: 2,
    authorUsername: 'owner',
    metaTitle: 'Добро пожаловать на TWOMC',
    metaDescription: 'Запуск сайта TWOMC: профили, магазин, обращения и новости.',
    content: `## Мы открыли сайт

Рады представить обновлённый сайт **TWOMC** — единую точку для профиля, магазина, обращений и новостей.

### Что уже доступно

- Профили игроков с наградами и статистикой
- Магазин привилегий и донат-услуг
- Система обращений в поддержку
- Правила и документы в разделе тем

### Что дальше

Следите за новостями: обновления сервера, ивенты и гайды будут появляться здесь первыми.

> Совет: привяжите аккаунт и проверьте настройки уведомлений в профиле.

[Перейти в магазин](/store)
`,
  },
  {
    slug: 'server-update-1-21',
    title: 'Обновление сервера до 1.21',
    excerpt:
      'Переход на актуальную версию Minecraft, новые механики и правки производительности.',
    coverRandom: 22,
    category: NewsCategory.UPDATE,
    status: NewsStatus.PUBLISHED,
    tags: ['обновление', '1.21', 'сервер'],
    isFeatured: true,
    publishedDaysAgo: 5,
    authorUsername: 'admin',
    content: `## Версия 1.21

Сервер переведён на **Minecraft 1.21**.

### Изменения

1. Новые биомы и мобы доступны на выживании
2. Оптимизация тиков и чанков
3. Обновлены плагины защиты и экономики

### Важно

Перед входом очистите кэш клиента и убедитесь, что версия совпадает.

\`\`\`
Версия клиента: 1.21.x
\`\`\`

![Обновление](https://picsum.photos/1200/600?random=22)
`,
  },
  {
    slug: 'economy-rebalance',
    title: 'Ребаланс экономики',
    excerpt: 'Пересмотрены цены магазина, курсы валют и награды за активность.',
    coverRandom: 33,
    category: NewsCategory.UPDATE,
    status: NewsStatus.PUBLISHED,
    tags: ['экономика', 'магазин', 'баланс'],
    publishedDaysAgo: 8,
    authorUsername: 'admin',
    content: `## Зачем ребаланс

Экономика разъехалась: часть предметов стала слишком дешёвой, часть — недоступной.

### Что изменилось

- Цены на ключевые привилегии
- Награды за ежедневный вход
- Курс обмена внутриигровой валюты

Подробности — в магазине и в игре на \`/shop\`.
`,
  },
  {
    slug: 'summer-event-2026',
    title: 'Летний ивент 2026',
    excerpt: 'Собирайте жетоны, открывайте сундуки и соревнуйтесь за уникальные награды.',
    coverRandom: 44,
    category: NewsCategory.EVENT,
    status: NewsStatus.PUBLISHED,
    tags: ['ивент', 'лето', 'награды'],
    isFeatured: true,
    publishedDaysAgo: 3,
    authorUsername: 'owner',
    content: `## Летний сезон

С **1 по 31 августа** на сервере работает летний ивент.

### Как участвовать

1. Выполняйте ежедневные задания
2. Собирайте **летние жетоны**
3. Обменивайте их у NPC на спавне

### Призы

- Уникальные косметические предметы
- Временные бусты
- Места в таблице лидеров

Удачи и хорошей жары!
`,
  },
  {
    slug: 'how-to-start',
    title: 'Гайд: как начать играть',
    excerpt: 'Пошаговая инструкция для новичков: регистрация, вход на сервер и первые шаги.',
    coverRandom: 55,
    category: NewsCategory.GUIDE,
    status: NewsStatus.PUBLISHED,
    tags: ['гайд', 'новичкам', 'старт'],
    publishedDaysAgo: 10,
    authorUsername: 'admin',
    content: `## Быстрый старт

### 1. Аккаунт

Зарегистрируйтесь на сайте тем же ником, что и в Minecraft.

### 2. Подключение

Адрес сервера указан на главной странице. Версия — актуальная из новостей.

### 3. Первые команды

- \`/spawn\` — на спавн
- \`/sethome\` — дом
- \`/tpa\` — телепорт к другу

### Полезные ссылки

- [Правила](/topics/game-rules)
- [Магазин](/store)
`,
  },
  {
    slug: 'claims-guide',
    title: 'Гайд: приваты и защита территории',
    excerpt: 'Как поставить приват, добавить друзей и не потерять постройки.',
    coverRandom: 66,
    category: NewsCategory.GUIDE,
    status: NewsStatus.PUBLISHED,
    tags: ['гайд', 'приват', 'защита'],
    publishedDaysAgo: 12,
    authorUsername: 'admin',
    content: `## Приваты

Без привата постройки не защищены.

### Базовые шаги

1. Купите или получите инструмент привата
2. Выделите углы региона
3. Подтвердите создание

### Друзья

Добавляйте доверенных игроков через меню региона — иначе они не смогут строить.

||Секрет: не публикуйте координаты базы в общем чате.||
`,
  },
  {
    slug: 'maintenance-window',
    title: 'Технические работы в четверг',
    excerpt: 'Короткое окно обслуживания: ожидайте недоступность сервера около 30 минут.',
    coverRandom: 77,
    category: NewsCategory.ANNOUNCEMENT,
    status: NewsStatus.PUBLISHED,
    tags: ['техработы', 'объявление'],
    publishedDaysAgo: 1,
    authorUsername: 'admin',
    content: `## Когда

**Четверг, 21:00 МСК** — примерно 30 минут.

### Что будет

- Обновление плагинов
- Бэкап мира
- Проверка мониторинга

Спасибо за понимание.
`,
  },
  {
    slug: 'patch-notes-july',
    title: 'Патч-ноты: июль',
    excerpt: 'Список исправлений и мелких улучшений за июль: чат, магазин, профили.',
    coverRandom: 88,
    category: NewsCategory.PATCH_NOTES,
    status: NewsStatus.PUBLISHED,
    tags: ['патч', 'фиксы', 'июль'],
    publishedDaysAgo: 6,
    authorUsername: 'owner',
    content: `## Июльский патч

### Исправлено

- Дублирование уведомлений о друзьях
- Ошибки загрузки аватаров
- Краш при оформлении подарка в магазине

### Улучшено

- Скорость списка игроков
- Типографика в темах правил
- Модерация обращений

### Известные проблемы

- Редкий лаг при первом входе после вайпа — в работе
`,
  },
  {
    slug: 'community-contest',
    title: 'Конкурс скриншотов сообщества',
    excerpt: 'Присылайте лучшие кадры с сервера — победители получат призы в магазине.',
    coverRandom: 99,
    category: NewsCategory.COMMUNITY,
    status: NewsStatus.PUBLISHED,
    tags: ['комьюнити', 'конкурс', 'скриншоты'],
    publishedDaysAgo: 4,
    authorUsername: 'owner',
    content: `## Конкурс

До конца месяца присылайте скриншоты в Discord в канал \`#screenshots\`.

### Критерии

- Оригинальность
- Композиция
- Атмосфера сервера

Победители — в следующем анонсе.
`,
  },
];

export const seedNewsComments: Array<{
  newsSlug: string;
  authorUsername: string;
  content: string;
  replies?: Array<{ authorUsername: string; content: string }>;
}> = [
  {
    newsSlug: 'welcome-to-twomc',
    authorUsername: 'player1',
    content: 'Наконец-то сайт! Выглядит огонь 🔥',
    replies: [
      { authorUsername: 'admin', content: 'Спасибо! Пишите, если что-то сломается.' },
    ],
  },
  {
    newsSlug: 'welcome-to-twomc',
    authorUsername: 'helper',
    content: 'Отличная новость для новичков — теперь всё в одном месте.',
  },
  {
    newsSlug: 'server-update-1-21',
    authorUsername: 'player2',
    content: 'Обновление зашло. Тпс держится лучше.',
  },
  {
    newsSlug: 'server-update-1-21',
    authorUsername: 'moderator',
    content: 'Не забудьте обновить клиент перед входом.',
  },
  {
    newsSlug: 'summer-event-2026',
    authorUsername: 'player1',
    content: 'Уже фармлю жетоны, кто со мной?',
    replies: [{ authorUsername: 'player2', content: 'Пиши в лс, пойдём пати.' }],
  },
  {
    newsSlug: 'how-to-start',
    authorUsername: 'player2',
    content: 'Гайд понятный, спасибо админам.',
  },
  {
    newsSlug: 'patch-notes-july',
    authorUsername: 'helper',
    content: 'Фикс уведомлений — то что нужно было.',
  },
  {
    newsSlug: 'community-contest',
    authorUsername: 'player1',
    content: 'Уже отправил три скрина в Discord!',
  },
  {
    newsSlug: 'maintenance-window',
    authorUsername: 'moderator',
    content: 'Буду на смене после работ.',
  },
  {
    newsSlug: 'economy-rebalance',
    authorUsername: 'player2',
    content: 'Цены стали честнее, имба ушла.',
  },
];
