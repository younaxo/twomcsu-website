import { IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MaxLength(72)
  currentPassword: string;

  @IsString()
  @Length(8, 72, { message: 'Пароль должен быть от 8 символов' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message: 'Пароль должен содержать заглавную букву и цифру',
  })
  newPassword: string;

  @IsOptional()
  @IsString()
  captchaToken?: string;
}
