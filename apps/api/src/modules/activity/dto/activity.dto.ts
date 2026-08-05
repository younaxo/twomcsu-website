import {
  ACTIVITY_EMOJIS,
  ActivityFeedFilter,
  ActivityType,
  ActivityVisibility,
  MAX_ACTIVITY_COMMENT_LENGTH,
  MAX_ACTIVITY_PAGE_SIZE,
} from '@twomc/shared';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class ListActivityFeedQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_ACTIVITY_PAGE_SIZE)
  limit?: number;

  @IsOptional()
  @IsIn(Object.values(ActivityType))
  type?: ActivityType;

  @IsOptional()
  @IsIn(Object.values(ActivityFeedFilter))
  filter?: ActivityFeedFilter;
}

export class ActivityHighlightsQueryDto {
  @IsOptional()
  @IsIn(['day', 'week'])
  period?: 'day' | 'week';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class ActivityReactionDto {
  @IsIn(ACTIVITY_EMOJIS)
  emoji!: string;
}

export class CreateActivityCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_ACTIVITY_COMMENT_LENGTH)
  content!: string;
}

export class UpdateActivitySettingsDto {
  @IsOptional()
  @IsBoolean()
  showPurchases?: boolean;

  @IsOptional()
  @IsBoolean()
  showAchievements?: boolean;

  @IsOptional()
  @IsBoolean()
  showBadges?: boolean;

  @IsOptional()
  @IsBoolean()
  showAwards?: boolean;

  @IsOptional()
  @IsBoolean()
  showGifts?: boolean;

  @IsOptional()
  @IsBoolean()
  showFriendships?: boolean;

  @IsOptional()
  @IsBoolean()
  showProfileUpdates?: boolean;

  @IsOptional()
  @IsBoolean()
  showMilestones?: boolean;

  @IsOptional()
  @IsBoolean()
  showServerActivity?: boolean;

  @IsOptional()
  @IsIn(Object.values(ActivityVisibility))
  purchasesVisibility?: ActivityVisibility;

  @IsOptional()
  @IsIn(Object.values(ActivityVisibility))
  achievementsVisibility?: ActivityVisibility;

  @IsOptional()
  @IsIn(Object.values(ActivityVisibility))
  badgesVisibility?: ActivityVisibility;

  @IsOptional()
  @IsIn(Object.values(ActivityVisibility))
  giftsVisibility?: ActivityVisibility;

  @IsOptional()
  @IsIn(Object.values(ActivityVisibility))
  friendshipsVisibility?: ActivityVisibility;

  @IsOptional()
  @IsIn(Object.values(ActivityVisibility))
  profileUpdatesVisibility?: ActivityVisibility;

  @IsOptional()
  @IsBoolean()
  notifyOnComment?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyOnReaction?: boolean;
}

export class HideActivityDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class CreateCustomActivityDto {
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  actionUrl?: string;

  @IsOptional()
  @IsIn([ActivityType.CUSTOM, ActivityType.EVENT_ANNOUNCED])
  type?: typeof ActivityType.CUSTOM | typeof ActivityType.EVENT_ANNOUNCED;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;
}

export class AdminListActivityQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsIn(Object.values(ActivityType))
  type?: ActivityType;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isHidden?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  username?: string;
}
