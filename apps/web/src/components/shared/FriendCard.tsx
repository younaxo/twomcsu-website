'use client';

import type { FriendUser } from '@twomc/shared';
import { MoreHorizontal, UserMinus, UserX } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { ColoredUsername } from '@/components/shared/ColoredUsername';
import { PositionBadge } from '@/components/shared/PositionBadge';
import { SkinHead } from '@/components/shared/SkinHead';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { api, extractErrorMessage } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/profile';
import { cn } from '@/lib/utils';

interface FriendCardProps {
  friend: FriendUser;
  onRemoved?: (username: string) => void;
  onBlocked?: (username: string) => void;
  className?: string;
}

export function FriendCard({ friend, onRemoved, onBlocked, className }: FriendCardProps) {
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/friends/${encodeURIComponent(friend.username)}`);
      toast.success('Пользователь удалён из друзей');
      onRemoved?.(friend.username);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось удалить из друзей'));
    } finally {
      setBusy(false);
    }
  };

  const block = async () => {
    setBusy(true);
    try {
      await api.post(`/friends/block/${encodeURIComponent(friend.username)}`);
      toast.success('Пользователь заблокирован');
      onBlocked?.(friend.username);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось заблокировать'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={cn(
        'group relative flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-md transition-colors hover:bg-white/10',
        className,
      )}
    >
      <Link href={`/users/${friend.username}`} className="shrink-0">
        <SkinHead
          username={friend.username}
          minecraftNick={friend.minecraftNick}
          avatar={resolveMediaUrl(friend.avatar) ?? null}
          size={48}
        />
      </Link>

      <div className="min-w-0 flex-1 space-y-1">
        <ColoredUsername user={friend} size="sm" badges={friend.badges} />
        <PositionBadge position={friend.position} size="sm" />
      </div>

      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0"
                disabled={busy}
                aria-label="Действия"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>Действия</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled={busy} onSelect={() => void remove()}>
            <UserMinus className="mr-2 h-4 w-4" />
            Удалить
          </DropdownMenuItem>
          <DropdownMenuItem disabled={busy} onSelect={() => void block()}>
            <UserX className="mr-2 h-4 w-4" />
            Заблокировать
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
