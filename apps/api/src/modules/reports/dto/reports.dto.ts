import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  PunishmentType,
  ReportStatus,
  ReportType,
} from '@twomc/shared';

export class CreateReportDto {
  @IsEnum(ReportType)
  type!: ReportType;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  targetUsername?: string;

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
  @IsArray()
  @IsUrl({}, { each: true })
  evidenceLinks?: string[];

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

  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
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
}

export class SetVerdictDto {
  @IsString()
  @MinLength(5)
  @MaxLength(5_000)
  verdict!: string;
}

export class PunishReportDto {
  @IsEnum(PunishmentType)
  punishmentType!: PunishmentType;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  duration?: string;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}

export class LockReportDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
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
