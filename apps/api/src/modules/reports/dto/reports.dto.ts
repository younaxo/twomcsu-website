import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  PunishmentType,
  ReportStatus,
  ReportType,
} from '@twomc/shared';

export class ReportTargetInputDto {
  @IsString()
  @MinLength(2)
  @MaxLength(16)
  username!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order?: number;
}

export class ReportEvidenceLinkInputDto {
  @IsUrl()
  @MaxLength(2000)
  url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order?: number;
}

export class CreateReportDto {
  @IsEnum(ReportType)
  type!: ReportType;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => ReportTargetInputDto)
  targets?: ReportTargetInputDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => ReportEvidenceLinkInputDto)
  evidenceLinks?: ReportEvidenceLinkInputDto[];

  @IsOptional()
  @IsString()
  @MaxLength(64)
  server?: string;

  @IsOptional()
  @IsDateString()
  incidentDate?: string;

  @IsString()
  @MinLength(20)
  @MaxLength(10_000)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5_000)
  additionalText?: string;

  @IsOptional()
  @IsString()
  appealedPunishmentId?: string;

  @IsOptional()
  @IsString()
  captchaToken?: string;
}

export class CreateDonationProblemDto {
  @IsEmail()
  contactEmail!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(32)
  contactPhone!: string;

  @IsString()
  @MaxLength(64)
  server!: string;

  @IsDateString()
  paymentDate!: string;

  @IsString()
  @MinLength(20)
  @MaxLength(10_000)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5_000)
  additionalText?: string;

  @IsOptional()
  @IsString()
  captchaToken?: string;
}

export class ListReportsQueryDto {
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(ReportType)
  type?: ReportType;

  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  server?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  /** author | target | moderator | all — my reports list only */
  @IsOptional()
  @IsIn(['author', 'target', 'moderator', 'all'])
  role?: 'author' | 'target' | 'moderator' | 'all';

  /** all | me | free — moderation list only */
  @IsOptional()
  @IsString()
  assigned?: string;
}

export class AddReportMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5_000)
  content!: string;
}

export class UpdateOwnReportMessageDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(5_000)
  content?: string;

  @IsOptional()
  @IsBoolean()
  delete?: boolean;
}

export class AssignReportDto {
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  userId?: string | null;
}

export class ChangeReportStatusDto {
  @IsEnum(ReportStatus)
  status!: ReportStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1_000)
  comment?: string;
}

export class SetVerdictDto {
  @IsString()
  @MinLength(5)
  @MaxLength(5_000)
  verdict!: string;
}

export class CreateModeratorNoteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5_000)
  content!: string;
}

export class UpdateModeratorNoteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5_000)
  content!: string;
}

export class SoftDeleteMessageDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class CreatePunishmentDto {
  @IsEnum(PunishmentType)
  punishmentType!: PunishmentType;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  duration?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  server?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsBoolean()
  isAppealable?: boolean;
}

export class UpdatePunishmentDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  duration?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;

  @IsOptional()
  @IsBoolean()
  isAppealable?: boolean;
}

export class LockReportDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}

export class ArchiveReportDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class BanReportsDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;

  @IsOptional()
  @IsDateString()
  until?: string;
}

export class ReportRulesQueryDto {
  @IsEnum(ReportType)
  type!: ReportType;
}

export class MyPunishmentsQueryDto {
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  onlyAppealable?: boolean;
}
