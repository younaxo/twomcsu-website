'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface BulkDiscountBadgeProps {
  label: string;
  tip?: string;
  className?: string;
}

export function BulkDiscountBadge({ label, tip, className }: BulkDiscountBadgeProps) {
  const badge = (
    <span
      className={cn(
        'inline-flex rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400',
        className,
      )}
    >
      {label}
    </span>
  );

  if (!tip) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  );
}
