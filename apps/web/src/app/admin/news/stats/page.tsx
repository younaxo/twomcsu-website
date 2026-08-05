'use client';

import { NewsCard } from '@/components/news/NewsCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useNewsStats } from '@/hooks/news';

export default function AdminNewsStatsPage() {
  const stats = useNewsStats();

  if (stats.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!stats.data) {
    return <p className="text-muted-foreground">Нет данных</p>;
  }

  const s = stats.data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Статистика новостей</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ['Всего', s.total],
          ['Опубликовано', s.published],
          ['Черновики', s.drafts],
          ['Запланировано', s.scheduled],
          ['Архив', s.archived],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-2xl glass-medium p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-white">{value as number}</p>
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Топ по просмотрам</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {s.topByViews.map((item) => (
            <NewsCard key={item.id} news={item} compact />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Активность (14 дней)</h2>
        <div className="rounded-2xl glass-medium p-4">
          <div className="flex h-40 items-end gap-1">
            {s.activityByDay.map((day) => {
              const max = Math.max(...s.activityByDay.map((d) => d.count), 1);
              const height = `${Math.max(8, (day.count / max) * 100)}%`;
              return (
                <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-primary/70"
                    style={{ height }}
                    title={`${day.date}: ${day.count}`}
                  />
                  <span className="text-[10px] text-muted-foreground">{day.date.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
