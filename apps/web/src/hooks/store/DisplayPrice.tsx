'use client';

import { useDisplayPrice } from '@/hooks/store/useDisplayPrice';

/** Renders a RUB amount converted to the user's preferred display currency. */
export function DisplayPrice({ amount }: { amount: number }) {
  return <>{useDisplayPrice(amount)}</>;
}
