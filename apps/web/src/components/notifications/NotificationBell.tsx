'use client';

import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationsCount,
} from '@/hooks/useNotifications';
import { extractErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

export function NotificationBell() {
  const unread = useUnreadNotificationsCount(true);
  const list = useNotifications({ page: 1, limit: 15, enabled: true });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const count = unread.data?.count ?? 0;
  const items = list.data?.items ?? [];
  const { fresh, read } = useMemo(() => {
    const freshItems = items.filter((n) => !n.isRead);
    const readItems = items.filter((n) => n.isRead);
    return { fresh: freshItems, read: readItems };
  }, [items]);

  const renderItem = (n: (typeof items)[number]) => (
    <DropdownMenuItem
      key={n.id}
      asChild
      className={cn(
        'cursor-pointer rounded-lg px-2.5 py-2 focus:bg-white/10',
        !n.isRead && 'bg-primary/10',
      )}
    >
      <Link
        href={n.link || '/profile/notifications'}
        onClick={() => {
          if (!n.isRead) void markRead.mutateAsync(n.id);
        }}
        className="block w-full"
      >
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="truncate text-sm font-semibold text-white">{n.title}</p>
          {n.message ? (
            <p className="line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
          ) : null}
          <p className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(n.createdAt), {
              addSuffix: true,
              locale: ru,
            })}
          </p>
        </div>
      </Link>
    </DropdownMenuItem>
  );

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative cursor-pointer text-[#b0b0b0] hover:text-white"
            >
              <Bell className="h-4 w-4" />
              {count > 0 ? (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-5 min-w-5 justify-center px-1 text-[10px]"
                >
                  {count > 99 ? '99+' : count}
                </Badge>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Уведомления</TooltipContent>
      </Tooltip>

      <DropdownMenuContent
        align="end"
        className="w-[320px] border-white/10 bg-[rgba(15,15,20,0.85)] p-0 backdrop-blur-[24px]"
      >
        <div className="flex items-center justify-between px-3 py-2.5">
          <DropdownMenuLabel className="p-0 text-base">Уведомления</DropdownMenuLabel>
          {count > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              disabled={markAll.isPending}
              onClick={() => {
                void markAll
                  .mutateAsync()
                  .then(() => toast.success('Все уведомления прочитаны'))
                  .catch((error: unknown) => {
                    toast.error(extractErrorMessage(error, 'Не удалось отметить уведомления'));
                  });
              }}
            >
              Прочитать все
            </Button>
          ) : null}
        </div>
        <DropdownMenuSeparator className="m-0 bg-white/10" />

        <div className="max-h-96 space-y-1 overflow-y-auto p-2">
          {list.isLoading ? (
            <div className="space-y-2 p-1">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="Нет уведомлений"
              description="Здесь появятся новые события"
              className="border-0 bg-transparent py-8"
            />
          ) : (
            <>
              {fresh.length > 0 ? (
                <div className="space-y-1">
                  <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                    Новые
                  </p>
                  {fresh.map(renderItem)}
                </div>
              ) : null}
              {read.length > 0 ? (
                <div className="space-y-1">
                  <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Прочитанные
                  </p>
                  {read.map(renderItem)}
                </div>
              ) : null}
            </>
          )}
        </div>

        <DropdownMenuSeparator className="m-0 bg-white/10" />
        <div className="p-2">
          <Button asChild variant="secondary" size="sm" className="w-full">
            <Link href="/profile/notifications">Все уведомления</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
