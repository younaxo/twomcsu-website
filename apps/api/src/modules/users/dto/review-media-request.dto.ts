import { MediaBadgeRequestStatus } from '@twomc/shared';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewMediaRequestDto {
  @IsIn([MediaBadgeRequestStatus.APPROVED, MediaBadgeRequestStatus.REJECTED])
  status: typeof MediaBadgeRequestStatus.APPROVED | typeof MediaBadgeRequestStatus.REJECTED;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reviewNote?: string;
}
