'use client';

import { Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface OnlineCounterProps {
  value: number;
  label?: string;
  className?: string;
  size?: 'sm' | 'lg';
}

export function OnlineCounter({
  value,
  label = 'игроков онлайн',
  className,
  size = 'lg',
}: OnlineCounterProps) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const from = display;
    const to = value;
    if (from === to) return;

    const duration = 600;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- animate from last displayed value
  }, [value]);

  return (
    <div
      className={cn(
        'flex items-center gap-3',
        size === 'lg' && 'gap-4',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary',
          size === 'lg' ? 'h-14 w-14' : 'h-10 w-10',
        )}
      >
        <Users className={size === 'lg' ? 'h-7 w-7' : 'h-5 w-5'} />
      </div>
      <div>
        <p
          className={cn(
            'font-semibold tabular-nums text-white transition-colors',
            size === 'lg' ? 'text-4xl sm:text-5xl' : 'text-2xl',
          )}
        >
          {display.toLocaleString('ru-RU')}
        </p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
