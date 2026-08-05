import { IsNotEmpty, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Ссылка для сброса недействительна' })
  @MaxLength(128)
  token: string;

  @IsString()
  @Length(8, 72, { message: 'Пароль должен быть от 8 символов' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message: 'Пароль должен содержать заглавную букву и цифру',
  })
  newPassword: string;

  // required in prod, ignored when HCAPTCHA_DISABLED=true
  @IsOptional()
  @IsString()
  captchaToken?: string;
}
