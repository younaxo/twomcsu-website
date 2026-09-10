'use client';

import { ArrowRight, Gamepad2, ShoppingBag } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { ActivityWidget } from '@/components/activity/ActivityWidget';
import { NewsCard } from '@/components/news/NewsCard';
import { OnlineCounter } from '@/components/servers/OnlineCounter';
import { TopServersList } from '@/components/servers/TopServersList';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNewsLatest } from '@/hooks/news';
import { useServersOverview } from '@/hooks/servers';

const gameModes = ['Выживание', 'SkyBlock', 'PvP'] as const;

export default function HomePage() {
  const overview = useServersOverview();
  const latestNews = useNewsLatest(3);
  const networkOnline = (overview.data?.activeServers ?? 0) > 0;

  return (
    <div className="space-y-8 sm:space-y-10">
      <section className="relative overflow-hidden rounded-[28px] glass-heavy">
        <div className="pointer-events-none absolute -right-16 -top-32 h-80 w-80 rounded-full bg-white/[0.045] blur-[80px]" />

        <div className="relative grid lg:grid-cols-[1.12fr_0.88fr]">
          <div className="flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
            <span className="eyebrow">Minecraft-сервер twomc.su</span>
            <h1 className="mt-5 max-w-3xl text-[clamp(2.6rem,5.3vw,4.6rem)] font-semibold leading-[1.02] tracking-[-0.055em] text-white">
              Здесь начинается твоя игра.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-neutral-300 sm:text-lg">
              Выбирай режим, знакомься с игроками и развивай свой профиль в едином сообществе
              twomc.su.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {gameModes.map((mode) => (
                <span
                  key={mode}
                  className="rounded-full border border-white/[0.09] bg-white/[0.045] px-3 py-1.5 text-sm font-medium text-neutral-300"
                >
                  {mode}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/servers">
                  Начать играть
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/store">Открыть магазин</Link>
              </Button>
            </div>
          </div>

          <div className="border-t border-white/[0.08] bg-white/[0.025] p-5 sm:p-7 lg:border-l lg:border-t-0 lg:p-8">
            <div className="flex h-full min-h-[320px] flex-col rounded-[22px] border border-white/[0.09] bg-black/20 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-white">Сеть серверов</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Данные обновляются онлайн</p>
                </div>
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    networkOnline
                      ? 'border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300'
                      : 'border-white/10 bg-white/[0.04] text-neutral-400'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${networkOnline ? 'bg-emerald-400' : 'bg-neutral-500'}`}
                  />
                  {overview.isLoading ? 'Проверяем' : networkOnline ? 'Онлайн' : 'Нет данных'}
                </span>
              </div>

              <div className="my-auto py-8">
                {overview.isLoading ? (
                  <Skeleton className="h-24 w-full max-w-xs" />
                ) : (
                  <OnlineCounter value={overview.data?.totalOnline ?? 0} />
                )}
              </div>

              <dl className="grid grid-cols-2 gap-2.5">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
                  <dt className="text-xs text-muted-foreground">Пик за сутки</dt>
                  <dd className="mt-1.5 text-2xl font-semibold tabular-nums text-white">
                    {(overview.data?.peakOnline24h ?? 0).toLocaleString('ru-RU')}
                  </dd>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
                  <dt className="text-xs text-muted-foreground">Серверов</dt>
                  <dd className="mt-1.5 text-2xl font-semibold tabular-nums text-white">
                    {overview.data?.activeServers ?? 0}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 flex items-center gap-3 border-t border-white/[0.07] pt-4 text-sm text-muted-foreground">
                <Gamepad2 className="h-4 w-4 text-primary" />
                Адрес: <strong className="font-semibold text-white">twomc.su</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.78fr_1.22fr]">
        <div className="rounded-3xl glass-medium p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <span className="eyebrow">Прямо сейчас</span>
              <h2 className="mt-3 text-2xl text-white">Топ серверов</h2>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/servers">
                Все
                <ArrowRight />
              </Link>
            </Button>
          </div>
          {overview.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : (
            <TopServersList servers={overview.data?.topServers ?? []} />
          )}
          <Button asChild variant="outline" className="mt-5 w-full">
            <Link href="/store">
              <ShoppingBag />
              Открыть магазин
            </Link>
          </Button>
        </div>

        <div className="rounded-3xl glass-medium p-5 sm:p-6">
          <ActivityWidget />
        </div>
      </section>

      <section className="space-y-5 pt-2">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="eyebrow">Обновления проекта</span>
            <h2 className="mt-3 text-3xl text-white">Последние новости</h2>
          </div>
          <Button asChild variant="ghost">
            <Link href="/news">
              Все новости
              <ArrowRight />
            </Link>
          </Button>
        </div>

        {latestNews.isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-72 w-full" />
            <Skeleton className="h-72 w-full" />
            <Skeleton className="h-72 w-full" />
          </div>
        ) : latestNews.data?.length ? (
          <div className="grid gap-4 md:grid-cols-3">
            {latestNews.data.map((item) => (
              <NewsCard key={item.id} news={item} compact />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl glass-medium p-6 text-sm text-muted-foreground">
            Пока нет опубликованных новостей
          </p>
        )}
      </section>
    </div>
  );
}
