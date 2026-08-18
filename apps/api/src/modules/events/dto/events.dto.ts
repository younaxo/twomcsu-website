import { PartialType } from '@nestjs/mapped-types';
import {
  CalendarEventCategory,
  CalendarEventStatus,
  CalendarEventVisibility,
  EventAttendanceStatus,
} from '@twomc/shared';
import { Type } from 'class-transformer';
import {
  IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString,
  Length, Matches, Max, MaxLength, Min,
} from 'class-validator';

export class ListEventsQueryDto {
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
  @IsOptional() @IsEnum(CalendarEventCategory) category?: CalendarEventCategory;
}

export class CreateEventDto {
  @IsString() @Length(2, 160) title: string;
  @IsOptional() @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) slug?: string;
  @IsString() @MaxLength(100_000) description: string;
  @IsOptional() @IsString() @MaxLength(500) coverImage?: string | null;
  @IsEnum(CalendarEventCategory) category: CalendarEventCategory;
  @IsOptional() @IsEnum(CalendarEventStatus) status?: CalendarEventStatus;
  @IsOptional() @IsEnum(CalendarEventVisibility) visibility?: CalendarEventVisibility;
  @IsDateString() startsAt: string;
  @IsOptional() @IsDateString() endsAt?: string | null;
  @IsOptional() @IsBoolean() allDay?: boolean;
  @IsOptional() @IsString() @MaxLength(64) timezone?: string;
  @IsOptional() @IsString() @MaxLength(200) location?: string | null;
  @IsOptional() @IsString() @MaxLength(100) serverName?: string | null;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100_000) maxParticipants?: number | null;
  @IsOptional() @IsDateString() registrationDeadline?: string | null;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
}

export class UpdateEventDto extends PartialType(CreateEventDto) {}

export class EventAttendanceDto {
  @IsEnum(EventAttendanceStatus)
  status: EventAttendanceStatus;
}
