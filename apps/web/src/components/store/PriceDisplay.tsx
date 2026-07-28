'use client';

import { useCurrencies } from '@/hooks/store/useStoreExtras';
import { useCurrencyPreference } from '@/hooks/store/useCurrencyPreference';
import { cn } from '@/lib/utils';
import { convertFromRub, discountPercent, formatPrice } from '@/lib/store';

interface PriceDisplayProps {
  /** Price in RUB (base store currency) */
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
  const { currency } = useCurrencyPreference('RUB');
  const rates = useCurrencies();
  const rate = rates.data?.find((r) => r.currency === currency);
  const symbol = rate?.symbol;
  const displayPrice = convertFromRub(price, currency, rate?.rate ?? 1);
  const displayOld =
    oldPrice != null ? convertFromRub(oldPrice, currency, rate?.rate ?? 1) : null;
  const discount = discountPercent(price, oldPrice);

  return (
    <div className={cn('flex flex-wrap items-baseline gap-2', className)}>
      <span className={cn('font-semibold text-white', sizeClasses[size])}>
        {formatPrice(displayPrice, currency, symbol)}
      </span>
      {displayOld != null && oldPrice != null && oldPrice > price ? (
        <span className="text-sm text-muted-foreground line-through">
          {formatPrice(displayOld, currency, symbol)}
        </span>
      ) : null}
      {discount ? (
        <span className="rounded bg-primary/15 px-1.5 py-0.5 text-xs font-medium text-primary">
          −{discount}%
        </span>
      ) : null}
    </div>
  );
}
