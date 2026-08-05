import {
  Code,
  Crown,
  Megaphone,
  Shield,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

const DEPARTMENT_ICONS: Record<string, LucideIcon> = {
  Wrench,
  Megaphone,
  Shield,
  Code,
  Crown,
};

export function resolveDepartmentIcon(name: string | null | undefined): LucideIcon | null {
  if (!name) return null;
  return DEPARTMENT_ICONS[name] ?? null;
}

export const DEPARTMENT_ICON_OPTIONS = Object.keys(DEPARTMENT_ICONS);
