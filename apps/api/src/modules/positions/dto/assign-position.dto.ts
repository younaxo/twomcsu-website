import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AssignPositionDto {
  @IsString()
  @IsNotEmpty({ message: 'Укажите пользователя' })
  @MaxLength(64)
  userId: string;
}
