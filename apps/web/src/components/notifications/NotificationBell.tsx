'use client';

import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { SwipeableNotificationItem } from '@/components/notifications/SwipeableNotificationItem';
import { EmptyState } from '@/components/shared/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationsCount,
} from '@/hooks/useNotifications';
import { extractErrorMessage } from '@/lib/api';

export function NotificationBell() {
  const unread = useUnreadNotificationsCount(true);
  const list = useNotifications({ page: 1, limit: 15, enabled: true });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const remove = useDeleteNotification();

  const count = unread.data?.count ?? 0;
  const items = list.data?.items ?? [];
  const { fresh, read } = useMemo(() => {
    const freshItems = items.filter((n) => !n.isRead);
    const readItems = items.filter((n) => n.isRead);
    return { fresh: freshItems, read: readItems };
  }, [items]);

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
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

      <DropdownMenuContent align="end" className="w-[320px] p-0">
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
        <DropdownMenuSeparator className="m-0" />

        <div className="max-h-96 space-y-1.5 overflow-y-auto p-2">
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
                <div className="space-y-1.5">
                  <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                    Новые
                  </p>
                  {fresh.map((n) => (
                    <SwipeableNotificationItem
                      key={n.id}
                      notification={n}
                      compact
                      onRead={(id) => markRead.mutateAsync(id)}
                      onDelete={(id) => remove.mutateAsync(id)}
                    />
                  ))}
                </div>
              ) : null}
              {read.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Прочитанные
                  </p>
                  {read.map((n) => (
                    <SwipeableNotificationItem
                      key={n.id}
                      notification={n}
                      compact
                      onRead={(id) => markRead.mutateAsync(id)}
                      onDelete={(id) => remove.mutateAsync(id)}
                    />
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>

        <DropdownMenuSeparator className="m-0" />
        <div className="p-2">
          <Button asChild variant="secondary" size="sm" className="w-full">
            <Link href="/profile/notifications">Все уведомления</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
