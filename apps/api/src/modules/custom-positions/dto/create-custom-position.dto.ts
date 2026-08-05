import { HEX_COLOR_PATTERN } from '@twomc/shared';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateCustomPositionDto {
  @IsString()
  @Length(2, 64)
  name: string;

  @IsString()
  @Length(2, 64)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug может содержать только строчные латинские буквы, цифры и дефис',
  })
  slug: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @Matches(HEX_COLOR_PATTERN, { message: 'Цвет должен быть в формате #RRGGBB' })
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  icon?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
