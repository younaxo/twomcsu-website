import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class SendMessageDto {
  @IsString()
  channelId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}

export class EditMessageDto {
  @IsString()
  messageId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;
}

export class MessageIdDto {
  @IsString()
  messageId!: string;
}

export class ChannelIdDto {
  @IsString()
  channelId!: string;
}

export class MuteUserDto {
  @IsString()
  targetId!: string;

  @IsOptional()
  @IsString()
  channelId?: string;

  @IsIn(['SPAM', 'TOXIC', 'ADVERTISING', 'CAPS', 'OTHER'])
  reason!: 'SPAM' | 'TOXIC' | 'ADVERTISING' | 'CAPS' | 'OTHER';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reasonNote?: string;

  /** Duration in minutes; omit for permanent */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationMinutes?: number;
}

export class BanUserDto {
  @IsString()
  targetId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationMinutes?: number;
}

export class CreateChannelDto {
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  slug!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  description?: string;

  @IsIn(['GENERAL', 'TRADE', 'HELP', 'ANNOUNCEMENTS', 'GAME', 'FLOOD'])
  type!: 'GENERAL' | 'TRADE' | 'HELP' | 'ANNOUNCEMENTS' | 'GAME' | 'FLOOD';

  @IsOptional()
  @IsString()
  @MaxLength(8)
  icon?: string;

  @IsOptional()
  @IsBoolean()
  isReadOnly?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order?: number;
}

export class UpdateChannelDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  icon?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isReadOnly?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order?: number;
}

export class ChatSettingsDto {
  @IsOptional()
  @IsString()
  blacklist?: string;

  @IsOptional()
  @IsString()
  previewWhitelist?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  rateLimitCount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  rateLimitWindowSec?: number;
}
