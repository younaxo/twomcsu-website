'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  className?: string;
}

export function MetricCard({ label, value, hint, icon: Icon, className }: MetricCardProps) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-4', className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        {Icon ? <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden /> : null}
      </div>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
