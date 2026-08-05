import { ProfileReportStatus } from '@twomc/shared';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewProfileReportDto {
  @IsIn([ProfileReportStatus.RESOLVED, ProfileReportStatus.REJECTED])
  status: typeof ProfileReportStatus.RESOLVED | typeof ProfileReportStatus.REJECTED;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reviewNote?: string;
}
