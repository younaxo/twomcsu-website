import { Prisma } from '@prisma/client';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CUID_RE = /^c[a-z0-9]{24}$/i;

export function buildUserSearchWhere(query: string): Prisma.UserWhereInput {
  const raw = query.trim();

  if (raw.startsWith('#')) {
    const digits = raw.slice(1);
    if (/^\d+$/.test(digits)) {
      return { shortId: Number.parseInt(digits, 10) };
    }
  }

  if (raw.includes('#') && !raw.startsWith('#')) {
    return { tag: raw.toLowerCase() };
  }

  if (UUID_RE.test(raw) || CUID_RE.test(raw)) {
    return { id: raw };
  }

  return {
    OR: [
      { username: { contains: raw, mode: 'insensitive' } },
      { email: { contains: raw, mode: 'insensitive' } },
    ],
  };
}

/** Mentions autocomplete: username / shortId / tag only (no email) */
export function buildMentionSearchWhere(query: string): Prisma.UserWhereInput {
  const raw = query.trim();

  if (raw.startsWith('#')) {
    const digits = raw.slice(1);
    if (/^\d+$/.test(digits)) {
      return { shortId: Number.parseInt(digits, 10), isBanned: false };
    }
  }

  if (raw.includes('#') && !raw.startsWith('#')) {
    return { tag: { contains: raw.toLowerCase(), mode: 'insensitive' }, isBanned: false };
  }

  return {
    isBanned: false,
    OR: [
      { username: { contains: raw, mode: 'insensitive' } },
      { tag: { contains: raw, mode: 'insensitive' } },
      ...(/^\d+$/.test(raw)
        ? [{ shortId: Number.parseInt(raw, 10) }]
        : []),
    ],
  };
}
