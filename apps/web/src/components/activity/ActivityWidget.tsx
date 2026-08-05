'use client';

import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useActivityHighlights } from '@/hooks/activity';
import { ActivityCardCompact } from './ActivityCardCompact';

export function ActivityWidget() {
  const { data, isLoading } = useActivityHighlights('week');

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">Что сейчас происходит</h2>
        <Link href="/feed" className="text-sm text-primary hover:underline">
          Все активности →
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : data && data.length > 0 ? (
        <div className="space-y-2">
          {data.slice(0, 7).map((item) => (
            <ActivityCardCompact key={item.id} activity={item} />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl glass-medium p-5 text-sm text-muted-foreground">
          Пока нет свежей активности
        </p>
      )}
    </section>
  );
}
