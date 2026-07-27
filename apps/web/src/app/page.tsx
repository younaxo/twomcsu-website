'use client';

import Link from 'next/link';
import { OnlineCounter } from '@/components/servers/OnlineCounter';
import { TopServersList } from '@/components/servers/TopServersList';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useServersOverview } from '@/hooks/servers';

export default function HomePage() {
  const overview = useServersOverview();

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/10 p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
        <p className="mb-3 text-sm uppercase tracking-widest text-primary">Minecraft сервер</p>
        <h1 className="mb-4 text-4xl text-white sm:text-5xl">
          twomc<span className="text-primary">.su</span>
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Выживание, SkyBlock и PvP на одном проекте. Заходи на сервер и следи за онлайном в
          реальном времени.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <Link href="/servers">Играть</Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/store">Магазин</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-border bg-card/50 p-6">
          {overview.isLoading ? (
            <Skeleton className="h-20 w-56" />
          ) : (
            <OnlineCounter value={overview.data?.totalOnline ?? 0} />
          )}
          <p className="mt-4 text-sm text-muted-foreground">
            Пик за 24 часа:{' '}
            <span className="text-white">
              {(overview.data?.peakOnline24h ?? 0).toLocaleString('ru-RU')}
            </span>
            {' · '}
            Активных серверов: {overview.data?.activeServers ?? 0}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card/50 p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Топ серверов</h2>
            <Link href="/servers" className="text-sm text-primary hover:underline">
              Все серверы →
            </Link>
          </div>
          {overview.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <TopServersList servers={overview.data?.topServers ?? []} />
          )}
        </div>
      </section>
    </div>
  );
}
