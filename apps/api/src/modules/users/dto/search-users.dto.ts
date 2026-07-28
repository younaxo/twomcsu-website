import { IsString, Length } from 'class-validator';

export class SearchUsersDto {
  @IsString()
  @Length(1, 16)
  q: string;
}
