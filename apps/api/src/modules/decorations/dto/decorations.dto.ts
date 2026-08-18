import { DecorationAvailability } from '@twomc/shared';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class SelectDecorationDto {
  @IsOptional()
  @IsString()
  decorationId?: string | null;
}

export class GrantDecorationDto {
  @IsString()
  @MaxLength(100)
  user: string;

  @IsString()
  decorationId: string;
}

export class UpdateDecorationDto {
  @IsOptional()
  @IsEnum(DecorationAvailability)
  availability?: DecorationAvailability;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
