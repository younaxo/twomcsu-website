'use client';

import { Server } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { OnlineCounter } from '@/components/servers/OnlineCounter';
import { ServerCard } from '@/components/servers/ServerCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useServers, useServersOverview } from '@/hooks/servers';

export default function ServersPage() {
  const servers = useServers();
  const overview = useServersOverview();

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

      {servers.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      ) : servers.isError ? (
        <EmptyState
          icon={Server}
          title="Не удалось загрузить"
          description="Попробуйте обновить страницу"
        />
      ) : !servers.data?.length ? (
        <EmptyState
          icon={Server}
          title="Серверов пока нет"
          description="Администраторы ещё не добавили серверы"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {servers.data.map((server) => (
            <ServerCard key={server.id} server={server} />
          ))}
        </div>
      )}
    </div>
  );
}
