'use client';

import { ACTIVITY_TYPE_LABELS } from '@twomc/shared';
import { AdminEmptyState, AdminPageHeader } from '@/components/admin';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminActivityStats } from '@/hooks/activity';

export default function AdminActivityStatsPage() {
  const { data, isLoading } = useAdminActivityStats();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Статистика ленты"
        description="Обзор активности игроков"
      />

      {isLoading || !data ? (
        <Skeleton className="h-48 w-full rounded-2xl" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Всего', value: data.total },
              { label: 'Закреплено', value: data.pinnedCount },
              { label: 'Скрыто', value: data.hiddenCount },
              { label: 'Реакции', value: data.reactionsCount },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl glass-medium p-4">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {card.value.toLocaleString('ru-RU')}
                </p>
              </div>
            ))}
          </div>

          <section className="rounded-2xl glass-medium p-5">
            <h2 className="mb-4 text-base font-semibold text-white">По типам</h2>
            {data.byType.length === 0 ? (
              <AdminEmptyState title="Нет данных" />
            ) : (
              <ul className="space-y-2">
                {data.byType.map((row) => (
                  <li
                    key={row.type}
                    className="flex items-center justify-between text-sm text-muted-foreground"
                  >
                    <span>{ACTIVITY_TYPE_LABELS[row.type]}</span>
                    <span className="tabular-nums text-white">{row.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl glass-medium p-5">
            <h2 className="mb-4 text-base font-semibold text-white">Топ авторов</h2>
            <ul className="space-y-2">
              {data.topUsers.map((row) => (
                <li
                  key={row.userId}
                  className="flex items-center justify-between text-sm text-muted-foreground"
                >
                  <span className="text-white">{row.username}</span>
                  <span className="tabular-nums">{row.count}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
