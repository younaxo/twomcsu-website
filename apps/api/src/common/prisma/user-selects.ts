import { Prisma } from '@prisma/client';

/** Position fields needed to render ColoredUsername / PositionBadge */
export const selectPublicPosition = {
  id: true,
  name: true,
  slug: true,
  displayName: true,
  group: true,
  color: true,
  backgroundColor: true,
  icon: true,
  priority: true,
} satisfies Prisma.PositionSelect;

/** Compact user card for lists (friends, search, assign dialog) */
export const selectMinimalUser = {
  id: true,
  username: true,
  avatar: true,
  minecraftNick: true,
  roleGroup: true,
  position: { select: selectPublicPosition },
  badges: {
    where: { isActive: true },
    orderBy: { grantedAt: 'asc' as const },
    select: {
      id: true,
      type: true,
      grantedAt: true,
      expiresAt: true,
      isActive: true,
      userId: true,
      grantedBy: true,
    },
  },
} satisfies Prisma.UserSelect;

/** Auth /me and session payloads — never includes password */
export const selectAuthUser = {
  id: true,
  shortId: true,
  tag: true,
  email: true,
  username: true,
  roleGroup: true,
  minecraftNick: true,
  avatar: true,
  isVerified: true,
  isBanned: true,
  createdAt: true,
  position: { select: selectPublicPosition },
} satisfies Prisma.UserSelect;

/** Full public / private profile page in one query */
export const selectFullProfile = {
  id: true,
  shortId: true,
  tag: true,
  email: true,
  username: true,
  roleGroup: true,
  minecraftNick: true,
  avatar: true,
  isVerified: true,
  isBanned: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
  banner: true,
  bannerPreset: true,
  statusText: true,
  bio: true,
  country: true,
  city: true,
  gender: true,
  birthDate: true,
  showBirthDate: true,
  profileVisibility: true,
  friendRequestPolicy: true,
  hideEmail: true,
  hideCountry: true,
  hideCity: true,
  hideBirthDate: true,
  hideGender: true,
  hideStatistics: true,
  hideSocials: true,
  commentPolicy: true,
  commentsEnabled: true,
  commentsForcedReason: true,
  notifyOnComment: true,
  notifyOnMention: true,
  notifyOnReply: true,
  notifyOnFriendRequest: true,
  notifyOnGift: true,
  notifyOnOrder: true,
  positionId: true,
  position: { select: selectPublicPosition },
  badges: {
    where: { isActive: true },
    orderBy: { grantedAt: 'asc' as const },
  },
  awards: {
    include: { award: true },
    orderBy: { grantedAt: 'desc' as const },
  },
  mediaBadges: { where: { isApproved: true } },
  socialLinks: { orderBy: { platform: 'asc' as const } },
  statistics: true,
} satisfies Prisma.UserSelect;

export type MinimalUserRow = Prisma.UserGetPayload<{ select: typeof selectMinimalUser }>;
export type AuthUserRow = Prisma.UserGetPayload<{ select: typeof selectAuthUser }>;
export type FullProfileRow = Prisma.UserGetPayload<{ select: typeof selectFullProfile }>;
