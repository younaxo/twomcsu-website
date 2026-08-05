'use client';

import { cn } from '@/lib/utils';

interface ServerStatusBadgeProps {
  online: boolean;
  playerCount?: number;
  className?: string;
  showCount?: boolean;
}

export function ServerStatusBadge({
  online,
  playerCount,
  className,
  showCount = true,
}: ServerStatusBadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-sm', className)}>
      <span
        className={cn(
          'relative flex h-2.5 w-2.5',
          online && 'after:absolute after:inset-0 after:animate-ping after:rounded-full after:bg-emerald-400/60',
        )}
        aria-hidden
      >
        <span
          className={cn(
            'relative h-2.5 w-2.5 rounded-full',
            online ? 'bg-emerald-400' : 'bg-red-500',
          )}
        />
      </span>
      <span className={online ? 'text-emerald-400' : 'text-red-400'}>
        {online ? 'Онлайн' : 'Оффлайн'}
      </span>
      {showCount && online && typeof playerCount === 'number' ? (
        <span className="text-muted-foreground">{playerCount}</span>
      ) : null}
    </span>
  );
}
