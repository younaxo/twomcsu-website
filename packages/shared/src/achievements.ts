export const AchievementCategory = {
  GAME: 'GAME',
  SOCIAL: 'SOCIAL',
  DONATION: 'DONATION',
  SPECIAL: 'SPECIAL',
  DAILY: 'DAILY',
  SECRET: 'SECRET',
} as const;

export type AchievementCategory =
  (typeof AchievementCategory)[keyof typeof AchievementCategory];

export const AchievementRarity = {
  COMMON: 'COMMON',
  RARE: 'RARE',
  EPIC: 'EPIC',
  LEGENDARY: 'LEGENDARY',
  MYTHIC: 'MYTHIC',
} as const;

export type AchievementRarity =
  (typeof AchievementRarity)[keyof typeof AchievementRarity];

export const AchievementConditionType = {
  PLAYTIME_MINUTES: 'PLAYTIME_MINUTES',
  KILLS_COUNT: 'KILLS_COUNT',
  DEATHS_COUNT: 'DEATHS_COUNT',
  FRIENDS_COUNT: 'FRIENDS_COUNT',
  COMMENTS_COUNT: 'COMMENTS_COUNT',
  LIKES_RECEIVED: 'LIKES_RECEIVED',
  PURCHASES_COUNT: 'PURCHASES_COUNT',
  TOTAL_SPENT: 'TOTAL_SPENT',
  GIFTS_SENT: 'GIFTS_SENT',
  GIFTS_RECEIVED: 'GIFTS_RECEIVED',
  DAYS_STREAK: 'DAYS_STREAK',
  ACCOUNT_AGE_DAYS: 'ACCOUNT_AGE_DAYS',
  PROFILE_VIEWS: 'PROFILE_VIEWS',
  BADGES_COUNT: 'BADGES_COUNT',
  REGISTRATION_ORDER: 'REGISTRATION_ORDER',
  BUG_REPORTED: 'BUG_REPORTED',
  REPORTS_RESOLVED: 'REPORTS_RESOLVED',
  MANUAL: 'MANUAL',
  CUSTOM: 'CUSTOM',
} as const;

export type AchievementConditionType =
  (typeof AchievementConditionType)[keyof typeof AchievementConditionType];

export const ACHIEVEMENT_CATEGORY_LABELS: Record<AchievementCategory, string> = {
  GAME: 'Игра',
  SOCIAL: 'Социальные',
  DONATION: 'Донат',
  SPECIAL: 'Особые',
  DAILY: 'Ежедневные',
  SECRET: 'Секретные',
};

export const ACHIEVEMENT_RARITY_LABELS: Record<AchievementRarity, string> = {
  COMMON: 'Обычное',
  RARE: 'Редкое',
  EPIC: 'Эпическое',
  LEGENDARY: 'Легендарное',
  MYTHIC: 'Мифическое',
};

export const ACHIEVEMENT_RARITY_COLORS: Record<AchievementRarity, string> = {
  COMMON: '#9CA3AF',
  RARE: '#3B82F6',
  EPIC: '#8B5CF6',
  LEGENDARY: '#FFD700',
  MYTHIC: '#EF4444',
};

export const ACHIEVEMENT_RARITY_REWARDS: Record<AchievementRarity, number> = {
  COMMON: 50,
  RARE: 100,
  EPIC: 250,
  LEGENDARY: 500,
  MYTHIC: 1000,
};

export const MAX_SHOWCASE_ACHIEVEMENTS = 6;

export interface Achievement {
  id: string;
  slug: string;
  name: string;
  description: string;
  iconUrl: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  isSecret: boolean;
  isActive: boolean;
  order: number;
  conditionType: AchievementConditionType;
  conditionValue: number | null;
  conditionParams: Record<string, unknown> | null;
  rewardRubies: number;
  rewardBadgeType: string | null;
  rewardTitle: string | null;
  rewardMessage: string | null;
  unlockedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserAchievementProgress {
  id: string;
  currentProgress: number;
  isCompleted: boolean;
  completedAt: string | null;
  isShowcased: boolean;
  showcaseOrder: number;
  rewardsGranted: boolean;
}

export interface AchievementWithProgress extends Achievement {
  /** Hidden secrets show as ??? until unlocked */
  isHidden: boolean;
  progress: UserAchievementProgress | null;
  progressPercent: number;
}

export interface AchievementDetail extends AchievementWithProgress {
  recentUnlocks: AchievementUnlockPreview[];
}

export interface AchievementUnlockPreview {
  userId: string;
  username: string;
  avatar: string | null;
  completedAt: string;
}

export interface UserAchievementsResponse {
  achievements: AchievementWithProgress[];
  showcase: AchievementWithProgress[];
  completedCount: number;
  totalCount: number;
}

export interface AchievementsStats {
  totalAchievements: number;
  totalUnlocks: number;
  byCategory: Record<string, number>;
  byRarity: Record<string, number>;
  rarest: Array<{
    slug: string;
    name: string;
    rarity: AchievementRarity;
    unlockedCount: number;
  }>;
}

export interface AchievementUnlockedPayload {
  achievement: Achievement;
  userAchievement: UserAchievementProgress;
  rewards: {
    rubies: number;
    badgeType: string | null;
    title: string | null;
  };
}

export type AchievementFilter = 'all' | 'unlocked' | 'available' | 'locked';
