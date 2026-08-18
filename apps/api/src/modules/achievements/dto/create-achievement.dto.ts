import {
  AchievementCategory,
  AchievementConditionType,
  AchievementRarity,
} from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateAchievementDto {
  @IsString()
  @Length(2, 64)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug может содержать только строчные латинские буквы, цифры и дефис',
  })
  slug: string;

  @IsString()
  @Length(2, 128)
  name: string;

  @IsString()
  @Length(2, 2000)
  description: string;

  @IsString()
  @MaxLength(500)
  iconUrl: string;

  @IsEnum(AchievementCategory)
  category: AchievementCategory;

  @IsEnum(AchievementRarity)
  rarity: AchievementRarity;

  @IsOptional()
  @IsBoolean()
  isSecret?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsEnum(AchievementConditionType)
  conditionType: AchievementConditionType;

  @IsOptional()
  @IsInt()
  @Min(0)
  conditionValue?: number | null;

  @IsOptional()
  @IsObject()
  conditionParams?: Record<string, unknown> | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  rewardRubies?: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  rewardBadgeType?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  rewardTitle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rewardMessage?: string | null;
}
