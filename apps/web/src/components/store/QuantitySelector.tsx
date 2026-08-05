'use client';

import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number | null;
  disabled?: boolean;
  className?: string;
  /** Hide +/- when quantity is fixed (unique items, maxPerPurchase === 1) */
  hideControls?: boolean;
}

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max,
  disabled,
  className,
  hideControls,
}: QuantitySelectorProps) {
  const locked = hideControls || max === 1;

  const clamp = (next: number) => {
    let n = Math.max(min, next);
    if (max != null) n = Math.min(max, n);
    return n;
  };

  if (locked) {
    return (
      <div className={cn('flex items-center', className)}>
        <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-border px-2 text-sm">
          {value}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8"
        disabled={disabled || value <= min}
        onClick={() => onChange(clamp(value - 1))}
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <Input
        type="number"
        className="h-8 w-14 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        value={value}
        min={min}
        max={max ?? undefined}
        disabled={disabled}
        onChange={(e) => {
          const parsed = Number(e.target.value);
          if (Number.isFinite(parsed)) onChange(clamp(parsed));
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8"
        disabled={disabled || (max != null && value >= max)}
        onClick={() => onChange(clamp(value + 1))}
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
