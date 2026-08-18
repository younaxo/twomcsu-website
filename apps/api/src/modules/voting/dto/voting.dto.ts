import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateVoteSiteDto {
  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  @MaxLength(64)
  slug: string;

  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @IsUrl({ require_protocol: true })
  url: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  logoUrl?: string | null;

  @IsInt()
  @Min(0)
  @Max(100_000)
  rewardCoins: number;

  @IsInt()
  @Min(1)
  @Max(168)
  cooldownHours: number;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateVoteSiteDto extends PartialType(CreateVoteSiteDto) {}

export class VoteWebhookDto {
  @IsString()
  @MaxLength(100)
  username: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  externalId?: string;
}
