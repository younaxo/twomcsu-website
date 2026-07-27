'use client';

import type { GameServer } from '@twomc/shared';
import { Flame, Leaf, Star } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { CopyableAddress } from '@/components/servers/CopyableAddress';
import { ServerStatusBadge } from '@/components/servers/ServerStatusBadge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const typeLabels: Record<string, string> = {
  survival: 'Survival',
  skyblock: 'SkyBlock',
  pvp: 'PvP',
  creative: 'Creative',
  minigames: 'Мини-игры',
};

interface ServerCardProps {
  server: GameServer;
  className?: string;
  compact?: boolean;
}

export function ServerCard({ server, className, compact }: ServerCardProps) {
  const online = server.status?.online ?? false;
  const players = server.status?.playerCount ?? 0;
  const max = server.status?.maxPlayers ?? server.maxPlayers;
  const fill = max > 0 ? Math.min(100, Math.round((players / max) * 100)) : 0;
  const popular = online && fill >= 80;
  const free = online && fill < 20;
  const peakHour = online && fill >= 60 && isPeakHour();

  const play = async () => {
    const ip = `${server.address}:${server.port}`;
    try {
      await navigator.clipboard.writeText(ip);
      toast.success('Адрес скопирован', {
        description: 'В Minecraft → Мультиплеер → Добавить сервер',
      });
    } catch {
      toast.error('Не удалось скопировать адрес');
    }
  };

  return (
    <article
      className={cn(
        'flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-md',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary/50">
          {server.iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={server.iconUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-lg font-semibold text-primary">
              {server.name.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-semibold text-white">{server.name}</h3>
            <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
              {typeLabels[server.type] ?? server.type}
            </span>
          </div>
          <ServerStatusBadge online={online} playerCount={players} className="mt-1" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Игроки</span>
          <span className="tabular-nums text-white">
            {players} / {max}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              fill >= 80 ? 'bg-orange-400' : fill < 20 ? 'bg-emerald-400' : 'bg-primary',
            )}
            style={{ width: `${online ? fill : 0}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {popular ? (
            <span className="inline-flex items-center gap-1 text-xs text-orange-300">
              <Flame className="h-3 w-3" /> Популярно
            </span>
          ) : null}
          {free ? (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
              <Leaf className="h-3 w-3" /> Свободно
            </span>
          ) : null}
          {peakHour ? (
            <span className="inline-flex items-center gap-1 text-xs text-amber-300">
              <Star className="h-3 w-3" /> Пик
            </span>
          ) : null}
        </div>
      </div>

      {!compact ? (
        <>
          <CopyableAddress address={server.address} port={server.port} />
          {server.motd || server.status?.motd ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {server.status?.motd ?? server.motd}
            </p>
          ) : null}
          {(server.version || server.status?.version) && (
            <p className="text-xs text-muted-foreground">
              Версия: {server.status?.version ?? server.version}
            </p>
          )}
        </>
      ) : null}

      <div className="mt-auto flex flex-wrap gap-2">
        <Button type="button" onClick={() => void play()}>
          Играть
        </Button>
        <Button asChild variant="secondary">
          <Link href={`/servers/${server.slug}`}>Подробнее</Link>
        </Button>
      </div>
    </article>
  );
}

function isPeakHour(): boolean {
  const hour = new Date().getHours();
  return hour >= 18 && hour <= 23;
}
