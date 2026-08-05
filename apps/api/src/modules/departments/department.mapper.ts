import { Department as DepartmentRow, Prisma } from '@prisma/client';
import { Department, UserDepartmentView } from '@twomc/shared';

type UserDepartmentWithDepartment = Prisma.UserDepartmentGetPayload<{
  include: {
    department: {
      select: {
        id: true;
        name: true;
        slug: true;
        color: true;
        icon: true;
      };
    };
  };
}>;

export function toDepartment(row: DepartmentRow): Department {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    color: row.color,
    icon: row.icon,
    isActive: row.isActive,
    order: row.order,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toUserDepartmentView(row: UserDepartmentWithDepartment): UserDepartmentView {
  return {
    id: row.id,
    departmentId: row.department.id,
    name: row.department.name,
    slug: row.department.slug,
    color: row.department.color,
    icon: row.department.icon,
    order: row.order,
    assignedAt: row.assignedAt.toISOString(),
  };
}
