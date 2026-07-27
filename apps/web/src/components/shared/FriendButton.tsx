'use client';

import type { FriendshipRelationStatus } from '@twomc/shared';
import { Check, Clock, MoreHorizontal, UserMinus, UserPlus, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import {
  useAcceptFriendRequest,
  useBlockUser,
  useCancelFriendRequest,
  useFriendStatus,
  useRejectFriendRequest,
  useRemoveFriend,
  useSendFriendRequest,
  useUnblockUser,
} from '@/hooks/useFriendsQueries';
import { extractErrorMessage } from '@/lib/api';

interface FriendButtonProps {
  username: string;
  onChanged?: () => void;
}

export function FriendButton({ username, onChanged }: FriendButtonProps) {
  const { isAuthenticated } = useAuth();
  const statusQuery = useFriendStatus(username, isAuthenticated);
  const sendRequest = useSendFriendRequest();
  const acceptRequest = useAcceptFriendRequest();
  const rejectRequest = useRejectFriendRequest();
  const cancelRequest = useCancelFriendRequest();
  const removeFriend = useRemoveFriend();
  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();

  const status = statusQuery.data?.status ?? null;
  const requestId = statusQuery.data?.requestId ?? null;
  const busy =
    sendRequest.isPending ||
    acceptRequest.isPending ||
    rejectRequest.isPending ||
    cancelRequest.isPending ||
    removeFriend.isPending ||
    blockUser.isPending ||
    unblockUser.isPending;

  const run = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action();
      toast.success(success);
      await statusQuery.refetch();
      onChanged?.();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось выполнить действие'));
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (statusQuery.isLoading) {
    return <Skeleton className="h-9 w-36" />;
  }

  if (status === null || status === 'self') {
    return null;
  }

  if (status === 'none') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            disabled={busy}
            onClick={() => void run(() => sendRequest.mutateAsync(username), 'Запрос в друзья отправлен')}
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
              void run(() => cancelRequest.mutateAsync(requestId), 'Запрос отменён');
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
                void run(() => acceptRequest.mutateAsync(requestId), 'Запрос принят');
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
                void run(() => rejectRequest.mutateAsync(requestId), 'Запрос отклонён');
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
            onSelect={() => void run(() => removeFriend.mutateAsync(username), 'Пользователь удалён из друзей')}
          >
            <UserMinus className="mr-2 h-4 w-4" />
            Удалить
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={busy}
            onSelect={() => void run(() => blockUser.mutateAsync(username), 'Пользователь заблокирован')}
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
            onClick={() => void run(() => unblockUser.mutateAsync(username), 'Пользователь разблокирован')}
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

// keep type export for consumers that narrow on status strings
export type { FriendshipRelationStatus };
