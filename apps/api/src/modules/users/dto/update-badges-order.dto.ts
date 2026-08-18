import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class BadgeOrderItemDto {
  @IsString()
  badgeId: string;

  @IsInt()
  @Min(0)
  order: number;
}

export class UpdateBadgesOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BadgeOrderItemDto)
  orders: BadgeOrderItemDto[];
}
