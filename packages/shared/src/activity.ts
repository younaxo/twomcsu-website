import type { Position } from './position';

export const ActivityType = {
  PURCHASE_MADE: 'PURCHASE_MADE',
  RANK_ACHIEVED: 'RANK_ACHIEVED',
  ACHIEVEMENT_UNLOCKED: 'ACHIEVEMENT_UNLOCKED',
  BADGE_GRANTED: 'BADGE_GRANTED',
  AWARD_GRANTED: 'AWARD_GRANTED',
  GIFT_SENT: 'GIFT_SENT',
  GIFT_RECEIVED: 'GIFT_RECEIVED',
  FRIENDSHIP_STARTED: 'FRIENDSHIP_STARTED',
  PROFILE_UPDATED: 'PROFILE_UPDATED',
  NEWS_POSTED: 'NEWS_POSTED',
  EVENT_ANNOUNCED: 'EVENT_ANNOUNCED',
  MILESTONE_REACHED: 'MILESTONE_REACHED',
  JOINED_SERVER: 'JOINED_SERVER',
  TOP_ACHIEVED: 'TOP_ACHIEVED',
  MEDIA_APPROVED: 'MEDIA_APPROVED',
  DONATOR_UPGRADED: 'DONATOR_UPGRADED',
  BIRTHDAY: 'BIRTHDAY',
  CUSTOM: 'CUSTOM',
} as const;

export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];

export const ActivityVisibility = {
  PUBLIC: 'PUBLIC',
  FRIENDS: 'FRIENDS',
  PRIVATE: 'PRIVATE',
} as const;

export type ActivityVisibility =
  (typeof ActivityVisibility)[keyof typeof ActivityVisibility];

export const ActivityFeedFilter = {
  ALL: 'all',
  FRIENDS: 'friends',
  ME: 'me',
} as const;

export type ActivityFeedFilter =
  (typeof ActivityFeedFilter)[keyof typeof ActivityFeedFilter];

export const ACTIVITY_EMOJIS = [
  'thumbs_up',
  'heart',
  'laugh',
  'wow',
  'party',
  'gift',
  'fire',
  'star',
] as const;

export type ActivityEmoji = (typeof ACTIVITY_EMOJIS)[number];

export const ACTIVITY_EMOJI_LABELS: Record<ActivityEmoji, string> = {
  thumbs_up: 'Нравится',
  heart: 'Сердце',
  laugh: 'Смех',
  wow: 'Вау',
  party: 'Праздник',
  gift: 'Подарок',
  fire: 'Огонь',
  star: 'Звезда',
};

export const ACTIVITY_EMOJI_CHARS: Record<ActivityEmoji, string> = {
  thumbs_up: '👍',
  heart: '❤️',
  laugh: '😂',
  wow: '😮',
  party: '🎉',
  gift: '🎁',
  fire: '🔥',
  star: '⭐',
};

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  PURCHASE_MADE: 'Покупки',
  RANK_ACHIEVED: 'Ранги',
  ACHIEVEMENT_UNLOCKED: 'Достижения',
  BADGE_GRANTED: 'Бейджи',
  AWARD_GRANTED: 'Награды',
  GIFT_SENT: 'Подарки',
  GIFT_RECEIVED: 'Подарки',
  FRIENDSHIP_STARTED: 'Дружба',
  PROFILE_UPDATED: 'Профиль',
  NEWS_POSTED: 'Новости',
  EVENT_ANNOUNCED: 'События',
  MILESTONE_REACHED: 'Веха',
  JOINED_SERVER: 'Сервер',
  TOP_ACHIEVED: 'Топ',
  MEDIA_APPROVED: 'Медиа',
  DONATOR_UPGRADED: 'Донат',
  BIRTHDAY: 'День рождения',
  CUSTOM: 'Объявление',
};

export interface ActivityAuthor {
  id: string;
  username: string;
  avatar: string | null;
  shortId: number;
  roleGroup: string;
  position?: Position | null;
  badges?: Array<{
    id: string;
    type: string;
  }>;
}

export interface ActivityReactionSummary {
  emoji: ActivityEmoji;
  count: number;
  reactedByMe: boolean;
  users: Array<{ username: string; avatar: string | null }>;
}

export interface ActivityCommentItem {
  id: string;
  content: string;
  contentHtml: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  author: ActivityAuthor;
}

export interface ActivityItem {
  id: string;
  type: ActivityType;
  visibility: ActivityVisibility;
  title: string;
  description: string | null;
  imageUrl: string | null;
  actionUrl: string | null;
  metadata: Record<string, unknown> | null;
  isPinned: boolean;
  createdAt: string;
  user: ActivityAuthor;
  reactions: ActivityReactionSummary[];
  commentsCount: number;
  reactionsCount: number;
}

export interface ActivityDetail extends ActivityItem {
  comments: ActivityCommentItem[];
}

export interface ActivityFeedSettings {
  showPurchases: boolean;
  showAchievements: boolean;
  showBadges: boolean;
  showAwards: boolean;
  showGifts: boolean;
  showFriendships: boolean;
  showProfileUpdates: boolean;
  showMilestones: boolean;
  showServerActivity: boolean;
  purchasesVisibility: ActivityVisibility;
  achievementsVisibility: ActivityVisibility;
  badgesVisibility: ActivityVisibility;
  giftsVisibility: ActivityVisibility;
  friendshipsVisibility: ActivityVisibility;
  profileUpdatesVisibility: ActivityVisibility;
  notifyOnComment: boolean;
  notifyOnReaction: boolean;
}

export interface ActivityFeedQuery {
  page?: number;
  limit?: number;
  type?: ActivityType;
  filter?: ActivityFeedFilter;
}

export interface ActivityStats {
  total: number;
  byType: Array<{ type: ActivityType; count: number }>;
  hiddenCount: number;
  pinnedCount: number;
  reactionsCount: number;
  commentsCount: number;
  topUsers: Array<{ userId: string; username: string; count: number }>;
}

export const MAX_ACTIVITY_COMMENT_LENGTH = 1000;
export const MAX_ACTIVITY_PAGE_SIZE = 50;
