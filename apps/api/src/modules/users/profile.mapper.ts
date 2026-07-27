import {
  Award as AwardRow,
  BannerPreset,
  Gender,
  MediaGroup,
  PlayerStatistics as StatsRow,
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
import { FullProfileRow } from '../../common/prisma/user-selects';
import { toPublicPosition } from '../positions/position.mapper';

/** Profile page payload — selected fields only, no password */
export type ProfileUser = FullProfileRow;

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
    shortId: user.shortId,
    tag: user.tag,
    email: user.email,
    username: user.username,
    position: toPublicPosition(user.position),
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
    profileVisibility: user.profileVisibility,
    friendRequestPolicy: user.friendRequestPolicy,
    commentPolicy: user.commentPolicy,
    notifyOnComment: user.notifyOnComment,
    notifyOnMention: user.notifyOnMention,
    notifyOnReply: user.notifyOnReply,
    notifyOnFriendRequest: user.notifyOnFriendRequest,
    notifyOnGift: user.notifyOnGift,
    notifyOnOrder: user.notifyOnOrder,
    hideEmail: user.hideEmail,
    hideCountry: user.hideCountry,
    hideCity: user.hideCity,
    hideBirthDate: user.hideBirthDate,
    hideGender: user.hideGender,
    hideStatistics: user.hideStatistics,
    hideSocials: user.hideSocials,
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
  visibility?: UserProfile['visibility'];
}

export function toPublicProfile(user: ProfileUser, options: PublicProfileOptions): UserProfile {
  const showPersonal = options.isOwner || options.canBypassPrivate;
  const showAge =
    Boolean(user.birthDate) &&
    user.showBirthDate &&
    (showPersonal || !user.hideBirthDate);

  return {
    id: user.id,
    shortId: user.shortId,
    tag: user.tag,
    username: user.username,
    avatar: user.avatar,
    bannerUrl: options.bannerUrl,
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
    commentsEnabled: user.commentsEnabled,
    commentsForcedReason: user.commentsEnabled ? null : user.commentsForcedReason,
    commentPolicy: user.commentPolicy,
    ...(options.visibility ? { visibility: options.visibility } : {}),
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

export { selectFullProfile as profileSelect } from '../../common/prisma/user-selects';
