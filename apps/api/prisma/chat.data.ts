import { ChatChannelType, PrismaClient } from '@prisma/client';

const GENERAL_CHANNEL = {
  slug: 'general',
  name: 'Общий',
  description: 'Общение на любые темы',
  type: ChatChannelType.GENERAL,
  icon: '💬',
  order: 1,
} as const;

const LEGACY_CHANNEL_SLUGS = ['trade', 'help', 'announcements', 'game', 'flood'] as const;

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
  await prisma.chatChannel.upsert({
    where: { slug: GENERAL_CHANNEL.slug },
    update: {
      name: GENERAL_CHANNEL.name,
      description: GENERAL_CHANNEL.description,
      type: GENERAL_CHANNEL.type,
      icon: GENERAL_CHANNEL.icon,
      order: GENERAL_CHANNEL.order,
      isReadOnly: false,
      minRoleGroup: null,
      slowMode: null,
      isActive: true,
    },
    create: {
      slug: GENERAL_CHANNEL.slug,
      name: GENERAL_CHANNEL.name,
      description: GENERAL_CHANNEL.description,
      type: GENERAL_CHANNEL.type,
      icon: GENERAL_CHANNEL.icon,
      order: GENERAL_CHANNEL.order,
      isReadOnly: false,
      minRoleGroup: null,
    },
  });

  // Keep legacy rows for history, but hide them from the UI
  await prisma.chatChannel.updateMany({
    where: { slug: { in: [...LEGACY_CHANNEL_SLUGS] } },
    data: { isActive: false },
  });

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
