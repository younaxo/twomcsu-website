import { HEX_COLOR_PATTERN, RoleGroup } from '@twomc/shared';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePositionDto {
  @IsString()
  @Length(2, 64)
  name: string;

  @IsString()
  @Length(2, 64)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug может содержать только строчные латинские буквы, цифры и дефис',
  })
  slug: string;

  /** Falls back to name when omitted */
  @IsOptional()
  @IsString()
  @Length(2, 64)
  displayName?: string;

  @IsEnum(RoleGroup)
  group: RoleGroup;

  @Matches(HEX_COLOR_PATTERN, { message: 'Цвет должен быть в формате #RRGGBB' })
  color: string;

  /** Empty string clears the field */
  @IsOptional()
  @Matches(/^$|^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/, {
    message: 'Фон должен быть в формате #RRGGBB или #RRGGBBAA',
  })
  backgroundColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  icon?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  priority?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
