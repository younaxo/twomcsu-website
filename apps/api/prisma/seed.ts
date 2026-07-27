import {
  FriendRequestPolicy,
  MediaGroup,
  PrismaClient,
  ProductDuration,
  ProfileVisibility,
  RoleGroup,
  UserBadgeType,
} from '@prisma/client';
import { hash } from 'bcrypt';
import { randomBytes } from 'crypto';
import { seedAwards } from './awards.data';
import { seedBannerPresets } from './banner-presets.data';
import { seedCurrencyRates } from './currency-rates.data';
import { seedPositions } from './positions.data';
import { seedPromoCodes } from './promo-codes.data';
import { seedBundles } from './store-bundles.data';
import { seedCategories } from './store-categories.data';
import { seedBulkDiscounts, seedLoyaltyDiscounts } from './store-discounts.data';
import { seedProducts } from './store-products.data';

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
  shortId?: number;
}

function makeTag(username: string): string {
  const base = username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 4) || 'user';
  return `${base}#${randomBytes(2).toString('hex')}`;
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
  for (const promo of seedPromoCodes) {
    const {
      code,
      description,
      discountType,
      discountValue,
      maxUses,
      applicableToTypes,
      minOrderAmount,
      firstPurchaseOnly,
    } = promo;

    // usedCount повторным сидом не сбрасываем
    await prisma.promoCode.upsert({
      where: { code },
      update: {
        description,
        discountType,
        discountValue,
        maxUses: maxUses ?? null,
        applicableToTypes: applicableToTypes ?? [],
        minOrderAmount: minOrderAmount ?? null,
        firstPurchaseOnly: firstPurchaseOnly ?? false,
      },
      create: {
        code,
        description,
        discountType,
        discountValue,
        maxUses: maxUses ?? null,
        applicableToTypes: applicableToTypes ?? [],
        minOrderAmount: minOrderAmount ?? null,
        firstPurchaseOnly: firstPurchaseOnly ?? false,
      },
    });
  }

  console.log(`promo codes: ${seedPromoCodes.length}`);
}

async function upsertStoreCategories(): Promise<Map<string, string>> {
  const ids = new Map<string, string>();

  for (const category of seedCategories.filter((c) => !c.parentSlug)) {
    const row = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        icon: category.icon,
        order: category.order,
        isActive: true,
      },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
        order: category.order,
      },
    });
    ids.set(row.slug, row.id);
  }

  for (const category of seedCategories.filter((c) => c.parentSlug)) {
    const parentId = ids.get(category.parentSlug!);
    if (!parentId) {
      throw new Error(`Unknown parent category: ${category.parentSlug}`);
    }

    const row = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        icon: category.icon,
        order: category.order,
        parentId,
        isActive: true,
      },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
        order: category.order,
        parentId,
      },
    });
    ids.set(row.slug, row.id);
  }

  console.log(`categories: ${ids.size}`);
  return ids;
}

async function upsertStoreProducts(
  categoryIds: Map<string, string>,
  positionIds: Map<string, string>,
): Promise<Map<string, { productId: string; variants: Map<string, string> }>> {
  const result = new Map<string, { productId: string; variants: Map<string, string> }>();

  for (const product of seedProducts) {
    const categoryId = categoryIds.get(product.categorySlug);
    if (!categoryId) {
      throw new Error(`Unknown category: ${product.categorySlug}`);
    }

    const positionId = product.positionSlug ? positionIds.get(product.positionSlug) : undefined;
    if (product.positionSlug && !positionId) {
      throw new Error(`Unknown position: ${product.positionSlug}`);
    }

    const row = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        description: product.description,
        fullDescription: product.fullDescription,
        type: product.type,
        categoryId,
        positionId: positionId ?? null,
        isGiftable: product.isGiftable ?? true,
        isSelfOnly: product.isSelfOnly ?? false,
        isUnique: product.isUnique ?? false,
        isSeasonalOnly: product.isSeasonalOnly ?? false,
        maxPerPurchase: product.maxPerPurchase ?? null,
        currencyType: product.currencyType ?? null,
        currencyAmount: product.currencyAmount ?? null,
        isFeatured: product.isFeatured ?? false,
        isNew: product.isNew ?? false,
        isPopular: product.isPopular ?? false,
        order: product.order ?? 0,
        isActive: true,
      },
      create: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        fullDescription: product.fullDescription,
        type: product.type,
        categoryId,
        positionId: positionId ?? null,
        isGiftable: product.isGiftable ?? true,
        isSelfOnly: product.isSelfOnly ?? false,
        isUnique: product.isUnique ?? false,
        isSeasonalOnly: product.isSeasonalOnly ?? false,
        maxPerPurchase: product.maxPerPurchase ?? null,
        currencyType: product.currencyType ?? null,
        currencyAmount: product.currencyAmount ?? null,
        isFeatured: product.isFeatured ?? false,
        isNew: product.isNew ?? false,
        isPopular: product.isPopular ?? false,
        order: product.order ?? 0,
      },
    });

    const variants = new Map<string, string>();

    for (const variant of product.variants) {
      const v = await prisma.productVariant.upsert({
        where: {
          productId_duration: { productId: row.id, duration: variant.duration },
        },
        update: {
          price: variant.price,
          oldPrice: variant.oldPrice ?? null,
          order: variant.order ?? 0,
          isActive: true,
        },
        create: {
          productId: row.id,
          duration: variant.duration,
          price: variant.price,
          oldPrice: variant.oldPrice ?? null,
          order: variant.order ?? 0,
        },
      });
      variants.set(variant.duration, v.id);
    }

    result.set(product.slug, { productId: row.id, variants });
  }

  console.log(`products: ${result.size}`);
  return result;
}

async function upsertStoreBundles(
  products: Map<string, { productId: string; variants: Map<string, string> }>,
) {
  for (const bundle of seedBundles) {
    const row = await prisma.bundle.upsert({
      where: { slug: bundle.slug },
      update: {
        name: bundle.name,
        description: bundle.description,
        totalPrice: bundle.totalPrice,
        originalPrice: bundle.originalPrice,
        isFeatured: bundle.isFeatured ?? false,
        isActive: true,
      },
      create: {
        name: bundle.name,
        slug: bundle.slug,
        description: bundle.description,
        totalPrice: bundle.totalPrice,
        originalPrice: bundle.originalPrice,
        isFeatured: bundle.isFeatured ?? false,
      },
    });

    await prisma.bundleItem.deleteMany({ where: { bundleId: row.id } });

    for (const item of bundle.items) {
      const product = products.get(item.productSlug);
      if (!product) {
        throw new Error(`Unknown bundle product: ${item.productSlug}`);
      }

      const duration = (item.variantDuration ?? 'ONE_TIME') as ProductDuration;
      const variantId = product.variants.get(duration) ?? null;

      await prisma.bundleItem.create({
        data: {
          bundleId: row.id,
          productId: product.productId,
          variantId,
          quantity: item.quantity,
        },
      });
    }
  }

  console.log(`bundles: ${seedBundles.length}`);
}

async function upsertStoreDiscounts() {
  const existingBulk = await prisma.bulkDiscount.count();
  if (existingBulk === 0) {
    await prisma.bulkDiscount.createMany({
      data: seedBulkDiscounts.map((d) => ({
        productType: d.productType,
        minQuantity: d.minQuantity ?? 0,
        minAmount: d.minAmount ?? null,
        discountType: d.discountType,
        discountValue: d.discountValue,
      })),
    });
  }

  for (const loyalty of seedLoyaltyDiscounts) {
    const existing = await prisma.loyaltyDiscount.findFirst({
      where: { minPurchases: loyalty.minPurchases },
    });

    if (existing) {
      await prisma.loyaltyDiscount.update({
        where: { id: existing.id },
        data: {
          discountPercent: loyalty.discountPercent,
          name: loyalty.name,
          description: loyalty.description,
          isActive: true,
        },
      });
    } else {
      await prisma.loyaltyDiscount.create({
        data: {
          minPurchases: loyalty.minPurchases,
          discountPercent: loyalty.discountPercent,
          name: loyalty.name,
          description: loyalty.description,
        },
      });
    }
  }

  console.log(
    `discounts: bulk=${seedBulkDiscounts.length}, loyalty=${seedLoyaltyDiscounts.length}`,
  );
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
    shortId,
  }: SeedUser,
  positionIds: Map<string, string>,
): Promise<string> {
  const positionId = positionIds.get(positionSlug);

  if (!positionId) {
    throw new Error(`Unknown position slug: ${positionSlug}`);
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  const user = await prisma.user.upsert({
    where: { email },
    // пароль повторным сидом не перетираем, только добираем роль и позицию
    update: {
      username,
      roleGroup,
      positionId,
      profileVisibility,
      friendRequestPolicy,
      ...(existing?.tag ? {} : { tag: makeTag(username) }),
    },
    create: {
      email,
      username,
      password: await hash(password, BCRYPT_ROUNDS),
      roleGroup,
      positionId,
      profileVisibility,
      friendRequestPolicy,
      tag: makeTag(username),
      ...(shortId != null ? { shortId } : {}),
    },
    include: { position: true },
  });

  if (shortId != null && user.shortId !== shortId) {
    // Free the target shortId if another row holds it
    await prisma.$executeRaw`
      UPDATE users SET "shortId" = (SELECT COALESCE(MAX("shortId"), 2) + 1 FROM users)
      WHERE "shortId" = ${shortId} AND id <> ${user.id}
    `;
    await prisma.user.update({ where: { id: user.id }, data: { shortId } });
    await prisma.$executeRaw`SELECT setval('"users_shortId_seq"', (SELECT MAX("shortId") FROM users))`;
  }

  console.log(
    `${user.roleGroup.padEnd(9)} ${user.username} <${user.email}> — ${user.position.name}`,
  );

  return user.id;
}

/** Prefer existing username (e.g. SEED_OWNER), then create with reserved email */
async function ensureReservedShortId(
  user: SeedUser & { shortId: number },
  positionIds: Map<string, string>,
): Promise<void> {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ username: { equals: user.username, mode: 'insensitive' } }, { email: user.email }],
    },
  });

  if (existing) {
    if (existing.shortId !== user.shortId) {
      await prisma.$executeRaw`
        UPDATE users SET "shortId" = (SELECT COALESCE(MAX("shortId"), 2) + 1 FROM users)
        WHERE "shortId" = ${user.shortId} AND id <> ${existing.id}
      `;
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          shortId: user.shortId,
          roleGroup: user.roleGroup,
          ...(existing.tag ? {} : { tag: makeTag(existing.username) }),
        },
      });
      await prisma.$executeRaw`SELECT setval('"users_shortId_seq"', (SELECT MAX("shortId") FROM users))`;
    }
    console.log(`reserved #${user.shortId} → ${existing.username}`);
    return;
  }

  await upsertUser(user, positionIds);
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

async function upsertCurrencyRates() {
  for (const rate of seedCurrencyRates) {
    await prisma.currencyRate.upsert({
      where: { currency: rate.currency },
      update: {
        rate: rate.rate,
        symbol: rate.symbol,
        flag: rate.flag,
        isActive: true,
      },
      create: {
        currency: rate.currency,
        rate: rate.rate,
        symbol: rate.symbol,
        flag: rate.flag,
      },
    });
  }

  console.log(`currency rates: ${seedCurrencyRates.length}`);
}

async function main() {
  const positionIds = await upsertPositions();

  await upsertPromoCodes();
  await upsertBannerPresets();

  const categoryIds = await upsertStoreCategories();
  const storeProducts = await upsertStoreProducts(categoryIds, positionIds);
  await upsertStoreBundles(storeProducts);
  await upsertStoreDiscounts();
  await upsertCurrencyRates();

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

  // Reserved public ids: KleekYT=#1, younaxo_=#2 (create or reassign)
  await ensureReservedShortId({
    email: 'kleekyt@localhost',
    username: 'KleekYT',
    password: 'Owner1234',
    roleGroup: RoleGroup.OWNER,
    positionSlug: 'owner',
    shortId: 1,
    profileVisibility: ProfileVisibility.EVERYONE,
  }, positionIds);
  await ensureReservedShortId({
    email: 'younaxo@localhost',
    username: 'younaxo_',
    password: 'Owner1234',
    roleGroup: RoleGroup.OWNER,
    positionSlug: 'chief-developer',
    shortId: 2,
    profileVisibility: ProfileVisibility.EVERYONE,
  }, positionIds);

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

  const before = await prisma.profileComment.count();

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

  const after = await prisma.profileComment.count();
  const created = after - before;
  if (created < 8) {
    throw new Error(`comments seed incomplete: expected >= 8 new rows, got ${created}`);
  }
  console.log(`comments: verified ${created} rows created (total ${after})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
