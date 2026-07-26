import { PrismaClient, RoleGroup } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

interface SeedUser {
  email: string;
  username: string;
  password: string;
  roleGroup: RoleGroup;
}

const staffAndPlayers: SeedUser[] = [
  {
    email: 'admin@localhost',
    username: 'admin',
    password: 'Admin1234',
    roleGroup: RoleGroup.ADMIN,
  },
  {
    email: 'moderator@localhost',
    username: 'moderator',
    password: 'Moder1234',
    roleGroup: RoleGroup.MODERATOR,
  },
  {
    email: 'helper@localhost',
    username: 'helper',
    password: 'Helper1234',
    roleGroup: RoleGroup.HELPER,
  },
  {
    email: 'player1@localhost',
    username: 'player1',
    password: 'Player1234',
    roleGroup: RoleGroup.PLAYER,
  },
  {
    email: 'player2@localhost',
    username: 'player2',
    password: 'Player1234',
    roleGroup: RoleGroup.PLAYER,
  },
];

async function upsertUser({ email, username, password, roleGroup }: SeedUser) {
  const user = await prisma.user.upsert({
    where: { email },
    // пароль повторным сидом не перетираем, только добираем роль
    update: { username, roleGroup },
    create: {
      email,
      username,
      password: await hash(password, BCRYPT_ROUNDS),
      roleGroup,
    },
  });

  console.log(`${user.roleGroup.padEnd(9)} ${user.username} <${user.email}>`);
}

async function main() {
  const email = process.env.SEED_OWNER_EMAIL;
  const username = process.env.SEED_OWNER_USERNAME;
  const password = process.env.SEED_OWNER_PASSWORD;

  if (!email || !username || !password) {
    throw new Error('SEED_OWNER_EMAIL, SEED_OWNER_USERNAME and SEED_OWNER_PASSWORD are required');
  }

  await upsertUser({ email, username, password, roleGroup: RoleGroup.OWNER });

  if (process.env.NODE_ENV === 'production') {
    console.log('production run: test accounts are skipped');

    return;
  }

  for (const user of staffAndPlayers) {
    await upsertUser(user);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
