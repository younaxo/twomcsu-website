'use client';

import type { ServerPlayer } from '@twomc/shared';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Users } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkinHead } from '@/components/shared/SkinHead';

interface PlayersListProps {
  players: ServerPlayer[];
}

export function PlayersList({ players }: PlayersListProps) {
  if (players.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Никого нет"
        description="Сейчас на сервере нет игроков в списке"
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {players.map((player) => {
        const href = player.user ? `/users/${player.user.username}` : undefined;
        const content = (
          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-3 py-2.5 transition-colors hover:bg-accent/40">
            <SkinHead
              username={player.username}
              avatar={player.user?.avatar ?? null}
              size={40}
            />
            <div className="min-w-0">
              <p className="truncate font-medium text-white">{player.username}</p>
              <p className="text-xs text-muted-foreground">
                {player.lastServerActivity
                  ? `Активен ${formatDistanceToNow(new Date(player.lastServerActivity), {
                      addSuffix: false,
                      locale: ru,
                    })}`
                  : player.isRegistered
                    ? 'Зарегистрирован на сайте'
                    : 'Гость'}
              </p>
            </div>
          </div>
        );

        return href ? (
          <Link key={player.username} href={href}>
            {content}
          </Link>
        ) : (
          <div key={player.username}>{content}</div>
        );
      })}
    </div>
  );
}
