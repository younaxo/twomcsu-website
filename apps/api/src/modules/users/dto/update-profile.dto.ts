import { CommentPolicy, FriendRequestPolicy, Gender, ProfileVisibility } from '@twomc/shared';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(16)
  minecraftNick?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  statusText?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string | null;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender | null;

  @IsOptional()
  @IsDateString()
  birthDate?: string | null;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  showBirthDate?: boolean;

  @IsOptional()
  @IsEnum(ProfileVisibility)
  profileVisibility?: ProfileVisibility;

  @IsOptional()
  @IsEnum(FriendRequestPolicy)
  friendRequestPolicy?: FriendRequestPolicy;

  @IsOptional()
  @IsEnum(CommentPolicy)
  commentPolicy?: CommentPolicy;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  notifyOnComment?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  notifyOnMention?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  notifyOnReply?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  notifyOnFriendRequest?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  notifyOnGift?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  notifyOnOrder?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hideEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hideCountry?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hideCity?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hideBirthDate?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hideGender?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hideStatistics?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hideSocials?: boolean;
}
