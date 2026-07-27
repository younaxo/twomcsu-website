'use client';

import type { CurrencyType } from '@twomc/shared';
import { useMemo, useState } from 'react';
import { CurrencyBuyForm } from '@/components/store/CurrencyBuyForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useBulkDiscounts, useProducts } from '@/hooks/store';
import { CURRENCY_BULK_FALLBACK, formatPrice } from '@/lib/store';

export default function CurrencyPage() {
  const [tab, setTab] = useState<CurrencyType>('RUBIES');
  const products = useProducts({ type: 'CURRENCY', limit: 20 });
  const bulk = useBulkDiscounts();

  const rubies = products.data?.items.find((p) => p.currencyType === 'RUBIES');
  const coins = products.data?.items.find((p) => p.currencyType === 'COINS');
  const current = tab === 'RUBIES' ? rubies : coins;

  const currencyTiers = useMemo(() => {
    const fromApi = (bulk.data ?? []).filter(
      (d) => d.productType === 'CURRENCY' && d.discountType === 'BONUS' && d.minAmount,
    );
    if (fromApi.length > 0) {
      return fromApi
        .map((d) => ({ minAmount: d.minAmount!, bonusPercent: d.discountValue }))
        .sort((a, b) => a.minAmount - b.minAmount);
    }
    return CURRENCY_BULK_FALLBACK.map((t) => ({
      minAmount: t.minAmount,
      bonusPercent: t.bonusPercent,
    }));
  }, [bulk.data]);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-white">Покупка валюты</h1>
        <p className="mt-2 text-muted-foreground">
          Рубины — для сайта и игры. Монеты — только на сервере.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as CurrencyType)}>
        <TabsList>
          <TabsTrigger value="RUBIES">Рубины</TabsTrigger>
          <TabsTrigger value="COINS">Монеты</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-6 space-y-6">
          {products.isLoading || !current ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <CurrencyBuyForm
              currencyType={tab}
              rate={current.currencyAmount ?? 1}
              productId={current.id}
              variantId={current.variants[0]?.id}
            />
          )}

          <div className="rounded-xl border border-border">
            <div className="border-b border-border px-4 py-3 text-sm font-medium">
              Оптовые бонусы
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Сумма от</TableHead>
                  <TableHead>Бонус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currencyTiers.map((tier) => (
                  <TableRow key={tier.minAmount}>
                    <TableCell>{formatPrice(tier.minAmount)}</TableCell>
                    <TableCell className="text-primary">+{tier.bonusPercent}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="rounded-xl border border-border bg-card/50 p-4 text-sm text-muted-foreground">
            {tab === 'RUBIES' ? (
              <p>
                Рубины используются на сайте и в игре. Начисление после оплаты заказа.
              </p>
            ) : (
              <p>Монеты начисляются только на игровой сервер после оплаты.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
