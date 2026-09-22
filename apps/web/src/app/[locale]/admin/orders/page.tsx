'use client';

import type { OrderStatus, OrdersResponse, StoreOrder } from '@twomc/shared';
import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { AdminEmptyState } from '@/components/admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { formatPrice, ORDER_STATUS_LABELS } from '@/lib/store';

const STATUSES: Array<OrderStatus | 'ALL'> = [
  'ALL',
  'PENDING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'REFUNDED',
];

export default function AdminOrdersPage() {
  const [items, setItems] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<OrderStatus | 'ALL'>('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<OrdersResponse>('/admin/orders', {
        params: {
          page,
          limit: 30,
          status: status === 'ALL' ? undefined : status,
        },
      });
      setItems(data.items);
      setTotalPages(data.totalPages);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось загрузить заказы'));
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const cancel = async (order: StoreOrder) => {
    if (!window.confirm(`Отменить ${order.orderNumber}?`)) return;
    try {
      await api.patch(`/admin/orders/${order.id}/cancel`, { reason: 'Отменено админом' });
      toast.success('Отменён');
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const refund = async (order: StoreOrder) => {
    if (!window.confirm(`Вернуть ${order.orderNumber}?`)) return;
    try {
      await api.patch(`/admin/orders/${order.id}/refund`, { reason: 'Возврат' });
      toast.success('Возврат оформлен');
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Заказы</h1>
          <p className="text-sm text-muted-foreground">Все заказы магазина</p>
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as OrderStatus | 'ALL');
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s === 'ALL' ? 'Все статусы' : ORDER_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : items.length === 0 ? (
        <AdminEmptyState
          icon={ShoppingBag}
          title="Нет заказов"
          description="Заказы с выбранным статусом не найдены"
        />
      ) : (
        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Номер</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">{order.orderNumber}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(order.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {ORDER_STATUS_LABELS[order.status] ?? order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatPrice(order.total)}</TableCell>
                  <TableCell className="space-x-1 text-right">
                    {order.status === 'PENDING' || order.status === 'COMPLETED' ? (
                      <Button size="sm" variant="outline" onClick={() => void cancel(order)}>
                        Отменить
                      </Button>
                    ) : null}
                    {order.status === 'COMPLETED' ? (
                      <Button size="sm" variant="secondary" onClick={() => void refund(order)}>
                        Возврат
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Назад
          </Button>
          <span className="self-center text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Далее
          </Button>
        </div>
      ) : null}
    </div>
  );
}
