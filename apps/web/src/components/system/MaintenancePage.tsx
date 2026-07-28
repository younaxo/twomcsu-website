'use client';

import { ExternalLink, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface MaintenancePageProps {
  title: string;
  message: string;
  estimatedEnd?: string | null;
  discordUrl?: string;
  vkUrl?: string;
}

function useCountdown(targetIso: string | null | undefined) {
  const [left, setLeft] = useState<string | null>(null);

  useEffect(() => {
    if (!targetIso) {
      setLeft(null);
      return;
    }

    const tick = () => {
      const end = new Date(targetIso).getTime();
      const diff = end - Date.now();
      if (diff <= 0) {
        setLeft('скоро');
        return;
      }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      setLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [targetIso]);

  return left;
}

export function MaintenancePage({
  title,
  message,
  estimatedEnd,
  discordUrl = 'https://discord.gg',
  vkUrl = 'https://vk.com',
}: MaintenancePageProps) {
  const countdown = useCountdown(estimatedEnd);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(12,12,15,0.92)] px-4 backdrop-blur-xl">
      <div className="glass-strong w-full max-w-lg space-y-6 rounded-2xl p-8 text-center shadow-[0_16px_48px_rgba(0,0,0,0.45)]">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
          <Wrench className="h-10 w-10 text-[#F57C00]" aria-hidden />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
          <p className="text-muted-foreground">{message}</p>
        </div>
        {countdown ? (
          <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-neutral-500">Ожидаемое окончание</p>
            <p className="mt-1 font-mono text-2xl text-white">{countdown}</p>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="outline">
            <a href={discordUrl} target="_blank" rel="noreferrer">
              Discord
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={vkUrl} target="_blank" rel="noreferrer">
              VK
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/login">Вход для админов</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
