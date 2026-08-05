'use client';

import type { UserDepartmentView } from '@twomc/shared';
import { MAX_USER_DEPARTMENTS } from '@twomc/shared';
import { memo } from 'react';
import { resolveDepartmentIcon } from '@/lib/department-icons';
import { cn } from '@/lib/utils';

interface DepartmentBadgesListProps {
  departments: UserDepartmentView[];
  size?: 'sm' | 'md';
  className?: string;
}

const sizeClasses = {
  sm: 'gap-1 px-1.5 py-0.5 text-[11px]',
  md: 'gap-1.5 px-2 py-0.5 text-xs',
};

const iconSizes = { sm: 12, md: 14 };

function DepartmentBadgesListComponent({
  departments,
  size = 'md',
  className,
}: DepartmentBadgesListProps) {
  const visible = departments.slice(0, MAX_USER_DEPARTMENTS);

  if (visible.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {visible.map((dept) => {
        const Icon = resolveDepartmentIcon(dept.icon);
        const color = dept.color ?? '#94a3b8';

        return (
          <span
            key={dept.id}
            className={cn(
              'inline-flex items-center rounded-full border font-medium leading-none',
              sizeClasses[size],
            )}
            style={{
              color,
              backgroundColor: `${color}1f`,
              borderColor: `${color}4d`,
            }}
          >
            {Icon ? <Icon size={iconSizes[size]} aria-hidden /> : null}
            {dept.name}
          </span>
        );
      })}
    </div>
  );
}

export const DepartmentBadgesList = memo(DepartmentBadgesListComponent);
