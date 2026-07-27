'use client';

import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Bell } from 'lucide-react';
import Link from 'next/link';
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
import { cn } from '@/lib/utils';

export function NotificationBell() {
  const unread = useUnreadNotificationsCount(true);
  const list = useNotifications({ page: 1, limit: 10, enabled: true });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const count = unread.data?.count ?? 0;
  const items = list.data?.items ?? [];

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

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0">Уведомления</DropdownMenuLabel>
          {count > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              disabled={markAll.isPending}
              onClick={() => void markAll.mutateAsync()}
            >
              Прочитать все
            </Button>
          ) : null}
        </div>
        <DropdownMenuSeparator className="m-0" />

        <div className="max-h-80 overflow-y-auto">
          {list.isLoading ? (
            <div className="space-y-2 p-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : items.length === 0 ? (
            <div className="p-2">
              <EmptyState
                icon={Bell}
                title="Нет уведомлений"
                description="Здесь появятся новые события"
                className="border-0 bg-transparent py-8"
              />
            </div>
          ) : (
            items.map((n) => (
              <DropdownMenuItem
                key={n.id}
                asChild
                className={cn(
                  'cursor-pointer rounded-none px-3 py-2.5 focus:bg-accent',
                  !n.isRead && 'bg-primary/5',
                )}
              >
                <Link
                  href={n.link || '/profile/notifications'}
                  onClick={() => {
                    if (!n.isRead) void markRead.mutateAsync(n.id);
                  }}
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="truncate text-sm font-medium text-white">{n.title}</p>
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
            ))
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
