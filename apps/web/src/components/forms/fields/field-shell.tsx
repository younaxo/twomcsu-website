'use client';

import type { FormFieldDto } from '@twomc/shared';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FieldShellProps {
  field: FormFieldDto;
  children: ReactNode;
  className?: string;
}

/** Common wrapper for renderer fields: label, description, required mark, error slot */
export function FieldShell({ field, children, className }: FieldShellProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="space-y-1">
        <label className="text-sm font-medium text-white">
          {field.label}
          {field.isRequired ? <span className="ml-1 text-[#F57C00]">*</span> : null}
        </label>
        {field.description ? (
          <p className="text-xs text-muted-foreground">{field.description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
