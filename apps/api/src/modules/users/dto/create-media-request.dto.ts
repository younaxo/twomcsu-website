import { MediaGroup } from '@twomc/shared';
import { IsEnum, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateMediaRequestDto {
  @IsEnum(MediaGroup)
  mediaGroup: MediaGroup;

  @IsUrl({ require_protocol: true }, { message: 'Укажите полный URL канала' })
  @MaxLength(500)
  channelUrl: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
