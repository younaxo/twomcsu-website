import { ProfileReportReason } from '@twomc/shared';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProfileReportDto {
  @IsEnum(ProfileReportReason)
  reason: ProfileReportReason;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
