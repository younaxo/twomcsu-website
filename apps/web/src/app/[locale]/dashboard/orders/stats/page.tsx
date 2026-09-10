'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api, extractErrorMessage } from '@/lib/api';
import { formatPrice } from '@/lib/store';

interface OrderStats {
  pending: number;
  completed: number;
  cancelled: number;
  refunded: number;
  revenue: number;
}

export default function AdminOrderStatsPage() {
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<OrderStats>('/admin/orders/stats');
      setStats(data);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось загрузить статистику'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Статистика продаж</h1>
        <p className="text-sm text-muted-foreground">Сводка по заказам магазина</p>
      </div>

      {loading || !stats ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Выручка" value={formatPrice(stats.revenue)} />
          <StatCard title="Оплачено" value={String(stats.completed)} />
          <StatCard title="Ожидают" value={String(stats.pending)} />
          <StatCard title="Отменено" value={String(stats.cancelled)} />
          <StatCard title="Возвраты" value={String(stats.refunded)} />
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-white">{value}</p>
      </CardContent>
    </Card>
  );
}
