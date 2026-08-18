import { MediaBadgeRequestStatus } from '@twomc/shared';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class ReviewMediaRequestDto {
  @IsIn([MediaBadgeRequestStatus.APPROVED, MediaBadgeRequestStatus.REJECTED])
  status: typeof MediaBadgeRequestStatus.APPROVED | typeof MediaBadgeRequestStatus.REJECTED;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reviewNote?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  rank?: number;
}
