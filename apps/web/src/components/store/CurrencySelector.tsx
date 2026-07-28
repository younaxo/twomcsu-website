'use client';

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

interface CurrencySelectorProps {
  className?: string;
}

export function CurrencySelector({ className }: CurrencySelectorProps) {
  const rates = useCurrencies();
  const { currency, setCurrency, ready } = useCurrencyPreference('RUB');

  if (!ready || rates.isLoading) {
    return <Skeleton className="h-9 w-28" />;
  }

  const items = rates.data ?? [];
  const hasRub = items.some((r) => r.currency === 'RUB');
  const options = hasRub
    ? items
    : [{ id: 'rub', currency: 'RUB', rate: 1, symbol: '₽', flag: '🇷🇺', isActive: true, updatedAt: '' }, ...items];

  return (
    <Select value={currency} onValueChange={setCurrency}>
      <SelectTrigger className={className ?? 'w-36'}>
        <SelectValue placeholder="Валюта" />
      </SelectTrigger>
      <SelectContent>
        {options
          .filter((r) => r.isActive !== false)
          .map((rate) => (
            <SelectItem key={rate.currency} value={rate.currency}>
              {rate.flag ? `${rate.flag} ` : ''}
              {rate.currency} ({rate.symbol})
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}
