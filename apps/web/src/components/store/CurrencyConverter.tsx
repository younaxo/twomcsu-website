'use client';

import type {
  CurrencyType,
  ExchangeCurrency,
  GameCurrencyRates,
} from '@twomc/shared';
import { ArrowRightLeft } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useAddToCart, useCurrencyRates, useExchangeCurrency } from '@/hooks/store';
import { extractErrorMessage } from '@/lib/api';
import { formatPrice } from '@/lib/store';
import { useStoreUiStore } from '@/stores/storeUiStore';

const QUICK_AMOUNTS = [100, 500, 1000, 3000, 5000] as const;

const EXCHANGE_LABELS: Record<ExchangeCurrency, string> = {
  RUBIES: 'Рубины',
  COINS: 'Монеты',
  BP_XP: 'XP БП',
};

interface CurrencyConverterProps {
  rubiesProductId?: string;
  rubiesVariantId?: string;
  coinsProductId?: string;
  coinsVariantId?: string;
}

function bonusForAmount(
  amount: number,
  tiers: GameCurrencyRates['bulkDiscounts'],
): number {
  let bonus = 0;
  for (const tier of tiers) {
    if (amount >= tier.minAmount) bonus = tier.bonusPercent;
  }
  return bonus;
}

function calcExchange(
  rates: GameCurrencyRates,
  from: ExchangeCurrency,
  to: ExchangeCurrency,
  amount: number,
): number {
  if (from === to || amount <= 0) return 0;
  if (from === 'RUBIES' && to === 'COINS') return Math.floor(amount * rates.exchange.rubies_to_coins);
  if (from === 'RUBIES' && to === 'BP_XP') return Math.floor(amount * rates.exchange.rubies_to_bp_xp);
  if (from === 'COINS' && to === 'RUBIES') {
    return Math.floor(amount / rates.exchange.rubies_to_coins);
  }
  if (from === 'BP_XP' && to === 'RUBIES') {
    return Math.floor(amount / rates.exchange.rubies_to_bp_xp);
  }
  return 0;
}

export function CurrencyConverter({
  rubiesProductId,
  rubiesVariantId,
  coinsProductId,
  coinsVariantId,
}: CurrencyConverterProps) {
  const { isAuthenticated } = useAuth();
  const ratesQuery = useCurrencyRates();
  const addToCart = useAddToCart();
  const exchange = useExchangeCurrency();
  const openCartDrawer = useStoreUiStore((s) => s.openCartDrawer);

  const [amount, setAmount] = useState(500);
  const [buyType, setBuyType] = useState<CurrencyType>('RUBIES');
  const [fromCurrency, setFromCurrency] = useState<ExchangeCurrency>('RUBIES');
  const [toCurrency, setToCurrency] = useState<ExchangeCurrency>('COINS');
  const [exchangeAmount, setExchangeAmount] = useState(1000);

  const rates = ratesQuery.data;

  const bonus = useMemo(
    () => (rates ? bonusForAmount(amount, rates.bulkDiscounts) : 0),
    [amount, rates],
  );

  const purchaseRate =
    buyType === 'RUBIES' ? (rates?.purchase.rubies.rate ?? 2) : (rates?.purchase.coins.rate ?? 8);
  const purchaseSymbol =
    buyType === 'RUBIES'
      ? (rates?.purchase.rubies.symbol ?? '💎')
      : (rates?.purchase.coins.symbol ?? '🪙');
  const baseUnits = Math.floor(amount * purchaseRate);
  const bonusUnits = Math.floor((baseUnits * bonus) / 100);
  const totalUnits = baseUnits + bonusUnits;
  const buyLabel = buyType === 'RUBIES' ? 'рубинов' : 'монет';

  const resultAmount = useMemo(
    () => (rates ? calcExchange(rates, fromCurrency, toCurrency, exchangeAmount) : 0),
    [rates, fromCurrency, toCurrency, exchangeAmount],
  );

  const buy = async () => {
    if (!isAuthenticated) {
      toast.error('Войдите, чтобы купить валюту');
      return;
    }

    const productId = buyType === 'RUBIES' ? rubiesProductId : coinsProductId;
    const variantId = buyType === 'RUBIES' ? rubiesVariantId : coinsVariantId;

    if (!productId) {
      toast.error('Товар валюты пока недоступен');
      return;
    }

    try {
      await addToCart.mutateAsync({ productId, variantId, quantity: amount });
      toast.success('Добавлено в корзину');
      openCartDrawer();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось добавить в корзину'));
    }
  };

  const doExchange = async () => {
    if (!isAuthenticated) {
      toast.error('Обмен доступен только для авторизованных пользователей');
      return;
    }

    try {
      const data = await exchange.mutateAsync({
        fromCurrency,
        toCurrency,
        amount: exchangeAmount,
      });
      if (!data.success) {
        toast.error(data.message ?? 'Обмен не выполнен');
        return;
      }
      toast.success(data.message ?? `Получено: ${data.resultAmount}`);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось обменять валюту'));
    }
  };

  if (ratesQuery.isLoading || !rates) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Рубины</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-white">
              1₽ = {rates.purchase.rubies.rate} {rates.purchase.rubies.symbol}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Монеты</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-white">
              1₽ = {rates.purchase.coins.rate} {rates.purchase.coins.symbol}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Обмен</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-white">
              1 💎 = {rates.exchange.rubies_to_coins} 🪙
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">XP боевого пропуска</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-white">
              1 💎 = {rates.exchange.rubies_to_bp_xp} XP
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          <h3 className="text-lg font-semibold text-white">Купить валюту за рубли</h3>

          <Tabs value={buyType} onValueChange={(v) => setBuyType(v as CurrencyType)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="RUBIES">💎 Рубины</TabsTrigger>
              <TabsTrigger value="COINS">🪙 Монеты</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="converter-amount">Сумма, ₽</Label>
              <span className="text-sm text-muted-foreground">{formatPrice(amount)}</span>
            </div>
            <Input
              id="converter-amount"
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

          <div className="flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((value) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={amount === value ? 'default' : 'outline'}
                onClick={() => setAmount(value)}
              >
                {value}₽
              </Button>
            ))}
          </div>

          <div className="rounded-lg bg-secondary/50 p-4 text-sm">
            <p>
              Вы получите:{' '}
              <span className="font-semibold text-white">
                {totalUnits.toLocaleString('ru-RU')} {buyLabel} {purchaseSymbol}
              </span>
              {bonus > 0 ? (
                <span className="text-primary"> (+{bonus}% бонус)</span>
              ) : null}
            </p>
            {bonus === 0 ? (
              <p className="mt-1 text-muted-foreground">Бонус появится от 500 ₽</p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {rates.bulkDiscounts.map((tier) => (
              <span
                key={tier.minAmount}
                className={
                  amount >= tier.minAmount
                    ? 'rounded-md border border-amber-400/40 px-2 py-1 text-amber-200'
                    : 'rounded-md border border-border px-2 py-1'
                }
              >
                от {tier.minAmount}₽ +{tier.bonusPercent}%
              </span>
            ))}
          </div>

          <Button className="w-full" disabled={addToCart.isPending} onClick={() => void buy()}>
            Купить
          </Button>
        </div>

        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-white">Конвертер игровых валют</h3>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
            <div className="space-y-2">
              <Label>Из</Label>
              <Select
                value={fromCurrency}
                onValueChange={(v) => setFromCurrency(v as ExchangeCurrency)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(EXCHANGE_LABELS) as ExchangeCurrency[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {EXCHANGE_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                min={1}
                value={exchangeAmount}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isFinite(n)) setExchangeAmount(Math.max(1, Math.floor(n)));
                }}
              />
            </div>

            <div className="flex justify-center pb-2 text-muted-foreground">→</div>

            <div className="space-y-2">
              <Label>В</Label>
              <Select
                value={toCurrency}
                onValueChange={(v) => setToCurrency(v as ExchangeCurrency)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(EXCHANGE_LABELS) as ExchangeCurrency[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {EXCHANGE_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="number" readOnly value={resultAmount} className="bg-secondary/40" />
            </div>
          </div>

          <div className="space-y-1 rounded-lg bg-secondary/50 p-3 text-sm text-muted-foreground">
            <p>1 рубин = {rates.exchange.rubies_to_coins} монеты</p>
            <p>1 рубин = {rates.exchange.rubies_to_bp_xp} XP БП</p>
          </div>

          <Button
            className="w-full"
            variant="secondary"
            disabled={exchange.isPending || resultAmount <= 0}
            onClick={() => void doExchange()}
          >
            Обменять
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Обмен доступен только для авторизованных пользователей
          </p>
        </div>
      </div>
    </div>
  );
}
