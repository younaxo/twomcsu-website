import { ArrayMaxSize, IsArray, IsString } from 'class-validator';
import { MAX_SHOWCASE_ACHIEVEMENTS } from '@twomc/shared';

export class SetShowcaseDto {
  @IsArray()
  @ArrayMaxSize(MAX_SHOWCASE_ACHIEVEMENTS)
  @IsString({ each: true })
  achievementIds: string[];
}
