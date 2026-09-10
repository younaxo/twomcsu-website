'use client';

import type { NotificationStats } from '@twomc/shared';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';

export default function AdminNotificationStatsPage() {
  const stats = useQuery({
    queryKey: ['admin', 'notifications', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<NotificationStats>('/admin/notifications/stats');
      return data;
    },
  });

  if (stats.isLoading || !stats.data) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  const data = stats.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Статистика уведомлений</h1>
        <p className="text-sm text-muted-foreground">Общие показатели доставки</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ['Всего', data.total],
          ['Непрочитано', data.unread],
          ['Email', data.sentViaEmail],
          ['Push', data.sentViaPush],
          ['Discord', data.sentViaDiscord],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl glass-medium p-5">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl glass-medium p-5">
        <h2 className="mb-3 text-lg font-medium text-white">По типам</h2>
        <ul className="space-y-2 text-sm">
          {Object.entries(data.byType).map(([type, count]) => (
            <li key={type} className="flex justify-between gap-3 border-b border-white/5 py-2">
              <span className="text-neutral-300">{type}</span>
              <span className="text-white">{count}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
