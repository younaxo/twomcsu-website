'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] px-6 py-14 text-center',
        className,
      )}
    >
      {Icon ? (
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.05]">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </span>
      ) : null}
      <div className="space-y-1">
        <p className="text-lg font-medium text-white">{title}</p>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
