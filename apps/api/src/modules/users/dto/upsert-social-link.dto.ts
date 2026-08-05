import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpsertSocialLinkDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  value: string;
}
