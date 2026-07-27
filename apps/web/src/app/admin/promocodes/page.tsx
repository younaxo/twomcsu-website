'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
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

interface PromoAdminRow {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  isActive: boolean;
  usedCount?: number;
  maxUses?: number | null;
}

export default function AdminPromocodesPage() {
  const [items, setItems] = useState<PromoAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [discountValue, setDiscountValue] = useState('10');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<PromoAdminRow[]>('/admin/promocodes');
      setItems(data);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось загрузить промокоды'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    if (!code.trim()) return;
    try {
      await api.post('/admin/promocodes', {
        code: code.trim().toUpperCase(),
        discountType: 'PERCENT',
        discountValue: Number(discountValue),
      });
      toast.success('Промокод создан');
      setCode('');
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const toggle = async (row: PromoAdminRow) => {
    try {
      await api.patch(`/admin/promocodes/${row.id}`, { isActive: !row.isActive });
      toast.success('Обновлено');
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const remove = async (row: PromoAdminRow) => {
    if (!window.confirm(`Удалить ${row.code}?`)) return;
    try {
      await api.delete(`/admin/promocodes/${row.id}`);
      toast.success('Удалено');
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Промокоды</h1>
        <p className="text-sm text-muted-foreground">Скидки на заказы</p>
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-3">
        <div className="space-y-1">
          <Label>Код</Label>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="WELCOME10"
          />
        </div>
        <div className="space-y-1">
          <Label>Скидка %</Label>
          <Input value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
        </div>
        <div className="flex items-end">
          <Button onClick={() => void create()}>
            <Plus className="mr-2 h-4 w-4" />
            Создать
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
                <TableHead>Код</TableHead>
                <TableHead>Скидка</TableHead>
                <TableHead>Использований</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono font-medium">{row.code}</TableCell>
                  <TableCell>
                    {row.discountType} {row.discountValue}
                  </TableCell>
                  <TableCell>
                    {row.usedCount ?? 0}
                    {row.maxUses != null ? ` / ${row.maxUses}` : ''}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="secondary" onClick={() => void toggle(row)}>
                      {row.isActive ? (
                        <Badge className="pointer-events-none">Активен</Badge>
                      ) : (
                        'Выкл'
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => void remove(row)}>
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
