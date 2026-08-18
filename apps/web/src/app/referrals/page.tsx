'use client';

import { Copy, Gem, Network, Trophy, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { AvatarWithSkin } from '@/components/shared/AvatarWithSkin';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useReferralDashboard, useReferralLeaderboard } from '@/hooks/useReferrals';

export default function ReferralsPage() {
  const { user } = useAuth();
  const dashboard = useReferralDashboard();
  const leaderboard = useReferralLeaderboard();
  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    toast.success('Ссылка скопирована');
  };
  if (!user)
    return (
      <Card className="mx-auto mt-12 max-w-lg glass-strong">
        <CardContent className="p-8 text-center">
          <Users className="mx-auto h-12 w-12 text-primary" />
          <h1 className="font-display mt-4 text-3xl">Реферальная система</h1>
          <p className="mt-2 text-muted-foreground">Войдите, чтобы получить персональную ссылку.</p>
          <Button asChild className="mt-5">
            <Link href="/login?next=/referrals">Войти</Link>
          </Button>
        </CardContent>
      </Card>
    );
  return (
    <div className="mx-auto max-w-6xl space-y-8 py-8">
      <header className="rounded-3xl border border-white/10 glass-strong p-7 sm:p-10">
        <p className="text-sm uppercase tracking-[.2em] text-primary">Этап 25</p>
        <h1 className="font-display mt-3 text-4xl sm:text-5xl">Приглашайте друзей</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Получайте награды за три уровня приглашений: за друзей, их друзей и следующий уровень
          сети.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={UserPlus} value={dashboard.data?.directCount ?? 0} label="Прямых приглашений" />
        <Stat icon={Network} value={dashboard.data?.networkCount ?? 0} label="Во всей сети" />
        <Stat icon={Gem} value={dashboard.data?.earned ?? 0} label="Получено рубинов" />
      </div>
      <Card className="glass-medium">
        <CardContent className="space-y-5 p-6">
          <div>
            <p className="text-sm text-muted-foreground">Ваш код</p>
            <p className="font-display mt-1 text-3xl text-primary">{dashboard.data?.code ?? '—'}</p>
          </div>
          <LinkRow
            label="Короткая реферальная ссылка"
            value={dashboard.data?.referralUrl ?? ''}
            onCopy={copy}
          />
          <LinkRow
            label="Прямая ссылка регистрации"
            value={dashboard.data?.registrationUrl ?? ''}
            onCopy={copy}
          />
          <div className="grid gap-3 sm:grid-cols-3">
            {dashboard.data?.levels.map((level) => (
              <div key={level.level} className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs uppercase text-muted-foreground">Уровень {level.level}</p>
                <p className="mt-2 text-xl font-semibold">+{level.rewardPerInvite}</p>
                <p className="text-xs text-muted-foreground">
                  за приглашённого · {level.count} чел.
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="glass-medium">
        <CardContent className="p-6">
          <h2 className="font-display flex items-center gap-2 text-2xl">
            <Trophy className="h-5 w-5 text-primary" />
            Лидерборд рефереров
          </h2>
          <div className="mt-5 space-y-2">
            {leaderboard.data?.map((entry) => (
              <div
                key={entry.username}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.03] p-3"
              >
                <span className="w-8 text-center font-semibold text-primary">#{entry.rank}</span>
                <AvatarWithSkin user={entry} size="sm" showMinecraftHead={false} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{entry.username}</p>
                  <p className="text-xs text-muted-foreground">Сеть: {entry.networkCount}</p>
                </div>
                <span className="text-sm text-primary">{entry.earned} руб.</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, value, label }: { icon: typeof Users; value: number; label: string }) {
  return (
    <Card className="glass-medium">
      <CardContent className="flex items-center gap-4 p-5">
        <Icon className="h-8 w-8 text-primary" />
        <div>
          <p className="text-2xl font-semibold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
function LinkRow({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: (value: string) => Promise<void>;
}) {
  return (
    <div>
      <p className="mb-2 text-xs text-muted-foreground">{label}</p>
      <div className="flex gap-2">
        <div className="min-w-0 flex-1 truncate rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm">
          {value || 'Загрузка…'}
        </div>
        <Button
          variant="secondary"
          size="icon"
          disabled={!value}
          onClick={() => void onCopy(value)}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
