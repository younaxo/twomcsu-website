'use client';

import type { UserDepartmentView } from '@twomc/shared';
import { MAX_USER_DEPARTMENTS } from '@twomc/shared';
import { memo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { resolveDepartmentIcon } from '@/lib/department-icons';
import { cn } from '@/lib/utils';

interface DepartmentIconsProps {
  departments: UserDepartmentView[];
  size?: number;
  className?: string;
}

function DepartmentIconsComponent({ departments, size = 14, className }: DepartmentIconsProps) {
  const visible = departments.slice(0, MAX_USER_DEPARTMENTS);

  if (visible.length === 0) return null;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {visible.map((dept) => {
        const Icon = resolveDepartmentIcon(dept.icon);
        if (!Icon) return null;

        return (
          <Tooltip key={dept.id} delayDuration={200}>
            <TooltipTrigger asChild>
              <span
                className="inline-flex cursor-default items-center justify-center rounded-sm"
                style={{ color: dept.color ?? undefined }}
              >
                <Icon size={size} aria-label={dept.name} />
              </span>
            </TooltipTrigger>
            <TooltipContent>{dept.name}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

export const DepartmentIcons = memo(DepartmentIconsComponent);
