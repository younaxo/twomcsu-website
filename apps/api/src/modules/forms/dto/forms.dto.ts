import { FormFieldType, FormStatus, FormVisibility } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Field definition used inside form create/update dtos */
export class CreateFormFieldDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsEnum(FormFieldType)
  type!: FormFieldType;

  @IsString()
  @Length(1, 200)
  label!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  placeholder?: string | null;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stepIndex?: number | null;

  @IsOptional()
  options?: unknown;

  @IsOptional()
  validation?: unknown;

  @IsOptional()
  conditionalLogic?: unknown;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  defaultValue?: string | null;

  @IsOptional()
  @IsInt()
  minValue?: number | null;

  @IsOptional()
  @IsInt()
  maxValue?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  minLength?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxLength?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxFiles?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxFileSize?: number | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  allowedMimes?: string[];

  @IsOptional()
  metadata?: unknown;
}

export class CreateFormDto {
  @IsString()
  @Length(2, 200)
  title!: string;

  @IsOptional()
  @IsString()
  @Length(2, 120)
  @Matches(SLUG_REGEX, {
    message: 'Slug может содержать только строчные латинские буквы, цифры и дефис',
  })
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImage?: string | null;

  @IsOptional()
  @IsEnum(FormVisibility)
  visibility?: FormVisibility;

  @IsOptional()
  @IsBoolean()
  onePerUser?: boolean;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @IsOptional()
  @IsBoolean()
  showResults?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresAuth?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresCaptcha?: boolean;

  @IsOptional()
  @IsDateString()
  opensAt?: string | null;

  @IsOptional()
  @IsDateString()
  closesAt?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  timeLimit?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxResponses?: number | null;

  @IsOptional()
  @IsBoolean()
  multiStep?: boolean;

  @IsOptional()
  stepsConfig?: unknown;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  thankYouMessage?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  redirectUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20_000)
  customCss?: string | null;

  @IsOptional()
  @IsEnum(FormStatus)
  status?: FormStatus;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CreateFormFieldDto)
  fields?: CreateFormFieldDto[];
}

export class UpdateFormDto {
  @IsOptional()
  @IsString()
  @Length(2, 200)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(2, 120)
  @Matches(SLUG_REGEX, {
    message: 'Slug может содержать только строчные латинские буквы, цифры и дефис',
  })
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImage?: string | null;

  @IsOptional()
  @IsEnum(FormVisibility)
  visibility?: FormVisibility;

  @IsOptional()
  @IsBoolean()
  onePerUser?: boolean;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @IsOptional()
  @IsBoolean()
  showResults?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresAuth?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresCaptcha?: boolean;

  @IsOptional()
  @IsDateString()
  opensAt?: string | null;

  @IsOptional()
  @IsDateString()
  closesAt?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  timeLimit?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxResponses?: number | null;

  @IsOptional()
  @IsBoolean()
  multiStep?: boolean;

  @IsOptional()
  stepsConfig?: unknown;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  thankYouMessage?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  redirectUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20_000)
  customCss?: string | null;

  @IsOptional()
  @IsEnum(FormStatus)
  status?: FormStatus;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CreateFormFieldDto)
  fields?: CreateFormFieldDto[];
}

export class AnswerDto {
  @IsString()
  fieldId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50_000)
  textValue?: string | null;

  @IsOptional()
  @IsNumber()
  numberValue?: number | null;

  @IsOptional()
  @IsBoolean()
  booleanValue?: boolean | null;

  @IsOptional()
  @IsDateString()
  dateValue?: string | null;

  @IsOptional()
  jsonValue?: unknown;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(1000, { each: true })
  fileUrls?: string[];
}

export class SubmitResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers!: AnswerDto[];

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  captchaToken?: string;

  @IsOptional()
  @IsString()
  @Length(4, 64)
  inviteCode?: string;

  @IsOptional()
  @IsBoolean()
  isDraft?: boolean;
}

export class SaveDraftDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers!: AnswerDto[];

  @IsOptional()
  @IsInt()
  @Min(0)
  currentStep?: number;
}

export const EXPORT_FORMATS = ['csv', 'excel', 'pdf'] as const;
export type FormExportFormat = (typeof EXPORT_FORMATS)[number];

export class ExportFormDto {
  @IsIn(EXPORT_FORMATS)
  format!: FormExportFormat;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsBoolean()
  completeOnly?: boolean;
}

export class CreateInviteDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10_000)
  maxUses?: number | null;

  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;
}

export class ListFormsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsEnum(FormStatus)
  status?: FormStatus;

  @IsOptional()
  @IsEnum(FormVisibility)
  visibility?: FormVisibility;
}

export class ListResponsesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  completeOnly?: boolean;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

export class CreateFromTemplateDto {
  @IsOptional()
  @IsObject()
  overrides?: Record<string, unknown>;
}
