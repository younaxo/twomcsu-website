import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsString, Min, ValidateNested } from 'class-validator';

class DepartmentOrderItem {
  @IsString()
  departmentId: string;

  @IsInt()
  @Min(0)
  order: number;
}

export class ReorderDepartmentsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DepartmentOrderItem)
  orders: DepartmentOrderItem[];
}
