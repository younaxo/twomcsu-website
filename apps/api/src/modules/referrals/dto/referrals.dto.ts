import { IsInt, Max, Min } from 'class-validator';

export class UpdateMediaRankDto {
  @IsInt()
  @Min(1)
  @Max(4)
  rank: number;
}
