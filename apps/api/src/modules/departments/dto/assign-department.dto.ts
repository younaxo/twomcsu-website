import { IsString } from 'class-validator';

export class AssignDepartmentDto {
  @IsString()
  departmentId: string;
}
