'use client';

import { ArrowRight, Gamepad2, ShieldCheck, ShoppingBag, Sparkles } from 'lucide-react';
import Link from 'next/link';
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
      <section className="frame-corners surface-grid relative overflow-hidden rounded-[1.5rem] glass-heavy">
        <div className="absolute inset-y-0 right-0 hidden w-[42%] border-l border-white/[0.07] bg-black/15 lg:block" />
        <div className="pointer-events-none absolute -right-24 -top-40 h-96 w-96 rounded-full bg-primary/[0.09] blur-[90px]" />

        <div className="relative grid min-h-[500px] lg:grid-cols-[1.25fr_0.75fr]">
          <div className="flex flex-col justify-between p-6 sm:p-10 lg:p-14">
            <div>
              <span className="eyebrow">Игровая сеть Minecraft</span>
              <h1 className="mt-7 max-w-4xl text-[clamp(3rem,8vw,7.5rem)] font-semibold leading-[0.86] tracking-[-0.075em] text-white">
                Твой мир.
                <br />
                <span className="text-primary">Твои правила.</span>
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-7 text-neutral-300 sm:text-lg">
                Единое сообщество, живые серверы и всё необходимое для игры — от первого входа до
                больших командных историй.
              </p>
            </div>

            <div className="mt-10 flex flex-col gap-6 sm:mt-14 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {gameModes.map((mode) => (
                  <span
                    key={mode}
                    className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-sm font-medium text-neutral-300"
                  >
                    {mode}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2.5">
                <Button asChild size="lg">
                  <Link href="/servers">
                    Начать играть
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/store">Магазин</Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="relative flex flex-col justify-between border-t border-white/[0.07] p-6 sm:p-8 lg:border-l-0 lg:border-t-0 lg:p-10">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Состояние сети
              </span>
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
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

            <div className="my-10 lg:my-0">
              {overview.isLoading ? (
                <Skeleton className="h-24 w-full max-w-xs" />
              ) : (
                <OnlineCounter value={overview.data?.totalOnline ?? 0} />
              )}
              <dl className="mt-8 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/[0.08] bg-black/20 p-4">
                  <dt className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
                    Пик за сутки
                  </dt>
                  <dd className="mt-2 text-2xl font-semibold tabular-nums text-white">
                    {(overview.data?.peakOnline24h ?? 0).toLocaleString('ru-RU')}
                  </dd>
                </div>
                <div className="rounded-xl border border-white/[0.08] bg-black/20 p-4">
                  <dt className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
                    Серверов
                  </dt>
                  <dd className="mt-2 text-2xl font-semibold tabular-nums text-white">
                    {overview.data?.activeServers ?? 0}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="flex items-center gap-3 border-t border-white/[0.07] pt-5 text-sm text-muted-foreground">
              <Gamepad2 className="h-4 w-4 text-primary" />
              Адрес сервера: <strong className="font-semibold text-white">twomc.su</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            icon: Gamepad2,
            title: 'Живые миры',
            text: 'Выбери режим и сразу увидишь статус сервера и текущий онлайн.',
          },
          {
            icon: ShieldCheck,
            title: 'Честная игра',
            text: 'Правила, обращения и работа команды собраны в прозрачной системе.',
          },
          {
            icon: Sparkles,
            title: 'Своё сообщество',
            text: 'Профили, друзья, события и достижения продолжают игру за пределами сервера.',
          },
        ].map((item, index) => (
          <article key={item.title} className="glass-light rounded-2xl p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <item.icon className="h-5 w-5 text-primary" strokeWidth={1.8} />
              <span className="text-xs font-semibold tabular-nums text-neutral-600">
                0{index + 1}
              </span>
            </div>
            <h2 className="mt-8 text-xl text-white">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.78fr_1.22fr]">
        <div className="rounded-[1.25rem] glass-medium p-5 sm:p-6">
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

        <div className="rounded-[1.25rem] glass-medium p-5 sm:p-6">
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
