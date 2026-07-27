import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateStatisticsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  coins?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  playTime?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  kills?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  deaths?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  hits?: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  lastServer?: string | null;
}
