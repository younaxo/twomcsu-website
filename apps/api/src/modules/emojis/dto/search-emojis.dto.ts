import { IsOptional, IsString, Length } from 'class-validator';
import { MAX_SEARCH_LENGTH } from '../../../common/pagination';

export class SearchEmojisDto {
  @IsOptional()
  @IsString()
  @Length(1, MAX_SEARCH_LENGTH)
  q?: string;
}
