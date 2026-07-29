import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class AwardOrderItemDto {
  @IsString()
  awardId: string;

  @IsInt()
  @Min(0)
  order: number;
}

export class UpdateAwardsOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AwardOrderItemDto)
  orders: AwardOrderItemDto[];
}
