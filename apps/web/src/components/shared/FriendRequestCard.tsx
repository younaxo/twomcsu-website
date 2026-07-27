'use client';

import type { FriendRequestItem } from '@twomc/shared';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Check, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { ColoredUsername } from '@/components/shared/ColoredUsername';
import { SkinHead } from '@/components/shared/SkinHead';
import { Button } from '@/components/ui/button';
import { api, extractErrorMessage } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/profile';
import { useFriendsStore } from '@/stores/friendsStore';

interface FriendRequestCardProps {
  request: FriendRequestItem;
  type: 'incoming' | 'outgoing';
  onDone?: (requestId: string) => void;
}

export function FriendRequestCard({ request, type, onDone }: FriendRequestCardProps) {
  const refreshIncoming = useFriendsStore((s) => s.refresh);
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true);
    try {
      await action();
      toast.success(success);
      await refreshIncoming();
      onDone?.(request.id);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось выполнить действие'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card/60 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <Link href={`/users/${request.user.username}`} className="shrink-0">
          <SkinHead
            username={request.user.username}
            minecraftNick={request.user.minecraftNick}
            avatar={resolveMediaUrl(request.user.avatar) ?? null}
            size={44}
          />
        </Link>
        <div className="min-w-0 space-y-0.5">
          <ColoredUsername user={request.user} size="sm" badges={request.user.badges} />
          <p className="text-xs text-muted-foreground">
            {format(new Date(request.createdAt), 'd MMMM yyyy, HH:mm', { locale: ru })}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {type === 'incoming' ? (
          <>
            <Button
              size="sm"
              className="bg-emerald-600 text-white hover:bg-emerald-600/90"
              disabled={busy}
              onClick={() =>
                void run(
                  () => api.post(`/friends/accept/${encodeURIComponent(request.id)}`),
                  'Запрос принят',
                )
              }
            >
              <Check className="mr-1.5 h-4 w-4" />
              Принять
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={busy}
              onClick={() =>
                void run(
                  () => api.post(`/friends/reject/${encodeURIComponent(request.id)}`),
                  'Запрос отклонён',
                )
              }
            >
              <X className="mr-1.5 h-4 w-4" />
              Отклонить
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() =>
              void run(
                () => api.delete(`/friends/requests/${encodeURIComponent(request.id)}`),
                'Запрос отменён',
              )
            }
          >
            Отменить
          </Button>
        )}
      </div>
    </div>
  );
}
