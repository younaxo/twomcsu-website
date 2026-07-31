import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  DigestMode,
  NotificationPriority,
  NotificationType,
} from '@twomc/shared';

export class ListNotificationsDto {
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
  @Type(() => Boolean)
  @IsBoolean()
  unreadOnly?: boolean;
}

export class UpdateNotificationSettingsDto {
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  discordEnabled?: boolean;

  @IsOptional()
  @IsString()
  discordWebhookUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  soundEnabled?: boolean;

  @IsOptional()
  @IsEnum(DigestMode)
  digestMode?: DigestMode;

  @IsOptional()
  @IsString()
  digestTime?: string | null;

  @IsOptional()
  @IsBoolean()
  quietHoursEnabled?: boolean;

  @IsOptional()
  @IsString()
  quietHoursStart?: string | null;

  @IsOptional()
  @IsString()
  quietHoursEnd?: string | null;

  @IsOptional()
  @IsObject()
  typeSettings?: Record<string, Record<string, boolean>>;
}

export class UpdateTypeSettingDto {
  @IsOptional()
  @IsBoolean()
  site?: boolean;

  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @IsOptional()
  @IsBoolean()
  push?: boolean;

  @IsOptional()
  @IsBoolean()
  discord?: boolean;

  @IsOptional()
  @IsBoolean()
  sound?: boolean;
}

export class PushSubscribeDto {
  @IsString()
  @MinLength(8)
  endpoint!: string;

  @IsObject()
  keys!: { p256dh: string; auth: string };

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  deviceName?: string;
}

export class DiscordPersonalWebhookDto {
  @IsUrl({ require_protocol: true, protocols: ['https'] })
  url!: string;
}

export class UpdateDigestDto {
  @IsEnum(DigestMode)
  digestMode!: DigestMode;

  @IsOptional()
  @IsString()
  digestTime?: string;
}

export class AdminWebhookDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsUrl({ require_protocol: true, protocols: ['https'] })
  url!: string;

  @IsArray()
  @IsString({ each: true })
  eventTypes!: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAdminWebhookDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ['https'] })
  url?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  eventTypes?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class BroadcastNotificationDto {
  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  userIds?: string[];
}
