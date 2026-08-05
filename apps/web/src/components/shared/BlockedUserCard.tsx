'use client';

import type { BlockedUserItem } from '@twomc/shared';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import Link from 'next/link';
import { memo } from 'react';
import { toast } from 'sonner';
import { ColoredUsername } from '@/components/shared/ColoredUsername';
import { AvatarWithSkin } from '@/components/shared/AvatarWithSkin';
import { Button } from '@/components/ui/button';
import { usePrefetchProfile, useUnblockUser } from '@/hooks/useFriendsQueries';
import { extractErrorMessage } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/profile';

interface BlockedUserCardProps {
  item: BlockedUserItem;
  onUnblocked?: () => void;
}

function BlockedUserCardComponent({ item, onUnblocked }: BlockedUserCardProps) {
  const unblockUser = useUnblockUser();
  const prefetchProfile = usePrefetchProfile();

  const unblock = async () => {
    try {
      await unblockUser.mutateAsync(item.user.username);
      toast.success('Пользователь разблокирован');
      onUnblocked?.();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось разблокировать'));
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card/60 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href={`/users/${item.user.username}`}
          className="shrink-0"
          onMouseEnter={() => prefetchProfile(item.user.username)}
        >
          <AvatarWithSkin
            user={{
              username: item.user.username,
              avatar: resolveMediaUrl(item.user.avatar) ?? null,
            }}
            size="md"
          />
        </Link>
        <div className="min-w-0 space-y-0.5">
          <ColoredUsername user={item.user} size="sm" badges={item.user.badges} />
          <p className="text-xs text-muted-foreground">
            {format(new Date(item.createdAt), 'd MMMM yyyy, HH:mm', { locale: ru })}
          </p>
        </div>
      </div>

      <Button size="sm" variant="outline" disabled={unblockUser.isPending} onClick={() => void unblock()}>
        Разблокировать
      </Button>
    </div>
  );
}

export const BlockedUserCard = memo(BlockedUserCardComponent);
