'use client';

import type { CurrencyRate } from '@twomc/shared';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Coins } from 'lucide-react';
import { api, extractErrorMessage } from '@/lib/api';

export default function AdminCurrenciesPage() {
  const [items, setItems] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('');
  const [rate, setRate] = useState('1');
  const [symbol, setSymbol] = useState('');
  const [flag, setFlag] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<CurrencyRate[]>('/admin/store/currencies');
      setItems(data);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось загрузить валюты'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    if (!currency.trim() || !symbol.trim()) return;
    try {
      await api.post('/admin/store/currencies', {
        currency: currency.trim().toUpperCase(),
        rate: Number(rate),
        symbol: symbol.trim(),
        flag: flag.trim() || undefined,
      });
      toast.success('Валюта добавлена');
      setCurrency('');
      setRate('1');
      setSymbol('');
      setFlag('');
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const toggle = async (item: CurrencyRate) => {
    try {
      await api.patch(`/admin/store/currencies/${item.id}`, { isActive: !item.isActive });
      toast.success(item.isActive ? 'Отключена' : 'Включена');
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const filtered = items.filter((i) =>
    `${i.currency} ${i.symbol}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Валюты отображения</h1>
        <p className="text-sm text-muted-foreground">Курсы для селектора в магазине</p>
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
        <div className="space-y-1">
          <Label>Код</Label>
          <Input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="USD" />
        </div>
        <div className="space-y-1">
          <Label>Курс к ₽</Label>
          <Input value={rate} onChange={(e) => setRate(e.target.value)} type="number" step="0.0001" />
        </div>
        <div className="space-y-1">
          <Label>Символ</Label>
          <Input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="$" />
        </div>
        <div className="space-y-1">
          <Label>Флаг</Label>
          <Input value={flag} onChange={(e) => setFlag(e.target.value)} placeholder="🇺🇸" />
        </div>
        <div className="flex items-end">
          <Button onClick={() => void create()}>Добавить</Button>
        </div>
      </div>

      <Input
        placeholder="Поиск…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Coins} title="Нет валют" description="Добавьте курс выше" />
      ) : (
        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Валюта</TableHead>
                <TableHead>Курс</TableHead>
                <TableHead>Символ</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.flag} {item.currency}
                  </TableCell>
                  <TableCell>{item.rate}</TableCell>
                  <TableCell>{item.symbol}</TableCell>
                  <TableCell>{item.isActive ? 'Активна' : 'Выкл'}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => void toggle(item)}>
                      {item.isActive ? 'Выкл' : 'Вкл'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
