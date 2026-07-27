import {
  Award as AwardRow,
  BannerPreset,
  Gender,
  MediaGroup,
  PlayerStatistics as StatsRow,
  Position,
  SocialLink as SocialLinkRow,
  SocialPlatform,
  User,
  UserAward as UserAwardRow,
  UserBadge as UserBadgeRow,
  UserMediaBadge as MediaBadgeRow,
} from '@prisma/client';
import {
  MediaBadge,
  MyProfile,
  PlayerStatistics,
  SocialLink,
  UserAward,
  UserBadge,
  UserProfile,
} from '@twomc/shared';
import { toPublicPosition } from '../positions/position.mapper';

export type ProfileUser = User & {
  position: Position;
  badges: UserBadgeRow[];
  awards: (UserAwardRow & { award: AwardRow })[];
  mediaBadges: MediaBadgeRow[];
  socialLinks: SocialLinkRow[];
  statistics: StatsRow | null;
};

export function resolveBannerUrl(
  user: Pick<User, 'banner' | 'bannerPreset'>,
  presets: Map<string, string>,
): string | null {
  if (user.banner) {
    return user.banner;
  }

  if (user.bannerPreset) {
    return presets.get(user.bannerPreset) ?? null;
  }

  return null;
}

export function toUserBadge(row: UserBadgeRow): UserBadge {
  return {
    id: row.id,
    type: row.type,
    grantedAt: row.grantedAt.toISOString(),
    expiresAt: row.expiresAt?.toISOString() ?? null,
  };
}

export function toUserAward(row: UserAwardRow & { award: AwardRow }): UserAward {
  return {
    id: row.award.id,
    name: row.award.name,
    slug: row.award.slug,
    description: row.award.description,
    iconUrl: row.award.iconUrl,
    color: row.award.color,
    rarity: row.award.rarity,
    isActive: row.award.isActive,
    grantedAt: row.grantedAt.toISOString(),
  };
}

export function toMediaBadge(row: MediaBadgeRow): MediaBadge {
  return {
    mediaGroup: row.mediaGroup as MediaGroup,
    channelUrl: row.channelUrl,
  };
}

export function toSocialLink(row: SocialLinkRow): SocialLink {
  return {
    platform: row.platform as SocialPlatform,
    value: row.value,
  };
}

export function toStatistics(row: StatsRow): PlayerStatistics {
  return {
    coins: row.coins,
    playTime: row.playTime,
    kills: row.kills,
    deaths: row.deaths,
    hits: row.hits,
    killDeathRatio: row.killDeathRatio,
    lastServer: row.lastServer,
  };
}

export function calcAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age;
}

export function toMyProfile(user: ProfileUser, bannerUrl: string | null): MyProfile {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    position: toPublicPosition(user.position),
    minecraftNick: user.minecraftNick,
    avatar: user.avatar,
    banner: user.banner,
    bannerPreset: user.bannerPreset,
    bannerUrl,
    statusText: user.statusText,
    bio: user.bio,
    country: user.country,
    city: user.city,
    gender: user.gender as Gender | null,
    birthDate: user.birthDate?.toISOString() ?? null,
    showBirthDate: user.showBirthDate,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    isProfilePrivate: user.isProfilePrivate,
    hideEmail: user.hideEmail,
    hideCountry: user.hideCountry,
    hideCity: user.hideCity,
    hideBirthDate: user.hideBirthDate,
    hideGender: user.hideGender,
    hideStatistics: user.hideStatistics,
    hideSocials: user.hideSocials,
    hideInventory: user.hideInventory,
    hideServices: user.hideServices,
    hideComments: user.hideComments,
    badges: user.badges.filter((b) => b.isActive).map(toUserBadge),
    awards: user.awards.map(toUserAward),
    mediaBadges: user.mediaBadges.filter((b) => b.isApproved).map(toMediaBadge),
    socials: user.socialLinks.map(toSocialLink),
    statistics: user.statistics ? toStatistics(user.statistics) : null,
  };
}

interface PublicProfileOptions {
  bannerUrl: string | null;
  likesCount: number;
  dislikesCount: number;
  viewsCount: number;
  userReaction: UserProfile['userReaction'];
  isOwner: boolean;
  /** Staff can peek past the private-profile gate; hidden fields still apply */
  canBypassPrivate: boolean;
}

export function toPublicProfile(user: ProfileUser, options: PublicProfileOptions): UserProfile {
  const showPersonal = options.isOwner || options.canBypassPrivate;
  const showAge =
    Boolean(user.birthDate) &&
    user.showBirthDate &&
    (showPersonal || !user.hideBirthDate);

  return {
    id: user.id,
    username: user.username,
    avatar: user.avatar,
    bannerUrl: options.bannerUrl,
    minecraftNick: user.minecraftNick,
    position: toPublicPosition(user.position),
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    statusText: user.statusText,
    bio: user.bio,
    country: showPersonal || !user.hideCountry ? user.country : null,
    city: showPersonal || !user.hideCity ? user.city : null,
    gender: showPersonal || !user.hideGender ? (user.gender as Gender | null) : null,
    age: showAge && user.birthDate ? calcAge(user.birthDate) : null,
    badges: user.badges.filter((b) => b.isActive).map(toUserBadge),
    awards: user.awards.map(toUserAward),
    mediaBadges: user.mediaBadges.filter((b) => b.isApproved).map(toMediaBadge),
    socials:
      showPersonal || !user.hideSocials ? user.socialLinks.map(toSocialLink) : null,
    statistics:
      showPersonal || !user.hideStatistics
        ? user.statistics
          ? toStatistics(user.statistics)
          : null
        : null,
    likesCount: options.likesCount,
    dislikesCount: options.dislikesCount,
    viewsCount: options.viewsCount,
    userReaction: options.userReaction,
    isOwner: options.isOwner,
    hideInventory: user.hideInventory,
    hideServices: user.hideServices,
    hideComments: user.hideComments,
  };
}

export function toBannerPreset(row: BannerPreset) {
  return {
    id: row.id,
    name: row.name,
    imageUrl: row.imageUrl,
    category: row.category,
  };
}

export const profileInclude = {
  position: true,
  badges: { where: { isActive: true }, orderBy: { grantedAt: 'asc' as const } },
  awards: {
    include: { award: true },
    orderBy: { grantedAt: 'desc' as const },
  },
  mediaBadges: { where: { isApproved: true } },
  socialLinks: { orderBy: { platform: 'asc' as const } },
  statistics: true,
} satisfies Record<string, unknown>;
