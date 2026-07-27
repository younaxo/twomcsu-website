import { Prisma, PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

type UserDelegate = PrismaClient['user'];

export type UserLookupClient = {
  user: Pick<UserDelegate, 'findUnique' | 'findFirst'>;
};

/** Build tag like youn#4a2b from username */
export function generateUserTag(username: string): string {
  const base = username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 4) || 'user';
  const suffix = randomBytes(2).toString('hex');
  return `${base}#${suffix}`;
}

/**
 * Resolve a user by username, #shortId, or tag (youn#4a2b).
 */
export async function findUserByIdentifier<T extends Prisma.UserFindUniqueArgs>(
  prisma: UserLookupClient,
  identifier: string,
  args?: Omit<T, 'where'>,
): Promise<Prisma.UserGetPayload<T> | null> {
  const raw = identifier.trim();
  if (!raw) {
    return null;
  }

  const select = args?.select;
  const include = args?.include;

  // #123 or plain digits → shortId
  const shortIdMatch = raw.match(/^#?(\d+)$/);
  if (shortIdMatch) {
    const shortId = Number.parseInt(shortIdMatch[1], 10);
    return prisma.user.findUnique({
      where: { shortId },
      ...(select ? { select } : {}),
      ...(include ? { include } : {}),
    } as never) as Promise<Prisma.UserGetPayload<T> | null>;
  }

  // tag contains # with letters (not only digits after #)
  if (raw.includes('#')) {
    return prisma.user.findUnique({
      where: { tag: raw.toLowerCase() },
      ...(select ? { select } : {}),
      ...(include ? { include } : {}),
    } as never) as Promise<Prisma.UserGetPayload<T> | null>;
  }

  // username (case-insensitive)
  return prisma.user.findFirst({
    where: { username: { equals: raw, mode: 'insensitive' } },
    ...(select ? { select } : {}),
    ...(include ? { include } : {}),
  } as never) as Promise<Prisma.UserGetPayload<T> | null>;
}
