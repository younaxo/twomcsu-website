import { IsOptional, IsString, ValidateIf } from 'class-validator';

export class SetDisplayBadgeDto {
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  badgeId: string | null;
}
