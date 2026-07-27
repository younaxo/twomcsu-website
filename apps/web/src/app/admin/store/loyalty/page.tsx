'use client';

import type { LoyaltyDiscount } from '@twomc/shared';
import { Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
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
import { api, extractErrorMessage } from '@/lib/api';

export default function AdminLoyaltyPage() {
  const [items, setItems] = useState<LoyaltyDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [minPurchases, setMinPurchases] = useState('5');
  const [discountPercent, setDiscountPercent] = useState('5');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<LoyaltyDiscount[]>('/store/discounts/loyalty');
      setItems(data);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось загрузить уровни'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    try {
      await api.post('/admin/store/discounts/loyalty', {
        name: name.trim() || `Уровень ${minPurchases}`,
        minPurchases: Number(minPurchases),
        discountPercent: Number(discountPercent),
      });
      toast.success('Создано');
      setName('');
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Удалить уровень?')) return;
    try {
      await api.delete(`/admin/store/discounts/loyalty/${id}`);
      toast.success('Удалено');
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Лояльность</h1>
        <p className="text-sm text-muted-foreground">Скидки за количество покупок</p>
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-4">
        <div className="space-y-1">
          <Label>Название</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Мин. покупок</Label>
          <Input value={minPurchases} onChange={(e) => setMinPurchases(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Скидка %</Label>
          <Input
            value={discountPercent}
            onChange={(e) => setDiscountPercent(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <Button onClick={() => void create()}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить
          </Button>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Покупок</TableHead>
                <TableHead>Скидка</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <p className="font-medium">{row.name}</p>
                    {row.description ? (
                      <p className="text-xs text-muted-foreground">{row.description}</p>
                    ) : null}
                  </TableCell>
                  <TableCell>от {row.minPurchases}</TableCell>
                  <TableCell>{row.discountPercent}%</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => void remove(row.id)}>
                      <Trash2 className="h-4 w-4" />
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
