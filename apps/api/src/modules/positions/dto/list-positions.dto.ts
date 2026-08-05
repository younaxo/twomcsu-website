import { RoleGroup } from '@twomc/shared';
import { IsEnum, IsOptional } from 'class-validator';

export class ListPositionsDto {
  @IsOptional()
  @IsEnum(RoleGroup)
  group?: RoleGroup;
}
