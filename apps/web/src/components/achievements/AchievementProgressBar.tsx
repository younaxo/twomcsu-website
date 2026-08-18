'use client';

import { cn } from '@/lib/utils';

interface AchievementProgressBarProps {
  value: number;
  color?: string;
  className?: string;
  showLabel?: boolean;
  current?: number;
  total?: number;
}

export function AchievementProgressBar({
  value,
  color = '#F57C00',
  className,
  showLabel = false,
  current,
  total,
}: AchievementProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value));

  return (
    <div className={cn('w-full', className)}>
      {showLabel ? (
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>Прогресс</span>
          <span>
            {current !== undefined && total !== undefined
              ? `${current} / ${total}`
              : `${pct.toFixed(0)}%`}
          </span>
        </div>
      ) : null}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
