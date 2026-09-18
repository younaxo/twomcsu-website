'use client';

import { RewardRarity } from '@twomc/shared';
import { Gift, LockKeyhole, RotateCw, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useClaimReward, useRewards, useSpinWheel } from '@/hooks/useRewards';
import { extractErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

const rarityStyle = {
  [RewardRarity.COMMON]: 'border-white/10 from-white/10',
  [RewardRarity.RARE]: 'border-sky-400/40 from-sky-500/20',
  [RewardRarity.EPIC]: 'border-violet-400/40 from-violet-500/20',
  [RewardRarity.LEGENDARY]: 'border-amber-400/50 from-amber-500/25',
};
const rarityLabel = {
  COMMON: 'Обычная',
  RARE: 'Редкая',
  EPIC: 'Эпическая',
  LEGENDARY: 'Легендарная',
} as const;

export default function RewardsPage() {
  const { user } = useAuth();
  const rewards = useRewards();
  const claim = useClaimReward();
  const spin = useSpinWheel();
  const [wheelTurns, setWheelTurns] = useState(0);

  if (!user)
    return (
      <Card className="mx-auto mt-12 max-w-lg glass-strong">
        <CardContent className="p-8 text-center">
          <Gift className="mx-auto h-12 w-12 text-primary" />
          <h1 className="font-display mt-4 text-3xl">Награды ждут</h1>
          <p className="mt-2 text-muted-foreground">Войдите, чтобы собирать ежедневную серию.</p>
          <Button asChild className="mt-5">
            <Link href="/login?next=/rewards">Войти</Link>
          </Button>
        </CardContent>
      </Card>
    );

  const choose = async (index: number) => {
    try {
      const result = (await claim.mutateAsync(index)) as {
        reward: number;
        rarity: keyof typeof rarityLabel;
      };
      toast.success(`Получено ${result.reward} рубинов · ${rarityLabel[result.rarity]}`);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось открыть карточку'));
    }
  };
  const roll = async () => {
    try {
      const result = (await spin.mutateAsync()) as { segment: number; reward: number };
      setWheelTurns((value) => value + 5 + result.segment / 7);
      toast.success(`Колесо принесло ${result.reward} рубинов`);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось прокрутить колесо'));
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 py-8">
      <header className="relative overflow-hidden rounded-3xl border border-white/10 glass-strong p-7 sm:p-10">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <p className="relative text-sm uppercase tracking-[.2em] text-primary">Этап 23</p>
        <h1 className="font-display relative mt-3 text-4xl sm:text-5xl">Ежедневные награды</h1>
        <p className="relative mt-3 max-w-2xl text-muted-foreground">
          Выберите одну из восьми карточек. Сохраняйте серию семь дней — на седьмой день каждая
          карточка легендарная.
        </p>
        <div className="relative mt-5 flex flex-wrap gap-3">
          <span className="rounded-full bg-primary/15 px-4 py-2 text-sm text-primary">
            Серия: {rewards.data?.streak ?? 0}/7
          </span>
          <span className="rounded-full bg-white/5 px-4 py-2 text-sm">
            Баланс: {rewards.data?.balance ?? 0} рубинов
          </span>
        </div>
      </header>
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl">Карточки дня</h2>
            <p className="text-sm text-muted-foreground">Можно открыть только одну</p>
          </div>
        </div>
        {rewards.isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Skeleton className="h-44" />
            <Skeleton className="h-44" />
            <Skeleton className="h-44" />
            <Skeleton className="h-44" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {rewards.data?.cards.map((card) => (
              <button
                key={card.index}
                disabled={!rewards.data?.canClaim || claim.isPending}
                onClick={() => void choose(card.index)}
                className={cn(
                  'group relative h-44 overflow-hidden rounded-2xl border bg-gradient-to-b to-black/30 p-4 text-left transition-colors hover:border-primary/60 disabled:cursor-default',
                  rarityStyle[card.rarity],
                )}
              >
                <Sparkles className="h-6 w-6 text-primary" />
                <p className="mt-10 text-xs uppercase tracking-widest text-muted-foreground">
                  {rarityLabel[card.rarity]}
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {card.revealed ? `+${card.reward} рубинов` : 'Выбрать'}
                </p>
                {!rewards.data?.canClaim && !card.revealed ? (
                  <LockKeyhole className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                ) : null}
              </button>
            ))}
          </div>
        )}
      </section>
      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div
          className="relative mx-auto grid h-72 w-72 place-items-center rounded-full border-8 border-white/10 bg-[conic-gradient(#F57C00_0_14%,#7c3aed_14%_28%,#0ea5e9_28%_42%,#F57C00_42%_56%,#7c3aed_56%_70%,#0ea5e9_70%_84%,#f59e0b_84%)] shadow-2xl transition-transform duration-1000"
          style={{ transform: `rotate(${wheelTurns * 360}deg)` }}
        >
          <div className="grid h-24 w-24 place-items-center rounded-full bg-background shadow-xl">
            <RotateCw className="h-8 w-8 text-primary" />
          </div>
        </div>
        <Card className="glass-medium">
          <CardContent className="flex h-full flex-col justify-center p-7">
            <p className="text-sm uppercase tracking-[.18em] text-primary">Раз в неделю</p>
            <h2 className="font-display mt-2 text-3xl">Колесо удачи</h2>
            <p className="mt-3 text-muted-foreground">
              Редкие сектора встречаются реже, а легендарный может принести 1 000 рубинов.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {rewards.data?.wheel.prizes.map((prize, index) => (
                <span
                  key={index}
                  className={cn(
                    'rounded-full border bg-gradient-to-r to-transparent px-3 py-1 text-xs',
                    rarityStyle[prize.rarity],
                  )}
                >
                  +{prize.reward}
                </span>
              ))}
            </div>
            <Button
              className="mt-6 w-fit"
              disabled={!rewards.data?.wheel.canSpin || spin.isPending}
              onClick={() => void roll()}
            >
              {rewards.data?.wheel.canSpin ? 'Крутить колесо' : 'Уже использовано'}
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
