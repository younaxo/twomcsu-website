'use client';

import type { CurrencyType } from '@twomc/shared';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BulkDiscountBadge } from '@/components/store/BulkDiscountBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useAddToCart } from '@/hooks/store';
import { extractErrorMessage } from '@/lib/api';
import { CURRENCY_BULK_FALLBACK, formatPrice } from '@/lib/store';
import { useStoreUiStore } from '@/stores/storeUiStore';

interface CurrencyBuyFormProps {
  currencyType: CurrencyType;
  /** Units of currency per 1 RUB */
  rate: number;
  productId: string;
  variantId?: string;
}

function bonusForAmount(amount: number): number {
  let bonus = 0;
  for (const tier of CURRENCY_BULK_FALLBACK) {
    if (amount >= tier.minAmount) bonus = tier.bonusPercent;
  }
  return bonus;
}

export function CurrencyBuyForm({
  currencyType,
  rate,
  productId,
  variantId,
}: CurrencyBuyFormProps) {
  const { isAuthenticated } = useAuth();
  const addToCart = useAddToCart();
  const openCartDrawer = useStoreUiStore((s) => s.openCartDrawer);
  const [amount, setAmount] = useState(500);

  const bonus = useMemo(() => bonusForAmount(amount), [amount]);
  const baseUnits = Math.floor(amount * rate);
  const bonusUnits = Math.floor((baseUnits * bonus) / 100);
  const totalUnits = baseUnits + bonusUnits;
  const label = currencyType === 'RUBIES' ? 'рубинов' : 'монет';

  const buy = async () => {
    if (!isAuthenticated) {
      toast.error('Войдите, чтобы купить валюту');
      return;
    }

    try {
      await addToCart.mutateAsync({
        productId,
        variantId,
        quantity: amount,
      });
      toast.success('Добавлено в корзину');
      openCartDrawer();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось добавить в корзину'));
    }
  };

  return (
    <div className="space-y-5 rounded-xl border border-border bg-card p-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="currency-amount">Сумма, ₽</Label>
          <span className="text-sm text-muted-foreground">{formatPrice(amount)}</span>
        </div>
        <Input
          id="currency-amount"
          type="range"
          min={50}
          max={50000}
          step={50}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="h-2 cursor-pointer px-0"
        />
        <Input
          type="number"
          min={50}
          max={50000}
          step={50}
          value={amount}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n)) setAmount(Math.min(50000, Math.max(50, n)));
          }}
        />
      </div>

      <div className="space-y-1 rounded-lg bg-secondary/50 p-4 text-sm">
        <p>
          Получите:{' '}
          <span className="font-semibold text-white">
            {totalUnits.toLocaleString('ru-RU')} {label}
          </span>
        </p>
        {bonus > 0 ? (
          <p className="text-primary">
            Бонус +{bonus}% (+{bonusUnits.toLocaleString('ru-RU')})
          </p>
        ) : (
          <p className="text-muted-foreground">Бонус появится от 500 ₽</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {CURRENCY_BULK_FALLBACK.map((tier) => (
          <BulkDiscountBadge
            key={tier.minAmount}
            label={`от ${tier.minAmount} ₽ +${tier.bonusPercent}%`}
            tip={`При покупке от ${tier.minAmount} ₽ — бонус ${tier.bonusPercent}%`}
            className={amount >= tier.minAmount ? 'ring-1 ring-amber-400/50' : undefined}
          />
        ))}
      </div>

      <Button className="w-full" disabled={addToCart.isPending} onClick={() => void buy()}>
        Купить за {formatPrice(amount)}
      </Button>
    </div>
  );
}
