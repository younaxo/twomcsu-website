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
 * Resolve a user by username, #shortId, tag (youn#4a2b), UUID/CUID, or email.
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

  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const CUID_RE = /^c[a-z0-9]{24}$/i;

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

  if (UUID_RE.test(raw) || CUID_RE.test(raw)) {
    return prisma.user.findUnique({ where: { id: raw }, ...query });
  }

  if (raw.includes('@')) {
    return prisma.user.findFirst({
      where: { email: { equals: raw, mode: 'insensitive' } },
      ...query,
    });
  }

  // username (case-insensitive)
  return prisma.user.findFirst({
    where: { username: { equals: raw, mode: 'insensitive' } },
    ...query,
  });
}
