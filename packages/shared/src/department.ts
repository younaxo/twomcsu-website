export interface Department {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserDepartmentView {
  id: string;
  departmentId: string;
  name: string;
  slug: string;
  color: string | null;
  icon: string | null;
  order: number;
  assignedAt: string;
}

export const MAX_USER_DEPARTMENTS = 3;
