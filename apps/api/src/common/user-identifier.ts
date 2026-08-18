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
 * Resolve a user by username, #shortId, tag (youn#4a2b), UUID/CUID, or email.
 */
export async function findUserByIdentifier<
  T extends Prisma.UserDefaultArgs = Prisma.UserDefaultArgs,
>(
  prisma: UserLookupClient,
  identifier: string,
  args?: Prisma.SelectSubset<T, Prisma.UserDefaultArgs>,
): Promise<Prisma.UserGetPayload<T> | null> {
  const raw = identifier.trim();
  if (!raw) {
    return null;
  }

  const query = {
    ...(args?.select ? { select: args.select } : {}),
    ...(args?.include ? { include: args.include } : {}),
  };
  const findUnique = (where: Prisma.UserWhereUniqueInput) =>
    prisma.user.findUnique({ where, ...query } as Prisma.UserFindUniqueArgs) as Promise<
      Prisma.UserGetPayload<T> | null
    >;
  const findFirst = (where: Prisma.UserWhereInput) =>
    prisma.user.findFirst({ where, ...query } as Prisma.UserFindFirstArgs) as Promise<
      Prisma.UserGetPayload<T> | null
    >;

  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const CUID_RE = /^c[a-z0-9]{24}$/i;

  // #123 or plain digits → shortId
  const shortIdMatch = raw.match(/^#?(\d+)$/);
  if (shortIdMatch) {
    const shortId = Number.parseInt(shortIdMatch[1], 10);
    return findUnique({ shortId });
  }

  // tag contains # with letters (not only digits after #)
  if (raw.includes('#')) {
    return findUnique({ tag: raw.toLowerCase() });
  }

  if (UUID_RE.test(raw) || CUID_RE.test(raw)) {
    return findUnique({ id: raw });
  }

  if (raw.includes('@')) {
    return findFirst({ email: { equals: raw, mode: 'insensitive' } });
  }

  // username (case-insensitive)
  return findFirst({ username: { equals: raw, mode: 'insensitive' } });
}
