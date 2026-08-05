'use client';

import type { StoreBundle } from '@twomc/shared';
import { Boxes, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AdminEmptyState } from '@/components/admin';
import { Button } from '@/components/ui/button';
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
import { formatPrice } from '@/lib/store';

export default function AdminStoreBundlesPage() {
  const [items, setItems] = useState<StoreBundle[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<StoreBundle[]>('/store/bundles');
      setItems(data);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось загрузить наборы'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (bundle: StoreBundle) => {
    try {
      await api.patch(`/admin/store/bundles/${bundle.id}`, { isActive: !bundle.isActive });
      toast.success('Обновлено');
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const remove = async (bundle: StoreBundle) => {
    if (!window.confirm(`Удалить «${bundle.name}»?`)) return;
    try {
      await api.delete(`/admin/store/bundles/${bundle.id}`);
      toast.success('Удалено');
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Наборы</h1>
        <p className="text-sm text-muted-foreground">Банды товаров со скидкой</p>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : items.length === 0 ? (
        <AdminEmptyState
          icon={Boxes}
          title="Нет наборов"
          description="Создайте бандл товаров со скидкой"
        />
      ) : (
        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Цена</TableHead>
                <TableHead>Товаров</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((bundle) => (
                <TableRow key={bundle.id}>
                  <TableCell>
                    <p className="font-medium">{bundle.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{bundle.slug}</p>
                  </TableCell>
                  <TableCell>
                    {formatPrice(bundle.totalPrice)}
                    <span className="ml-2 text-xs text-muted-foreground line-through">
                      {formatPrice(bundle.originalPrice)}
                    </span>
                  </TableCell>
                  <TableCell>{bundle.items.length}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="secondary" onClick={() => void toggle(bundle)}>
                      {bundle.isActive ? 'Активен' : 'Скрыт'}
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => void remove(bundle)}>
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
