import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Укажите email или никнейм' })
  @MaxLength(254)
  emailOrUsername: string;

  @IsString()
  @IsNotEmpty({ message: 'Укажите пароль' })
  @MaxLength(72)
  password: string;

  @IsOptional()
  @IsString()
  captchaToken?: string;
}
