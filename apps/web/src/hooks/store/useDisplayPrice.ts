'use client';

import { useCurrencies } from '@/hooks/store/useStoreExtras';
import { useCurrencyPreference } from '@/hooks/store/useCurrencyPreference';
import { convertFromRub, formatPrice } from '@/lib/store';

/** Format a RUB amount using the user's display currency preference. */
export function useDisplayPrice(amountRub: number): string {
  const { currency } = useCurrencyPreference('RUB');
  const rates = useCurrencies();
  const rate = rates.data?.find((r) => r.currency === currency);
  const display = convertFromRub(amountRub, currency, rate?.rate ?? 1);
  return formatPrice(display, currency, rate?.symbol);
}
