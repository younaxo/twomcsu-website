import { UserBadgeType } from '@twomc/shared';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export class GrantBadgeDto {
  @IsEnum(UserBadgeType)
  type: UserBadgeType;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
