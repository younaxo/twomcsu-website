'use client';

import type { FriendUser } from '@twomc/shared';
import { MoreHorizontal, UserMinus, UserX } from 'lucide-react';
import Link from 'next/link';
import { memo } from 'react';
import { toast } from 'sonner';
import { ColoredUsername } from '@/components/shared/ColoredUsername';
import { PositionBadge } from '@/components/shared/PositionBadge';
import { AvatarWithSkin } from '@/components/shared/AvatarWithSkin';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  useBlockUser,
  usePrefetchProfile,
  useRemoveFriend,
} from '@/hooks/useFriendsQueries';
import { extractErrorMessage } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/profile';
import { cn } from '@/lib/utils';

interface FriendCardProps {
  friend: FriendUser;
  onRemoved?: () => void;
  onBlocked?: () => void;
  className?: string;
}

function FriendCardComponent({ friend, onRemoved, onBlocked, className }: FriendCardProps) {
  const removeFriend = useRemoveFriend();
  const blockUser = useBlockUser();
  const prefetchProfile = usePrefetchProfile();
  const busy = removeFriend.isPending || blockUser.isPending;

  const remove = async () => {
    try {
      await removeFriend.mutateAsync(friend.username);
      toast.success('Пользователь удалён из друзей');
      onRemoved?.();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось удалить из друзей'));
    }
  };

  const block = async () => {
    try {
      await blockUser.mutateAsync(friend.username);
      toast.success('Пользователь заблокирован');
      onBlocked?.();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось заблокировать'));
    }
  };

  return (
    <div
      className={cn(
        'group relative flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-md transition-colors hover:bg-white/10',
        className,
      )}
    >
      <Link
        href={`/users/${friend.username}`}
        className="shrink-0"
        onMouseEnter={() => prefetchProfile(friend.username)}
      >
        <AvatarWithSkin
          user={{
            username: friend.username,
            avatar: resolveMediaUrl(friend.avatar) ?? null,
          }}
          size="md"
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
                aria-label="Управление"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>Управление</TooltipContent>
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

export const FriendCard = memo(FriendCardComponent);
