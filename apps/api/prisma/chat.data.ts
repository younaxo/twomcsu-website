import { ChatChannelType, PrismaClient } from '@prisma/client';

const CHANNELS = [
  {
    slug: 'general',
    name: 'Общий',
    description: 'Общение на любые темы',
    type: ChatChannelType.GENERAL,
    icon: '🌍',
    order: 1,
  },
  {
    slug: 'trade',
    name: 'Торговля',
    description: 'Покупка и продажа предметов',
    type: ChatChannelType.TRADE,
    icon: '💼',
    order: 2,
  },
  {
    slug: 'help',
    name: 'Помощь',
    description: 'Вопросы по серверу и правилам',
    type: ChatChannelType.HELP,
    icon: '❓',
    order: 3,
  },
  {
    slug: 'announcements',
    name: 'Объявления',
    description: 'Официальные объявления администрации',
    type: ChatChannelType.ANNOUNCEMENTS,
    icon: '📢',
    order: 4,
    isReadOnly: true,
    minRoleGroup: 'MODERATOR',
  },
  {
    slug: 'game',
    name: 'Игровой',
    description: 'Обсуждение игровых механик',
    type: ChatChannelType.GAME,
    icon: '🎮',
    order: 5,
  },
  {
    slug: 'flood',
    name: 'Флуд',
    description: 'Свободное общение без ограничений',
    type: ChatChannelType.FLOOD,
    icon: '💬',
    order: 6,
  },
] as const;

const SAMPLE_MESSAGES = [
  'Всем привет! Как дела на сервере?',
  'Кто хочет поиграть вместе?',
  'На спавне новый ивент, заходите',
  'Продаю алмазы, пишите в ЛС',
  'Как получить первую привилегию?',
  'Добро пожаловать на TWOMC!',
  'Сегодня вайп? Или на следующей неделе?',
  'Кто знает координаты спавна?',
];

export async function seedChat(prisma: PrismaClient) {
  for (const channel of CHANNELS) {
    await prisma.chatChannel.upsert({
      where: { slug: channel.slug },
      update: {
        name: channel.name,
        description: channel.description,
        type: channel.type,
        icon: channel.icon,
        order: channel.order,
        isReadOnly: 'isReadOnly' in channel ? channel.isReadOnly : false,
        minRoleGroup: 'minRoleGroup' in channel ? channel.minRoleGroup : null,
        isActive: true,
      },
      create: {
        slug: channel.slug,
        name: channel.name,
        description: channel.description,
        type: channel.type,
        icon: channel.icon,
        order: channel.order,
        isReadOnly: 'isReadOnly' in channel ? channel.isReadOnly : false,
        minRoleGroup: 'minRoleGroup' in channel ? channel.minRoleGroup : null,
      },
    });
  }

  const general = await prisma.chatChannel.findUnique({ where: { slug: 'general' } });
  if (!general) return;

  const existingCount = await prisma.chatMessage.count({ where: { channelId: general.id } });
  if (existingCount > 0) return;

  const authors = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: 'asc' },
    select: { id: true, username: true },
  });

  if (authors.length === 0) return;

  for (let i = 0; i < SAMPLE_MESSAGES.length; i++) {
    const author = authors[i % authors.length];
    const content = SAMPLE_MESSAGES[i];
    await prisma.chatMessage.create({
      data: {
        channelId: general.id,
        authorId: author.id,
        content,
        contentHtml: `<p>${content}</p>`,
        createdAt: new Date(Date.now() - (SAMPLE_MESSAGES.length - i) * 60_000),
      },
    });
  }
}
