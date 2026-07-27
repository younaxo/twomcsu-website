import type { Position } from './position';

export const Gender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
  PREFER_NOT_TO_SAY: 'PREFER_NOT_TO_SAY',
} as const;

export type Gender = (typeof Gender)[keyof typeof Gender];

export const SocialPlatform = {
  DISCORD: 'DISCORD',
  TELEGRAM: 'TELEGRAM',
  VK: 'VK',
  YOUTUBE: 'YOUTUBE',
  TWITCH: 'TWITCH',
  TIKTOK: 'TIKTOK',
  STEAM: 'STEAM',
} as const;

export type SocialPlatform = (typeof SocialPlatform)[keyof typeof SocialPlatform];

export const socialPlatformOrder: SocialPlatform[] = [
  SocialPlatform.DISCORD,
  SocialPlatform.TELEGRAM,
  SocialPlatform.VK,
  SocialPlatform.YOUTUBE,
  SocialPlatform.TWITCH,
  SocialPlatform.TIKTOK,
  SocialPlatform.STEAM,
];

export const MediaGroup = {
  YOUTUBE: 'YOUTUBE',
  TWITCH: 'TWITCH',
  TIKTOK: 'TIKTOK',
} as const;

export type MediaGroup = (typeof MediaGroup)[keyof typeof MediaGroup];

export const mediaGroupOrder: MediaGroup[] = [
  MediaGroup.YOUTUBE,
  MediaGroup.TWITCH,
  MediaGroup.TIKTOK,
];

export const UserBadgeType = {
  VERIFIED: 'VERIFIED',
  SUBSCRIBER_PLUS: 'SUBSCRIBER_PLUS',
  PROJECT_TEAM: 'PROJECT_TEAM',
  DEVELOPERS_TEAM: 'DEVELOPERS_TEAM',
} as const;

export type UserBadgeType = (typeof UserBadgeType)[keyof typeof UserBadgeType];

export const userBadgeTypeOrder: UserBadgeType[] = [
  UserBadgeType.VERIFIED,
  UserBadgeType.SUBSCRIBER_PLUS,
  UserBadgeType.PROJECT_TEAM,
  UserBadgeType.DEVELOPERS_TEAM,
];

export const MediaBadgeRequestStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type MediaBadgeRequestStatus =
  (typeof MediaBadgeRequestStatus)[keyof typeof MediaBadgeRequestStatus];

export const ProfileReportReason = {
  SPAM: 'SPAM',
  INAPPROPRIATE_CONTENT: 'INAPPROPRIATE_CONTENT',
  HARASSMENT: 'HARASSMENT',
  IMPERSONATION: 'IMPERSONATION',
  OTHER: 'OTHER',
} as const;

export type ProfileReportReason = (typeof ProfileReportReason)[keyof typeof ProfileReportReason];

export const ProfileReportStatus = {
  PENDING: 'PENDING',
  RESOLVED: 'RESOLVED',
  REJECTED: 'REJECTED',
} as const;

export type ProfileReportStatus = (typeof ProfileReportStatus)[keyof typeof ProfileReportStatus];

export const ReactionType = {
  LIKE: 'LIKE',
  DISLIKE: 'DISLIKE',
} as const;

export type ReactionType = (typeof ReactionType)[keyof typeof ReactionType];

export const ProfileVisibility = {
  EVERYONE: 'EVERYONE',
  FRIENDS_ONLY: 'FRIENDS_ONLY',
  NOBODY: 'NOBODY',
} as const;

export type ProfileVisibility = (typeof ProfileVisibility)[keyof typeof ProfileVisibility];

export const FriendRequestPolicy = {
  EVERYONE: 'EVERYONE',
  FRIENDS_OF_FRIENDS: 'FRIENDS_OF_FRIENDS',
  NOBODY: 'NOBODY',
} as const;

export type FriendRequestPolicy =
  (typeof FriendRequestPolicy)[keyof typeof FriendRequestPolicy];

export interface UserBadge {
  id: string;
  type: UserBadgeType;
  grantedAt: string;
  expiresAt: string | null;
}

export interface SocialLink {
  platform: SocialPlatform;
  value: string;
}

export interface MediaBadge {
  mediaGroup: MediaGroup;
  channelUrl: string;
}

export interface Award {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string;
  color: string | null;
  rarity: string | null;
  isActive: boolean;
}

export interface UserAward extends Award {
  grantedAt: string;
}

export interface PlayerStatistics {
  coins: number;
  /** Minutes spent in game */
  playTime: number;
  kills: number;
  deaths: number;
  hits: number;
  killDeathRatio: number;
  lastServer: string | null;
}

export interface BannerPreset {
  id: string;
  name: string;
  imageUrl: string;
  category: string | null;
}

export interface MediaBadgeRequest {
  id: string;
  mediaGroup: MediaGroup;
  channelUrl: string;
  description: string | null;
  status: MediaBadgeRequestStatus;
  reviewNote: string | null;
  createdAt: string;
}

/** Same request seen from the admin panel */
export interface MediaBadgeRequestAdmin extends MediaBadgeRequest {
  user: { id: string; username: string; avatar: string | null; position: Position };
}

export interface ProfileReport {
  id: string;
  reason: ProfileReportReason;
  description: string | null;
  status: ProfileReportStatus;
  reviewNote: string | null;
  createdAt: string;
  profile: { id: string; username: string; position: Position };
  reporter: { id: string; username: string; position: Position };
}

/** Everything the owner of the account can edit */
export interface PrivacySettings {
  profileVisibility: ProfileVisibility;
  friendRequestPolicy: FriendRequestPolicy;
  commentPolicy: import('./comments').CommentPolicy;
  notifyOnComment: boolean;
  notifyOnMention: boolean;
  notifyOnReply: boolean;
  hideEmail: boolean;
  hideCountry: boolean;
  hideCity: boolean;
  hideBirthDate: boolean;
  hideGender: boolean;
  hideStatistics: boolean;
  hideSocials: boolean;
}

export interface MyProfile extends PrivacySettings {
  id: string;
  email: string;
  username: string;
  position: Position;
  minecraftNick: string | null;
  avatar: string | null;
  banner: string | null;
  bannerPreset: string | null;
  /** Ready to render, resolved from banner or bannerPreset */
  bannerUrl: string | null;
  statusText: string | null;
  bio: string | null;
  country: string | null;
  city: string | null;
  gender: Gender | null;
  birthDate: string | null;
  showBirthDate: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  badges: UserBadge[];
  awards: UserAward[];
  mediaBadges: MediaBadge[];
  socials: SocialLink[];
  statistics: PlayerStatistics | null;
}

/** Anyone can read this one, hidden fields are stripped before it leaves the api */
export interface UserProfile {
  id: string;
  username: string;
  avatar: string | null;
  bannerUrl: string | null;
  minecraftNick: string | null;
  position: Position;
  createdAt: string;
  lastLoginAt: string | null;
  statusText: string | null;
  bio: string | null;
  country: string | null;
  city: string | null;
  gender: Gender | null;
  age: number | null;
  badges: UserBadge[];
  awards: UserAward[];
  mediaBadges: MediaBadge[];
  socials: SocialLink[] | null;
  statistics: PlayerStatistics | null;
  likesCount: number;
  dislikesCount: number;
  viewsCount: number;
  userReaction: ReactionType | null;
  isOwner: boolean;
  commentsEnabled: boolean;
  commentsForcedReason: string | null;
  commentPolicy: import('./comments').CommentPolicy;
  /** Present while FRIENDS_ONLY still behaves like EVERYONE for non-friends */
  visibility?: 'friends_only';
}

/** 403 body when profileVisibility is NOBODY and the viewer is not the owner */
export interface RestrictedProfileResponse {
  restricted: true;
  reason: 'private';
  user: {
    username: string;
    avatar: string | null;
    position: Position;
    bannerUrl?: string | null;
    statusText?: string | null;
  };
}

export interface ProfileReactionSummary {
  likesCount: number;
  dislikesCount: number;
  userReaction: ReactionType | null;
}

export interface SessionInfo {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  isCurrent: boolean;
}
