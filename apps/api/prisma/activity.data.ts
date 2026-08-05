import {
  ActivityType,
  ActivityVisibility,
  Prisma,
  PrismaClient,
} from '@prisma/client';

type SeedActivity = {
  username: string;
  type: ActivityType;
  title: string;
  description?: string;
  imageUrl?: string;
  actionUrl?: string;
  visibility?: ActivityVisibility;
  isPinned?: boolean;
  hoursAgo: number;
  metadata?: Prisma.InputJsonValue;
  reactions?: Array<{ username: string; emoji: string }>;
  comments?: Array<{ username: string; content: string }>;
};

export const seedActivities: SeedActivity[] = [
  {
    username: 'player1',
    type: ActivityType.PURCHASE_MADE,
    title: 'купил ранг Svarog',
    description: 'Добро пожаловать в семью донатеров!',
    actionUrl: '/store',
    hoursAgo: 2,
    metadata: { productName: 'Svarog', total: 499 },
    reactions: [
      { username: 'player2', emoji: 'fire' },
      { username: 'admin', emoji: 'party' },
    ],
    comments: [{ username: 'player2', content: 'Красава! Поздравляю.' }],
  },
  {
    username: 'player2',
    type: ActivityType.ACHIEVEMENT_UNLOCKED,
    title: 'получил достижение «Первый шаг»',
    hoursAgo: 5,
    metadata: { rarity: 'COMMON' },
    reactions: [{ username: 'player1', emoji: 'thumbs_up' }],
  },
  {
    username: 'admin',
    type: ActivityType.BADGE_GRANTED,
    title: 'получил бейдж «Staff»',
    hoursAgo: 8,
    visibility: ActivityVisibility.PUBLIC,
  },
  {
    username: 'helper',
    type: ActivityType.AWARD_GRANTED,
    title: 'получил награду «Помощник месяца»',
    hoursAgo: 12,
    reactions: [
      { username: 'moderator', emoji: 'star' },
      { username: 'admin', emoji: 'heart' },
    ],
  },
  {
    username: 'player1',
    type: ActivityType.GIFT_SENT,
    title: 'подарил ключ игроку @player2',
    hoursAgo: 18,
    visibility: ActivityVisibility.FRIENDS,
    metadata: { recipientUsername: 'player2' },
    reactions: [{ username: 'player2', emoji: 'gift' }],
  },
  {
    username: 'player2',
    type: ActivityType.GIFT_RECEIVED,
    title: 'получил ключ от @player1',
    hoursAgo: 18,
    visibility: ActivityVisibility.FRIENDS,
    metadata: { senderUsername: 'player1' },
  },
  {
    username: 'player1',
    type: ActivityType.FRIENDSHIP_STARTED,
    title: 'подружился с @player2',
    hoursAgo: 24,
    visibility: ActivityVisibility.FRIENDS,
    metadata: { friendUsername: 'player2' },
  },
  {
    username: 'moderator',
    type: ActivityType.PROFILE_UPDATED,
    title: 'обновил аватар',
    hoursAgo: 30,
    visibility: ActivityVisibility.FRIENDS,
  },
  {
    username: 'admin',
    type: ActivityType.NEWS_POSTED,
    title: 'опубликовал новость',
    description: 'Читайте свежие обновления проекта',
    actionUrl: '/news',
    hoursAgo: 36,
    isPinned: true,
    reactions: [
      { username: 'player1', emoji: 'fire' },
      { username: 'player2', emoji: 'thumbs_up' },
      { username: 'helper', emoji: 'party' },
    ],
    comments: [
      { username: 'player1', content: 'Отличная новость!' },
      { username: 'helper', content: 'Уже читаю.' },
    ],
  },
  {
    username: 'admin',
    type: ActivityType.EVENT_ANNOUNCED,
    title: 'анонсировал ивент «Двойной опыт»',
    description: 'Весь уикенд x2 опыт на всех серверах',
    actionUrl: '/news',
    hoursAgo: 48,
    isPinned: true,
  },
  {
    username: 'player1',
    type: ActivityType.MILESTONE_REACHED,
    title: 'провёл 100 часов на сервере',
    hoursAgo: 60,
    metadata: { milestone: '100_hours' },
    reactions: [{ username: 'admin', emoji: 'star' }],
  },
  {
    username: 'helper',
    type: ActivityType.RANK_ACHIEVED,
    title: 'получил ранг Helper',
    hoursAgo: 72,
  },
  {
    username: 'player2',
    type: ActivityType.TOP_ACHIEVED,
    title: 'попал в топ-10 по времени игры',
    hoursAgo: 96,
    metadata: { category: 'playtime', place: 7 },
  },
  {
    username: 'admin',
    type: ActivityType.CUSTOM,
    title: 'Объявление: технические работы в пятницу',
    description: 'Серверы будут недоступны с 03:00 до 05:00 МСК',
    hoursAgo: 120,
    isPinned: true,
  },
  {
    username: 'moderator',
    type: ActivityType.DONATOR_UPGRADED,
    title: 'повысил уровень доната',
    hoursAgo: 144,
    visibility: ActivityVisibility.FRIENDS,
  },
];

export async function seedActivityFeed(
  prisma: PrismaClient,
  userIds: Map<string, string>,
): Promise<void> {
  const usernames = [...userIds.keys()];
  let activitiesCreated = 0;
  let settingsCreated = 0;

  for (const username of usernames) {
    const userId = userIds.get(username);
    if (!userId) continue;

    const existing = await prisma.activityFeedSettings.findUnique({
      where: { userId },
    });

    if (!existing) {
      await prisma.activityFeedSettings.create({
        data: { userId },
      });
      settingsCreated += 1;
    }
  }

  const existingCount = await prisma.activity.count();
  if (existingCount > 0) {
    console.log(
      `activity: skipped seed (${existingCount} already exist), settings +${settingsCreated}`,
    );
    return;
  }

  for (const item of seedActivities) {
    const userId = userIds.get(item.username);
    if (!userId) continue;

    const createdAt = new Date(Date.now() - item.hoursAgo * 60 * 60 * 1000);

    const activity = await prisma.activity.create({
      data: {
        userId,
        type: item.type,
        title: item.title,
        description: item.description ?? null,
        imageUrl: item.imageUrl ?? null,
        actionUrl: item.actionUrl ?? null,
        visibility: item.visibility ?? ActivityVisibility.PUBLIC,
        isPinned: item.isPinned ?? false,
        metadata: item.metadata ?? undefined,
        createdAt,
        updatedAt: createdAt,
      },
    });

    activitiesCreated += 1;

    for (const reaction of item.reactions ?? []) {
      const reactorId = userIds.get(reaction.username);
      if (!reactorId) continue;

      await prisma.activityReaction.create({
        data: {
          activityId: activity.id,
          userId: reactorId,
          emoji: reaction.emoji,
          createdAt,
        },
      });
    }

    for (const comment of item.comments ?? []) {
      const authorId = userIds.get(comment.username);
      if (!authorId) continue;

      await prisma.activityComment.create({
        data: {
          activityId: activity.id,
          authorId,
          content: comment.content,
          createdAt,
          updatedAt: createdAt,
        },
      });
    }
  }

  console.log(
    `activity: ${activitiesCreated} activities, settings +${settingsCreated}`,
  );
}
