import {
  FriendRequestPolicy,
  MediaGroup,
  PrismaClient,
  ProfileVisibility,
  RoleGroup,
  UserBadgeType,
} from '@prisma/client';
import { hash } from 'bcrypt';
import { seedAwards } from './awards.data';
import { seedBannerPresets } from './banner-presets.data';
import { seedPositions } from './positions.data';
import { seedPromoCodes } from './promo-codes.data';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

interface SeedUser {
  email: string;
  username: string;
  password: string;
  roleGroup: RoleGroup;
  positionSlug: string;
  profileVisibility?: ProfileVisibility;
  friendRequestPolicy?: FriendRequestPolicy;
}

interface SeedStatistics {
  coins: number;
  playTime: number;
  kills: number;
  deaths: number;
  hits: number;
  lastServer: string;
}

interface SeedShowcase {
  statistics: SeedStatistics;
  badges: UserBadgeType[];
  awardSlugs: string[];
  mediaBadges?: { mediaGroup: MediaGroup; channelUrl: string }[];
}

const staffAndPlayers: SeedUser[] = [
  {
    email: 'admin@localhost',
    username: 'admin',
    password: 'Admin1234',
    roleGroup: RoleGroup.ADMIN,
    positionSlug: 'special-administrator',
    profileVisibility: ProfileVisibility.EVERYONE,
    friendRequestPolicy: FriendRequestPolicy.EVERYONE,
  },
  {
    email: 'moderator@localhost',
    username: 'moderator',
    password: 'Moder1234',
    roleGroup: RoleGroup.MODERATOR,
    positionSlug: 'head-cheat-hunter',
    profileVisibility: ProfileVisibility.EVERYONE,
    friendRequestPolicy: FriendRequestPolicy.EVERYONE,
  },
  {
    email: 'helper@localhost',
    username: 'helper',
    password: 'Helper1234',
    roleGroup: RoleGroup.HELPER,
    positionSlug: 'chief-helper',
    profileVisibility: ProfileVisibility.EVERYONE,
    friendRequestPolicy: FriendRequestPolicy.EVERYONE,
  },
  {
    email: 'player1@localhost',
    username: 'player1',
    password: 'Player1234',
    roleGroup: RoleGroup.PLAYER,
    positionSlug: 'default',
    profileVisibility: ProfileVisibility.EVERYONE,
    friendRequestPolicy: FriendRequestPolicy.EVERYONE,
  },
  {
    email: 'player2@localhost',
    username: 'player2',
    password: 'Player1234',
    roleGroup: RoleGroup.PLAYER,
    positionSlug: 'svarog',
    profileVisibility: ProfileVisibility.FRIENDS_ONLY,
    friendRequestPolicy: FriendRequestPolicy.FRIENDS_OF_FRIENDS,
  },
];

/** Filled in for the accounts a developer opens first, keyed by username */
const showcases: Record<string, SeedShowcase> = {
  admin: {
    statistics: {
      coins: 100_000,
      playTime: 10_000,
      kills: 500,
      deaths: 200,
      hits: 3_000,
      lastServer: 'Survival #2',
    },
    badges: [UserBadgeType.VERIFIED, UserBadgeType.PROJECT_TEAM],
    awardSlugs: ['verification'],
  },
  player2: {
    statistics: {
      coins: 393_101,
      playTime: 32_450,
      kills: 14_895,
      deaths: 18_147,
      hits: 60_439,
      lastServer: 'Anarchy #1',
    },
    badges: [UserBadgeType.SUBSCRIBER_PLUS],
    awardSlugs: ['plus-subscription'],
    mediaBadges: [{ mediaGroup: MediaGroup.YOUTUBE, channelUrl: 'https://youtube.com/@svarog' }],
  },
};

const ownerShowcase: SeedShowcase = {
  statistics: {
    coins: 1_000_000,
    playTime: 50_000,
    kills: 5_000,
    deaths: 100,
    hits: 20_000,
    lastServer: 'Anarchy #1',
  },
  badges: [UserBadgeType.VERIFIED, UserBadgeType.PROJECT_TEAM, UserBadgeType.DEVELOPERS_TEAM],
  awardSlugs: ['project-support', 'plus-subscription', 'verification'],
};

async function upsertPositions(): Promise<Map<string, string>> {
  const ids = new Map<string, string>();

  for (const { name, slug, group, color, priority, isDefault = false } of seedPositions) {
    const position = await prisma.position.upsert({
      where: { slug },
      update: { name, displayName: name, group, color, priority, isDefault },
      create: { name, slug, displayName: name, group, color, priority, isDefault },
    });

    ids.set(position.slug, position.id);
  }

  console.log(`positions: ${ids.size}`);

  return ids;
}

async function upsertPromoCodes() {
  for (const { code, description, discountType, discountValue, maxUses } of seedPromoCodes) {
    // usedCount повторным сидом не сбрасываем
    await prisma.promoCode.upsert({
      where: { code },
      update: { description, discountType, discountValue, maxUses: maxUses ?? null },
      create: { code, description, discountType, discountValue, maxUses: maxUses ?? null },
    });
  }

  console.log(`promo codes: ${seedPromoCodes.length}`);
}

/** Пресеты не имеют бизнес-ключа, ищем по имени, чтобы повторный сид не плодил дубли */
async function upsertBannerPresets() {
  for (const { name, imageUrl, category } of seedBannerPresets) {
    const existing = await prisma.bannerPreset.findFirst({ where: { name }, select: { id: true } });

    if (existing) {
      await prisma.bannerPreset.update({
        where: { id: existing.id },
        data: { imageUrl, category, isActive: true },
      });

      continue;
    }

    await prisma.bannerPreset.create({ data: { name, imageUrl, category } });
  }

  console.log(`banner presets: ${seedBannerPresets.length}`);
}

async function upsertAwards(): Promise<Map<string, string>> {
  const ids = new Map<string, string>();

  for (const { name, slug, description, iconUrl, color, rarity } of seedAwards) {
    const award = await prisma.award.upsert({
      where: { slug },
      update: { name, description, iconUrl, color, rarity, isActive: true },
      create: { name, slug, description, iconUrl, color, rarity },
    });

    ids.set(award.slug, award.id);
  }

  console.log(`awards: ${ids.size}`);

  return ids;
}

async function upsertUser(
  {
    email,
    username,
    password,
    roleGroup,
    positionSlug,
    profileVisibility = ProfileVisibility.EVERYONE,
    friendRequestPolicy = FriendRequestPolicy.EVERYONE,
  }: SeedUser,
  positionIds: Map<string, string>,
): Promise<string> {
  const positionId = positionIds.get(positionSlug);

  if (!positionId) {
    throw new Error(`Unknown position slug: ${positionSlug}`);
  }

  const user = await prisma.user.upsert({
    where: { email },
    // пароль повторным сидом не перетираем, только добираем роль и позицию
    update: {
      username,
      roleGroup,
      positionId,
      profileVisibility,
      friendRequestPolicy,
    },
    create: {
      email,
      username,
      password: await hash(password, BCRYPT_ROUNDS),
      roleGroup,
      positionId,
      profileVisibility,
      friendRequestPolicy,
    },
    include: { position: true },
  });

  console.log(
    `${user.roleGroup.padEnd(9)} ${user.username} <${user.email}> — ${user.position.name}`,
  );

  return user.id;
}

async function applyShowcase(
  userId: string,
  showcase: SeedShowcase,
  awardIds: Map<string, string>,
) {
  const { coins, playTime, kills, deaths, hits, lastServer } = showcase.statistics;
  const killDeathRatio = deaths === 0 ? kills : Math.round((kills / deaths) * 100) / 100;
  const statistics = { coins, playTime, kills, deaths, hits, lastServer, killDeathRatio };

  await prisma.playerStatistics.upsert({
    where: { userId },
    update: statistics,
    create: { userId, ...statistics },
  });

  for (const type of showcase.badges) {
    await prisma.userBadge.upsert({
      where: { userId_type: { userId, type } },
      update: { isActive: true },
      create: { userId, type },
    });
  }

  for (const slug of showcase.awardSlugs) {
    const awardId = awardIds.get(slug);

    if (!awardId) {
      throw new Error(`Unknown award slug: ${slug}`);
    }

    await prisma.userAward.upsert({
      where: { userId_awardId: { userId, awardId } },
      update: {},
      create: { userId, awardId },
    });
  }

  for (const { mediaGroup, channelUrl } of showcase.mediaBadges ?? []) {
    await prisma.userMediaBadge.upsert({
      where: { userId_mediaGroup: { userId, mediaGroup } },
      update: { channelUrl, isApproved: true, approvedAt: new Date() },
      create: { userId, mediaGroup, channelUrl, isApproved: true, approvedAt: new Date() },
    });
  }
}

async function main() {
  const positionIds = await upsertPositions();

  await upsertPromoCodes();
  await upsertBannerPresets();

  const awardIds = await upsertAwards();

  const email = process.env.SEED_OWNER_EMAIL;
  const username = process.env.SEED_OWNER_USERNAME;
  const password = process.env.SEED_OWNER_PASSWORD;

  if (!email || !username || !password) {
    throw new Error('SEED_OWNER_EMAIL, SEED_OWNER_USERNAME and SEED_OWNER_PASSWORD are required');
  }

  const ownerId = await upsertUser(
    { email, username, password, roleGroup: RoleGroup.OWNER, positionSlug: 'owner' },
    positionIds,
  );

  await applyShowcase(ownerId, ownerShowcase, awardIds);

  if (process.env.NODE_ENV === 'production') {
    console.log('production run: test accounts are skipped');

    return;
  }

  const userIds = new Map<string, string>([[username, ownerId]]);

  for (const user of staffAndPlayers) {
    const userId = await upsertUser(user, positionIds);
    userIds.set(user.username, userId);
    const showcase = showcases[user.username];

    if (showcase) {
      await applyShowcase(userId, showcase, awardIds);
    }
  }

  await seedProfileComments(userIds);
}

/** Idempotent demo comments for local profiles */
async function seedProfileComments(userIds: Map<string, string>) {
  const ownerId = userIds.get('owner');
  const adminId = userIds.get('admin');
  const moderatorId = userIds.get('moderator');
  const player1Id = userIds.get('player1');
  const player2Id = userIds.get('player2');
  const helperId = userIds.get('helper');

  if (!ownerId || !adminId || !moderatorId || !player1Id || !player2Id || !helperId) {
    console.log('comments: skipped (missing seed users)');
    return;
  }

  const existing = await prisma.profileComment.count({
    where: { profileId: { in: [ownerId, player2Id] }, parentId: null },
  });

  if (existing > 0) {
    console.log(`comments: skipped (${existing} already present)`);
    return;
  }

  const ownerPinned = await prisma.profileComment.create({
    data: {
      profileId: ownerId,
      authorId: adminId,
      content: 'Добро пожаловать на сервер! Читайте правила и удачной игры.',
      contentHtml: '<p>Добро пожаловать на сервер! Читайте правила и удачной игры.</p>',
      isPinned: true,
      pinnedAt: new Date(),
      pinnedBy: ownerId,
      mentions: [],
    },
  });

  await prisma.profileComment.create({
    data: {
      profileId: ownerId,
      authorId: player1Id,
      content: 'Спасибо за проект! **Очень** крутой сервер.',
      contentHtml: '<p>Спасибо за проект! <strong>Очень</strong> крутой сервер.</p>',
      mentions: [],
    },
  });

  const ownerThread = await prisma.profileComment.create({
    data: {
      profileId: ownerId,
      authorId: helperId,
      content: 'Если нужна помощь — пишите @moderator или в тикеты.',
      contentHtml:
        '<p>Если нужна помощь — пишите <span class="mention">@moderator</span> или в тикеты.</p>',
      mentions: [moderatorId],
    },
  });

  await prisma.profileComment.create({
    data: {
      profileId: ownerId,
      authorId: moderatorId,
      parentId: ownerThread.id,
      content: 'Да, всегда на связи. ||секретный ответ||',
      contentHtml: '<p>Да, всегда на связи. <span class="spoiler">секретный ответ</span></p>',
      mentions: [],
    },
  });

  await prisma.profileComment.create({
    data: {
      profileId: ownerId,
      authorId: player2Id,
      content: 'Залетел с Anarchy — огонь 🔥',
      contentHtml: '<p>Залетел с Anarchy — огонь 🔥</p>',
      mentions: [],
    },
  });

  await prisma.commentReaction.createMany({
    data: [
      { commentId: ownerPinned.id, userId: player1Id, emoji: 'thumbs_up' },
      { commentId: ownerPinned.id, userId: helperId, emoji: 'heart' },
      { commentId: ownerPinned.id, userId: player2Id, emoji: 'fire' },
      { commentId: ownerThread.id, userId: ownerId, emoji: 'thumbs_up' },
    ],
  });

  await prisma.profileComment.createMany({
    data: [
      {
        profileId: player2Id,
        authorId: player1Id,
        content: 'Крутой скин и статистика!',
        contentHtml: '<p>Крутой скин и статистика!</p>',
        mentions: [],
      },
      {
        profileId: player2Id,
        authorId: adminId,
        content: 'Хороший контент на YouTube.',
        contentHtml: '<p>Хороший контент на YouTube.</p>',
        mentions: [],
      },
      {
        profileId: player2Id,
        authorId: ownerId,
        content: 'Держи *лайк* за активность.',
        contentHtml: '<p>Держи <em>лайк</em> за активность.</p>',
        mentions: [],
      },
    ],
  });

  console.log('comments: seeded owner + player2 profiles');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
