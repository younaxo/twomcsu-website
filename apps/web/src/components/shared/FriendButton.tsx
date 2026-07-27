'use client';

import type { FriendshipRelationStatus, FriendshipStatusResponse } from '@twomc/shared';
import { Check, Clock, MoreHorizontal, UserMinus, UserPlus, UserX } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { api, extractErrorMessage } from '@/lib/api';
import { useFriendsStore } from '@/stores/friendsStore';

interface FriendButtonProps {
  username: string;
  onChanged?: () => void;
}

export function FriendButton({ username, onChanged }: FriendButtonProps) {
  const { isAuthenticated } = useAuth();
  const refreshIncoming = useFriendsStore((s) => s.refresh);
  const [status, setStatus] = useState<FriendshipRelationStatus | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadStatus = useCallback(async () => {
    if (!isAuthenticated) {
      setStatus(null);
      setRequestId(null);
      return;
    }

    try {
      const { data } = await api.get<FriendshipStatusResponse>(
        `/friends/status/${encodeURIComponent(username)}`,
        { skipAuthRedirect: true },
      );
      setStatus(data.status);
      setRequestId(data.requestId);
    } catch {
      setStatus(null);
      setRequestId(null);
    }
  }, [isAuthenticated, username]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const run = async (action: () => Promise<void>, success: string) => {
    setBusy(true);
    try {
      await action();
      toast.success(success);
      await loadStatus();
      await refreshIncoming();
      onChanged?.();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось выполнить действие'));
    } finally {
      setBusy(false);
    }
  };

  if (!isAuthenticated || status === null || status === 'self') {
    return null;
  }

  if (status === 'none') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            disabled={busy}
            onClick={() =>
              void run(
                () => api.post(`/friends/request/${encodeURIComponent(username)}`),
                'Запрос в друзья отправлен',
              )
            }
          >
            <UserPlus className="mr-1.5 h-4 w-4" />
            Добавить в друзья
          </Button>
        </TooltipTrigger>
        <TooltipContent>Отправить запрос в друзья</TooltipContent>
      </Tooltip>
    );
  }

  if (status === 'pending_sent') {
    return (
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="secondary" disabled={busy}>
                <Clock className="mr-1.5 h-4 w-4" />
                Запрос отправлен
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>Ожидает ответа</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            disabled={!requestId || busy}
            onSelect={() => {
              if (!requestId) return;
              void run(
                () => api.delete(`/friends/requests/${encodeURIComponent(requestId)}`),
                'Запрос отменён',
              );
            }}
          >
            Отменить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (status === 'pending_received') {
    return (
      <div className="flex flex-wrap gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              className="bg-emerald-600 text-white hover:bg-emerald-600/90"
              disabled={!requestId || busy}
              onClick={() => {
                if (!requestId) return;
                void run(
                  () => api.post(`/friends/accept/${encodeURIComponent(requestId)}`),
                  'Запрос принят',
                );
              }}
            >
              <Check className="mr-1.5 h-4 w-4" />
              Принять
            </Button>
          </TooltipTrigger>
          <TooltipContent>Принять запрос в друзья</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="destructive"
              disabled={!requestId || busy}
              onClick={() => {
                if (!requestId) return;
                void run(
                  () => api.post(`/friends/reject/${encodeURIComponent(requestId)}`),
                  'Запрос отклонён',
                );
              }}
            >
              Отклонить
            </Button>
          </TooltipTrigger>
          <TooltipContent>Отклонить запрос</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  if (status === 'friends') {
    return (
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="secondary" disabled={busy}>
                Друзья
                <MoreHorizontal className="ml-1.5 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>Управление дружбой</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            disabled={busy}
            onSelect={() =>
              void run(
                () => api.delete(`/friends/${encodeURIComponent(username)}`),
                'Пользователь удалён из друзей',
              )
            }
          >
            <UserMinus className="mr-2 h-4 w-4" />
            Удалить
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={busy}
            onSelect={() =>
              void run(
                () => api.post(`/friends/block/${encodeURIComponent(username)}`),
                'Пользователь заблокирован',
              )
            }
          >
            <UserX className="mr-2 h-4 w-4" />
            Заблокировать
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (status === 'blocked_by_me') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() =>
              void run(
                () => api.delete(`/friends/block/${encodeURIComponent(username)}`),
                'Пользователь разблокирован',
              )
            }
          >
            Разблокировать
          </Button>
        </TooltipTrigger>
        <TooltipContent>Убрать из чёрного списка</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button size="sm" variant="secondary" disabled>
          Пользователь недоступен
        </Button>
      </TooltipTrigger>
      <TooltipContent>Вы в чёрном списке этого пользователя</TooltipContent>
    </Tooltip>
  );
}
