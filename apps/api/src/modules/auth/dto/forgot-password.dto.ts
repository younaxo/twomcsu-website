import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Некорректный email' })
  @MaxLength(254)
  email: string;

  // required in prod, ignored when HCAPTCHA_DISABLED=true
  @IsOptional()
  @IsString()
  captchaToken?: string;
}
