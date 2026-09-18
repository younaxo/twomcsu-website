'use client';

import type { MiniGameResult } from '@twomc/shared';
import { ArrowUpCircle, Bomb, CircleDollarSign, Dices, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useGameHistory, usePlayGame } from '@/hooks/useRewards';
import { extractErrorMessage } from '@/lib/api';

export default function MinigamesPage() {
  const { user } = useAuth();
  const history = useGameHistory();
  const [bet, setBet] = useState(10);
  const [color, setColor] = useState<'RED' | 'BLACK' | 'GREEN'>('RED');
  const [cashout, setCashout] = useState(2);
  const [target, setTarget] = useState(2);
  const [last, setLast] = useState<MiniGameResult | null>(null);
  const roulette = usePlayGame('roulette');
  const crash = usePlayGame('crash');
  const upgrader = usePlayGame('upgrader');

  if (!user)
    return (
      <Card className="mx-auto mt-12 max-w-lg glass-strong">
        <CardContent className="p-8 text-center">
          <Dices className="mx-auto h-12 w-12 text-primary" />
          <h1 className="font-display mt-4 text-3xl">Мини-игры</h1>
          <p className="mt-2 text-muted-foreground">
            Игры доступны после входа и используют только виртуальные рубины.
          </p>
          <Button asChild className="mt-5">
            <Link href="/login?next=/minigames">Войти</Link>
          </Button>
        </CardContent>
      </Card>
    );

  const play = async (game: 'roulette' | 'crash' | 'upgrader') => {
    try {
      const mutation = game === 'roulette' ? roulette : game === 'crash' ? crash : upgrader;
      const payload =
        game === 'roulette'
          ? { bet, color }
          : game === 'crash'
            ? { bet, autoCashout: cashout }
            : { bet, targetMultiplier: target };
      const result = await mutation.mutateAsync(payload);
      setLast(result);
      toast[result.won ? 'success' : 'error'](
        result.won ? `Выигрыш: ${result.payoutAmount} рубинов` : 'В этот раз не повезло',
      );
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось запустить игру'));
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-8">
      <header className="rounded-3xl border border-white/10 glass-strong p-7 sm:p-10">
        <p className="text-sm uppercase tracking-[.2em] text-primary">Только виртуальная валюта</p>
        <h1 className="font-display mt-3 text-4xl sm:text-5xl">Мини-игры</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Рулетка, краш и апгрейдер. Каждый результат создаётся на сервере и сопровождается
          seed-хешем для проверки.
        </p>
      </header>
      <Tabs defaultValue="roulette">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="roulette">Рулетка</TabsTrigger>
          <TabsTrigger value="crash">Краш</TabsTrigger>
          <TabsTrigger value="upgrader">Апгрейдер</TabsTrigger>
        </TabsList>
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_280px]">
          <Card className="glass-medium">
            <CardContent className="p-6">
              <div className="mb-5 space-y-2">
                <Label>Ставка, рубины</Label>
                <Input
                  type="number"
                  min={1}
                  max={100000}
                  value={bet}
                  onChange={(e) => setBet(Number(e.target.value))}
                />
              </div>
              <TabsContent value="roulette" className="space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  {(['RED', 'BLACK', 'GREEN'] as const).map((item) => (
                    <button
                      key={item}
                      onClick={() => setColor(item)}
                      className={`rounded-2xl border p-6 text-sm font-semibold ${color === item ? 'border-primary bg-primary/15' : 'border-white/10 bg-white/5'}`}
                    >
                      {item === 'RED'
                        ? 'Красное ×2'
                        : item === 'BLACK'
                          ? 'Чёрное ×2'
                          : 'Зелёное ×14'}
                    </button>
                  ))}
                </div>
                <Button
                  className="w-full"
                  onClick={() => void play('roulette')}
                  disabled={roulette.isPending}
                >
                  <CircleDollarSign className="mr-2 h-4 w-4" />
                  Крутить
                </Button>
              </TabsContent>
              <TabsContent value="crash" className="space-y-5">
                <div className="rounded-2xl bg-gradient-to-br from-red-500/15 to-transparent p-8 text-center">
                  <Bomb className="mx-auto h-12 w-12 text-red-400" />
                  <p className="font-display mt-3 text-3xl">Автовывод ×{cashout.toFixed(2)}</p>
                </div>
                <div className="space-y-2">
                  <Label>Множитель 1.10–10.00</Label>
                  <Input
                    type="number"
                    min={1.1}
                    max={10}
                    step={0.1}
                    value={cashout}
                    onChange={(e) => setCashout(Number(e.target.value))}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => void play('crash')}
                  disabled={crash.isPending}
                >
                  Запустить
                </Button>
              </TabsContent>
              <TabsContent value="upgrader" className="space-y-5">
                <div className="rounded-2xl bg-gradient-to-br from-violet-500/15 to-transparent p-8 text-center">
                  <ArrowUpCircle className="mx-auto h-12 w-12 text-violet-400" />
                  <p className="font-display mt-3 text-3xl">Цель ×{target.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">
                    Шанс: {Math.min(80, 96 / target).toFixed(1)}%
                  </p>
                </div>
                <Input
                  type="range"
                  min={1.2}
                  max={10}
                  step={0.1}
                  value={target}
                  onChange={(e) => setTarget(Number(e.target.value))}
                />
                <Button
                  className="w-full"
                  onClick={() => void play('upgrader')}
                  disabled={upgrader.isPending}
                >
                  Улучшить
                </Button>
              </TabsContent>
            </CardContent>
          </Card>
          <Card className="glass-medium">
            <CardContent className="p-5">
              <h2 className="font-semibold">Последний результат</h2>
              {last ? (
                <div className="mt-4 space-y-2">
                  <p className={last.won ? 'text-emerald-400' : 'text-red-400'}>
                    {last.won ? 'Победа' : 'Проигрыш'}
                  </p>
                  <p className="text-2xl font-semibold">{last.payoutAmount} рубинов</p>
                  <p className="text-xs text-muted-foreground">Баланс: {last.balance}</p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" />
                    Проверяемый seed
                  </div>
                  <code className="block break-all text-[10px] text-muted-foreground">
                    {last.serverSeedHash}
                  </code>
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">Сыграйте первый раунд.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </Tabs>
      <section>
        <h2 className="font-display mb-4 text-2xl">История</h2>
        <div className="space-y-2">
          {history.data?.map((round) => (
            <div
              key={round.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[.03] px-4 py-3 text-sm"
            >
              <span>
                {round.game} · ставка {round.betAmount}
              </span>
              <span className={round.won ? 'text-emerald-400' : 'text-muted-foreground'}>
                {round.won ? `+${round.payoutAmount}` : '0'}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
