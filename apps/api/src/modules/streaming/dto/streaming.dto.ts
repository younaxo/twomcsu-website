import { StreamPlatform } from '@prisma/client';
import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateStreamChannelDto {
  @IsEnum(StreamPlatform)
  platform: StreamPlatform;

  @IsString()
  @MaxLength(128)
  channelKey: string;

  @IsUrl({ require_protocol: true })
  channelUrl: string;

  @IsString()
  @MaxLength(100)
  displayName: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  avatarUrl?: string | null;

  @IsOptional()
  @IsString()
  userId?: string | null;

  @IsOptional()
  @IsBoolean()
  isPartner?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateStreamChannelDto extends PartialType(CreateStreamChannelDto) {}
