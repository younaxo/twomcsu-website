import { TopicCategory, TopicVisibility } from '@twomc/shared';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { HEX_COLOR_PATTERN } from '@twomc/shared';

export class ListTopicsQueryDto {
  @IsOptional()
  @IsEnum(TopicCategory)
  category?: TopicCategory;

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
}

export class CreateTopicDto {
  @IsString()
  @Length(2, 200)
  title: string;

  @IsString()
  @Length(2, 120)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug может содержать только строчные латинские буквы, цифры и дефис',
  })
  slug: string;

  @IsEnum(TopicCategory)
  category: TopicCategory;

  @IsOptional()
  @IsEnum(TopicVisibility)
  visibility?: TopicVisibility;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  icon?: string;

  @IsOptional()
  @Matches(HEX_COLOR_PATTERN, { message: 'Цвет должен быть в формате #RRGGBB' })
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsString()
  @MaxLength(100_000)
  content: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;
}

export class UpdateTopicDto {
  @IsOptional()
  @IsString()
  @Length(2, 200)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(2, 120)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug может содержать только строчные латинские буквы, цифры и дефис',
  })
  slug?: string;

  @IsOptional()
  @IsEnum(TopicCategory)
  category?: TopicCategory;

  @IsOptional()
  @IsEnum(TopicVisibility)
  visibility?: TopicVisibility;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  icon?: string;

  @IsOptional()
  @Matches(HEX_COLOR_PATTERN, { message: 'Цвет должен быть в формате #RRGGBB' })
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100_000)
  content?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;
}

class TopicOrderItemDto {
  @IsString()
  id: string;

  @Type(() => Number)
  @IsInt()
  order: number;
}

export class ReorderTopicsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TopicOrderItemDto)
  orders: TopicOrderItemDto[];
}
