'use client';

import { LeaderboardMetric, leaderboardMetricLabels, type LeaderboardEntry } from '@twomc/shared';
import { Clock3, Crown, Medal, Shield, Swords, Trophy } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import { AvatarWithSkin } from '@/components/shared/AvatarWithSkin';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLeaderboard } from '@/hooks/useLeaderboards';
import { cn } from '@/lib/utils';

const metrics = Object.values(LeaderboardMetric);

function formatValue(metric: LeaderboardMetric, value: number) {
  if (metric === LeaderboardMetric.PLAY_TIME) {
    const hours = Math.floor(value / 60);
    const minutes = value % 60;
    return `${hours} ч ${minutes} мин`;
  }
  if (metric === LeaderboardMetric.KILL_DEATH_RATIO) return value.toFixed(2);
  return new Intl.NumberFormat('ru-RU').format(value);
}

function podiumTone(rank: number) {
  if (rank === 1) return 'border-amber-300/40 bg-amber-300/10 text-amber-200';
  if (rank === 2) return 'border-slate-300/30 bg-slate-300/10 text-slate-200';
  return 'border-orange-700/30 bg-orange-700/10 text-orange-300';
}

function PodiumCard({ entry, metric }: { entry: LeaderboardEntry; metric: LeaderboardMetric }) {
  return (
    <Link
      href={`/users/${entry.user.username}`}
      className={cn(
        'relative flex min-w-0 flex-col items-center rounded-3xl border p-5 text-center transition-colors hover:border-white/30',
        podiumTone(entry.rank),
        entry.rank === 1 && 'md:-translate-y-4',
      )}
    >
      <Crown className={cn('mb-4 h-7 w-7', entry.rank !== 1 && 'opacity-60')} />
      <AvatarWithSkin user={entry.user} size="xl" />
      <p className="mt-5 truncate text-lg font-semibold text-white">{entry.user.username}</p>
      <p className="font-display mt-1 text-2xl">{formatValue(metric, entry.value)}</p>
      <span className="mt-2 text-xs opacity-70">Место #{entry.rank}</span>
    </Link>
  );
}

export default function LeaderboardsPage() {
  const [metric, setMetric] = useState<LeaderboardMetric>(LeaderboardMetric.PLAY_TIME);
  const leaderboard = useLeaderboard(metric);
  const top = leaderboard.data?.items.slice(0, 3) ?? [];
  const podium = top.length === 3 ? [top[1], top[0], top[2]] : top;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <header className="relative overflow-hidden rounded-3xl border border-white/10 glass-strong p-6 sm:p-9">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative flex items-center gap-3 text-primary">
          <Trophy className="h-7 w-7" />
          <span className="text-sm uppercase tracking-[0.2em]">Лучшие игроки TWOMC</span>
        </div>
        <h1 className="font-display relative mt-4 text-3xl text-white sm:text-5xl">
          Таблицы лидеров
        </h1>
        <p className="relative mt-3 max-w-2xl text-muted-foreground">
          Рейтинг формируется по игровой статистике. Игроки со скрытой статистикой в него не
          попадают.
        </p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {metrics.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMetric(item)}
            className={cn(
              'shrink-0 rounded-xl border px-4 py-2 text-sm transition-colors',
              metric === item
                ? 'border-primary/50 bg-primary/15 text-primary'
                : 'border-white/10 bg-white/[0.04] text-muted-foreground hover:text-white',
            )}
          >
            {leaderboardMetricLabels[item]}
          </button>
        ))}
      </div>

      {leaderboard.isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-64 rounded-3xl" />
          ))}
        </div>
      ) : null}

      {!leaderboard.isLoading && !leaderboard.data?.items.length ? (
        <EmptyState
          icon={Medal}
          title="Рейтинг пока пуст"
          description="Данные появятся после синхронизации статистики с игровым сервером."
        />
      ) : null}

      {podium.length ? (
        <section className="grid items-end gap-4 pt-4 md:grid-cols-3">
          {podium.map((entry) => (
            <PodiumCard key={entry.user.id} entry={entry} metric={metric} />
          ))}
        </section>
      ) : null}

      {(leaderboard.data?.items.length ?? 0) > 3 ? (
        <Card className="overflow-hidden border-white/10 glass-medium">
          <CardContent className="divide-y divide-white/5 p-0">
            {leaderboard.data?.items.slice(3).map((entry) => (
              <Link
                key={entry.user.id}
                href={`/users/${entry.user.username}`}
                className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.04] sm:grid-cols-[3rem_1fr_8rem_8rem_auto]"
              >
                <span className="font-display text-center text-lg text-muted-foreground">
                  #{entry.rank}
                </span>
                <div className="flex min-w-0 items-center gap-3">
                  <AvatarWithSkin user={entry.user} size="sm" />
                  <span className="truncate font-medium text-white">{entry.user.username}</span>
                </div>
                <span className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
                  <Swords className="h-4 w-4" />
                  {entry.kills}
                </span>
                <span className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
                  <Shield className="h-4 w-4" />
                  {entry.deaths}
                </span>
                <span className="flex items-center gap-2 font-semibold text-primary">
                  <Clock3 className="hidden h-4 w-4 sm:block" />
                  {formatValue(metric, entry.value)}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {leaderboard.data ? (
        <p className="text-center text-xs text-muted-foreground">
          Обновлено: {new Date(leaderboard.data.updatedAt).toLocaleString('ru-RU')}
        </p>
      ) : null}
    </div>
  );
}
