'use client';

import { cn } from '@/lib/utils';
import { discountPercent, formatPrice } from '@/lib/store';

interface PriceDisplayProps {
  price: number;
  oldPrice?: number | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-2xl',
};

export function PriceDisplay({ price, oldPrice, className, size = 'md' }: PriceDisplayProps) {
  const discount = discountPercent(price, oldPrice);

  return (
    <div className={cn('flex flex-wrap items-baseline gap-2', className)}>
      <span className={cn('font-semibold text-white', sizeClasses[size])}>{formatPrice(price)}</span>
      {oldPrice && oldPrice > price ? (
        <span className="text-sm text-muted-foreground line-through">{formatPrice(oldPrice)}</span>
      ) : null}
      {discount ? (
        <span className="rounded bg-primary/15 px-1.5 py-0.5 text-xs font-medium text-primary">
          −{discount}%
        </span>
      ) : null}
    </div>
  );
}
