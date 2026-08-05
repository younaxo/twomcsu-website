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

type LookupArgs = {
  select?: Prisma.UserSelect;
  include?: Prisma.UserInclude;
};

/**
 * Resolve a user by username, #shortId, or tag (youn#4a2b).
 * Callers should cast/narrow the result when using custom select/include.
 */
export async function findUserByIdentifier(
  prisma: UserLookupClient,
  identifier: string,
  args?: LookupArgs,
): Promise<any | null> {
  const raw = identifier.trim();
  if (!raw) {
    return null;
  }

  const query = {
    ...(args?.select ? { select: args.select } : {}),
    ...(args?.include ? { include: args.include } : {}),
  };

  // #123 or plain digits → shortId
  const shortIdMatch = raw.match(/^#?(\d+)$/);
  if (shortIdMatch) {
    const shortId = Number.parseInt(shortIdMatch[1], 10);
    return prisma.user.findUnique({ where: { shortId }, ...query });
  }

  // tag contains # with letters (not only digits after #)
  if (raw.includes('#')) {
    return prisma.user.findUnique({ where: { tag: raw.toLowerCase() }, ...query });
  }

  // username (case-insensitive)
  return prisma.user.findFirst({
    where: { username: { equals: raw, mode: 'insensitive' } },
    ...query,
  });
}
