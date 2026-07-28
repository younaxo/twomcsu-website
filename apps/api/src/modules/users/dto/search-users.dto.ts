import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { MAX_SEARCH_LENGTH } from '../../../common/pagination';

export class SearchUsersDto {
  @IsString()
  @Length(1, MAX_SEARCH_LENGTH)
  q: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  limit?: number;
}
