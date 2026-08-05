'use client';

import {
  ActivityFeedFilter,
  ActivityType,
} from '@twomc/shared';
import { Activity } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { useActivityFeed, useActivityRealtime } from '@/hooks/activity';
import { useAuth } from '@/hooks/useAuth';
import { ActivityCard } from './ActivityCard';
import { ActivityFilter } from './ActivityFilter';

export function ActivityFeed() {
  const { isAuthenticated } = useAuth();
  const [filter, setFilter] = useState<ActivityFeedFilter>(ActivityFeedFilter.ALL);
  const [type, setType] = useState<ActivityType | null>(null);

  useActivityRealtime(isAuthenticated);

  const query = useActivityFeed({
    filter,
    ...(type ? { type } : {}),
    limit: 20,
  });

  const items = useMemo(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data],
  );

  return (
    <div className="space-y-6">
      <ActivityFilter
        filter={filter}
        type={type}
        onFilterChange={setFilter}
        onTypeChange={setType}
        showScope={isAuthenticated}
      />

      {query.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="Пока нет активности"
          description="Когда игроки что-то сделают, события появятся здесь"
        />
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <ActivityCard key={item.id} activity={item} defaultCommentsOpen={false} />
          ))}
        </div>
      )}

      {query.hasNextPage ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="secondary"
            onClick={() => void query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
          >
            {query.isFetchingNextPage ? 'Загрузка…' : 'Показать ещё'}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
