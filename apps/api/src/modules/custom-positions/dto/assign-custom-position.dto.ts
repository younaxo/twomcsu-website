import { IsNotEmpty, IsString } from 'class-validator';

export class AssignCustomPositionDto {
  @IsString()
  @IsNotEmpty({ message: 'Укажите кастомную должность' })
  customPositionId: string;
}
