import { IsEmail, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Некорректный email' })
  @MaxLength(254)
  email: string;

  @IsString()
  @Length(3, 16, { message: 'Никнейм должен быть от 3 до 16 символов' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Никнейм может содержать только латиницу, цифры и _' })
  username: string;

  @IsString()
  @Length(8, 72, { message: 'Пароль должен быть от 8 символов' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message: 'Пароль должен содержать заглавную букву и цифру',
  })
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(32, { message: 'Промокод до 32 символов' })
  @Matches(/^[A-Za-z0-9_-]+$/, { message: 'Промокод: латиница, цифры, дефис и _' })
  promoCode?: string;

  // required in prod, ignored when HCAPTCHA_DISABLED=true
  @IsOptional()
  @IsString()
  captchaToken?: string;
}
