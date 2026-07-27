import { PrismaClient, RoleGroup } from '@prisma/client';
import { hash } from 'bcrypt';
import { seedPositions } from './positions.data';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

interface SeedUser {
  email: string;
  username: string;
  password: string;
  roleGroup: RoleGroup;
  positionSlug: string;
}

const staffAndPlayers: SeedUser[] = [
  {
    email: 'admin@localhost',
    username: 'admin',
    password: 'Admin1234',
    roleGroup: RoleGroup.ADMIN,
    positionSlug: 'special-administrator',
  },
  {
    email: 'moderator@localhost',
    username: 'moderator',
    password: 'Moder1234',
    roleGroup: RoleGroup.MODERATOR,
    positionSlug: 'head-cheat-hunter',
  },
  {
    email: 'helper@localhost',
    username: 'helper',
    password: 'Helper1234',
    roleGroup: RoleGroup.HELPER,
    positionSlug: 'chief-helper',
  },
  {
    email: 'player1@localhost',
    username: 'player1',
    password: 'Player1234',
    roleGroup: RoleGroup.PLAYER,
    positionSlug: 'default',
  },
  {
    email: 'player2@localhost',
    username: 'player2',
    password: 'Player1234',
    roleGroup: RoleGroup.PLAYER,
    positionSlug: 'svarog',
  },
];

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

async function upsertUser(
  { email, username, password, roleGroup, positionSlug }: SeedUser,
  positionIds: Map<string, string>,
) {
  const positionId = positionIds.get(positionSlug);

  if (!positionId) {
    throw new Error(`Unknown position slug: ${positionSlug}`);
  }

  const user = await prisma.user.upsert({
    where: { email },
    // пароль повторным сидом не перетираем, только добираем роль и позицию
    update: { username, roleGroup, positionId },
    create: {
      email,
      username,
      password: await hash(password, BCRYPT_ROUNDS),
      roleGroup,
      positionId,
    },
    include: { position: true },
  });

  console.log(
    `${user.roleGroup.padEnd(9)} ${user.username} <${user.email}> — ${user.position.name}`,
  );
}

async function main() {
  const positionIds = await upsertPositions();

  const email = process.env.SEED_OWNER_EMAIL;
  const username = process.env.SEED_OWNER_USERNAME;
  const password = process.env.SEED_OWNER_PASSWORD;

  if (!email || !username || !password) {
    throw new Error('SEED_OWNER_EMAIL, SEED_OWNER_USERNAME and SEED_OWNER_PASSWORD are required');
  }

  await upsertUser(
    { email, username, password, roleGroup: RoleGroup.OWNER, positionSlug: 'owner' },
    positionIds,
  );

  if (process.env.NODE_ENV === 'production') {
    console.log('production run: test accounts are skipped');

    return;
  }

  for (const user of staffAndPlayers) {
    await upsertUser(user, positionIds);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
