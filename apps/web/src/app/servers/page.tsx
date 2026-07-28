'use client';

import { Server } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EmptyState } from '@/components/shared/EmptyState';
import { OnlineCounter } from '@/components/servers/OnlineCounter';
import { ServerCard } from '@/components/servers/ServerCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useServerCategories, useServers, useServersOverview } from '@/hooks/servers';
import { cn } from '@/lib/utils';

export default function ServersPage() {
  const servers = useServers();
  const overview = useServersOverview();
  const categories = useServerCategories();
  const [categorySlug, setCategorySlug] = useState('all');

  const filtered = useMemo(() => {
    const rows = servers.data ?? [];
    if (categorySlug === 'all') return rows;
    return rows.filter((s) => s.category?.slug === categorySlug);
  }, [servers.data, categorySlug]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-white">Серверы</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Онлайн обновляется каждые 30 секунд
          </p>
        </div>
        {overview.isLoading ? (
          <Skeleton className="h-16 w-48" />
        ) : (
          <OnlineCounter value={overview.data?.totalOnline ?? 0} />
        )}
      </div>

      {(categories.data?.length ?? 0) > 0 ? (
        <Tabs value={categorySlug} onValueChange={setCategorySlug}>
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
            <TabsTrigger
              value="all"
              className={cn(
                'rounded-lg border border-transparent px-3 py-1.5 data-[state=active]:border-primary/40 data-[state=active]:bg-primary/15',
              )}
            >
              Все
            </TabsTrigger>
            {(categories.data ?? []).map((cat) => (
              <TabsTrigger
                key={cat.id}
                value={cat.slug}
                className="rounded-lg border border-transparent px-3 py-1.5 data-[state=active]:border-primary/40 data-[state=active]:bg-primary/15"
                style={
                  categorySlug === cat.slug && cat.color
                    ? { borderColor: `${cat.color}66`, backgroundColor: `${cat.color}22` }
                    : undefined
                }
              >
                {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      ) : null}

      {servers.isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80 w-full rounded-2xl" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      ) : servers.isError ? (
        <EmptyState
          icon={Server}
          title="Не удалось загрузить"
          description="Попробуйте обновить страницу"
        />
      ) : !filtered.length ? (
        <EmptyState
          icon={Server}
          title={categorySlug === 'all' ? 'Серверов пока нет' : 'В этой категории пусто'}
          description={
            categorySlug === 'all'
              ? 'Администраторы ещё не добавили серверы'
              : 'Выберите другую категорию'
          }
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filtered.map((server) => (
            <ServerCard key={server.id} server={server} />
          ))}
        </div>
      )}
    </div>
  );
}
