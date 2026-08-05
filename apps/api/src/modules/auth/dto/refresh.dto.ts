import { IsOptional, IsString } from 'class-validator';

/** Cookie is the main transport, body is a fallback for non browser clients */
export class RefreshDto {
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
