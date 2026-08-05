'use client';

import { Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
  // seconds
  timeLimit: number;
  onExpire?: () => void;
}

function format(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function FormTimer({ timeLimit, onExpire }: Props) {
  const [remaining, setRemaining] = useState(timeLimit);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          onExpire?.();
          window.clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
    // Only start once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const critical = remaining <= 60;

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${
        critical ? 'bg-destructive/20 text-destructive' : 'glass-medium text-muted-foreground'
      }`}
    >
      <Clock className="h-3.5 w-3.5" />
      Осталось {format(remaining)}
    </div>
  );
}
