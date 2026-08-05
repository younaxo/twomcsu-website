import { IsString, MaxLength, MinLength } from 'class-validator';

export class SetBannerPresetDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  presetId: string;
}
