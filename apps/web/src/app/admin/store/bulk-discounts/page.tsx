'use client';

import type { BulkDiscount, ProductType } from '@twomc/shared';
import { Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api, extractErrorMessage } from '@/lib/api';
import { PRODUCT_TYPE_LABELS } from '@/lib/store';

export default function AdminBulkDiscountsPage() {
  const [items, setItems] = useState<BulkDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [productType, setProductType] = useState<ProductType>('KEY');
  const [minQuantity, setMinQuantity] = useState('10');
  const [discountValue, setDiscountValue] = useState('10');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<BulkDiscount[]>('/store/discounts/bulk');
      setItems(data);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось загрузить скидки'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    try {
      await api.post('/admin/store/discounts/bulk', {
        productType,
        minQuantity: Number(minQuantity) || 0,
        discountType: 'PERCENT',
        discountValue: Number(discountValue),
      });
      toast.success('Создано');
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Удалить скидку?')) return;
    try {
      await api.delete(`/admin/store/discounts/bulk/${id}`);
      toast.success('Удалено');
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Оптовые скидки</h1>
        <p className="text-sm text-muted-foreground">Скидки и бонусы за объём</p>
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-4">
        <div className="space-y-1">
          <Label>Тип товара</Label>
          <Select value={productType} onValueChange={(v) => setProductType(v as ProductType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(['KEY', 'CURRENCY', 'PRIVILEGE'] as ProductType[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {PRODUCT_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Мин. кол-во</Label>
          <Input value={minQuantity} onChange={(e) => setMinQuantity(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Скидка %</Label>
          <Input value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
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
                <TableHead>Тип</TableHead>
                <TableHead>Мин. кол-во</TableHead>
                <TableHead>Мин. сумма</TableHead>
                <TableHead>Скидка</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    {row.productType ? PRODUCT_TYPE_LABELS[row.productType] : '—'}
                  </TableCell>
                  <TableCell>{row.minQuantity}</TableCell>
                  <TableCell>{row.minAmount ?? '—'}</TableCell>
                  <TableCell>
                    {row.discountType} {row.discountValue}
                  </TableCell>
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
