import { PrismaClient, RoleGroup } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_OWNER_EMAIL;
  const username = process.env.SEED_OWNER_USERNAME;
  const password = process.env.SEED_OWNER_PASSWORD;

  if (!email || !username || !password) {
    throw new Error('SEED_OWNER_EMAIL, SEED_OWNER_USERNAME and SEED_OWNER_PASSWORD are required');
  }

  const owner = await prisma.user.upsert({
    where: { email },
    // пароль повторным сидом не перетираем, только добираем роль
    update: { username, roleGroup: RoleGroup.OWNER },
    create: {
      email,
      username,
      password: await hash(password, 12),
      roleGroup: RoleGroup.OWNER,
    },
  });

  console.log(`owner ready: ${owner.username} <${owner.email}>`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
