'use client';
/* eslint-disable @next/next/no-img-element */

import { CheckCircle2, Clock3, ExternalLink, Gem, LogIn, Vote } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useVoting } from '@/hooks/useVoting';

function remaining(nextVoteAt?: string | null) {
  if (!nextVoteAt) return null;
  const ms = new Date(nextVoteAt).getTime() - Date.now();
  if (ms <= 0) return null;
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.ceil((ms % 3_600_000) / 60_000);
  return `${hours ? `${hours} ч ` : ''}${minutes} мин`;
}

export default function VotePage() {
  const { user } = useAuth();
  const voting = useVoting();
  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      <header className="relative overflow-hidden rounded-3xl border border-white/10 glass-strong p-6 sm:p-9">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative flex items-center gap-2 text-primary">
          <Vote className="h-6 w-6" />
          <span className="text-sm uppercase tracking-[0.2em]">Поддержать TWOMC</span>
        </div>
        <h1 className="font-display relative mt-4 text-3xl text-white sm:text-5xl">
          Голосование за сервер
        </h1>
        <p className="relative mt-3 max-w-2xl text-muted-foreground">
          Голосуйте на мониторингах, помогайте проекту расти и автоматически получайте рубины после
          подтверждения голоса.
        </p>
      </header>
      {user && voting.data ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="glass-medium">
            <CardContent className="flex items-center gap-4 p-5">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              <div>
                <p className="text-2xl font-semibold">{voting.data.totalVotes}</p>
                <p className="text-sm text-muted-foreground">Подтверждённых голосов</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-medium">
            <CardContent className="flex items-center gap-4 p-5">
              <Gem className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-semibold">{voting.data.totalEarned}</p>
                <p className="text-sm text-muted-foreground">Получено рубинов</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
      {voting.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : null}
      {!voting.isLoading && !voting.data?.sites.length ? (
        <EmptyState
          icon={Vote}
          title="Мониторинги ещё не подключены"
          description="Администратор скоро добавит площадки для голосования."
        />
      ) : null}
      <div className="space-y-3">
        {voting.data?.sites.map((site) => {
          const wait = remaining(site.nextVoteAt);
          return (
            <Card key={site.id} className="border-white/10 glass-medium">
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  {site.logoUrl ? (
                    <img
                      src={site.logoUrl}
                      alt=""
                      className="h-14 w-14 rounded-xl object-contain"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                      <Vote className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="font-semibold text-white">{site.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {site.description ?? `Награда раз в ${site.cooldownHours} ч`}
                    </p>
                    <p className="mt-2 text-sm text-primary">+{site.rewardCoins} рубинов</p>
                  </div>
                </div>
                {!user ? (
                  <Button asChild>
                    <Link href="/login?next=/vote">
                      <LogIn className="mr-2 h-4 w-4" />
                      Войти
                    </Link>
                  </Button>
                ) : wait ? (
                  <Button disabled variant="secondary">
                    <Clock3 className="mr-2 h-4 w-4" />
                    {wait}
                  </Button>
                ) : (
                  <Button asChild>
                    <a href={site.url} target="_blank" rel="noreferrer">
                      Голосовать
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
