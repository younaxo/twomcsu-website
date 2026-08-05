'use client';

import { Coins } from 'lucide-react';
import { useCurrencies } from '@/hooks/store/useStoreExtras';
import { useCurrencyPreference } from '@/hooks/store/useCurrencyPreference';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface CurrencySelectorProps {
  className?: string;
  compact?: boolean;
}

export function CurrencySelector({ className, compact }: CurrencySelectorProps) {
  const rates = useCurrencies();
  const { currency, setCurrency, ready } = useCurrencyPreference('RUB');

  if (!ready || rates.isLoading) {
    return <Skeleton className={cn('h-9', compact ? 'w-full' : 'w-28')} />;
  }

  const items = rates.data ?? [];
  const hasRub = items.some((r) => r.currency === 'RUB');
  const options = hasRub
    ? items
    : [
        {
          id: 'rub',
          currency: 'RUB',
          rate: 1,
          symbol: '₽',
          flag: '🇷🇺',
          isActive: true,
          updatedAt: '',
        },
        ...items,
      ];

  const current = options.find((r) => r.currency === currency);

  return (
    <Select value={currency} onValueChange={setCurrency}>
      <SelectTrigger
        className={cn(
          'glass-light border-white/10',
          compact ? 'h-10 w-full' : 'w-36',
          className,
        )}
      >
        {compact ? (
          <span className="flex items-center gap-2 truncate text-sm">
            <Coins className="h-4 w-4 shrink-0 text-primary" />
            <span>
              {current?.flag ? `${current.flag} ` : ''}
              {currency}
            </span>
          </span>
        ) : (
          <SelectValue placeholder="Валюта" />
        )}
      </SelectTrigger>
      <SelectContent className="glass-strong">
        {options
          .filter((r) => r.isActive !== false)
          .map((rate) => (
            <SelectItem
              key={rate.currency}
              value={rate.currency}
              className={cn(rate.currency === currency && 'text-primary')}
            >
              {rate.flag ? `${rate.flag} ` : ''}
              {rate.currency} ({rate.symbol})
              {rate.currency !== 'RUB' ? ` · ${rate.rate}` : ''}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}
