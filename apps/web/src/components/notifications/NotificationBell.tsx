'use client';

import { Bell, Settings } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationsCount,
} from '@/hooks/useNotifications';
import { extractErrorMessage } from '@/lib/api';

type BellTab = 'all' | 'unread' | 'priority';

export function NotificationBell() {
  const [tab, setTab] = useState<BellTab>('all');
  const unread = useUnreadNotificationsCount(true);
  const list = useNotifications({ page: 1, limit: 15, enabled: true });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const remove = useDeleteNotification();

  const count = unread.data?.count ?? 0;
  const items = list.data?.items ?? [];
  const visible = useMemo(() => {
    if (tab === 'unread') return items.filter((n) => !n.isRead);
    if (tab === 'priority') {
      return items.filter((n) => n.priority === 'HIGH' || n.priority === 'URGENT');
    }
    return items;
  }, [items, tab]);
  const { fresh, read } = useMemo(() => {
    const freshItems = visible.filter((n) => !n.isRead);
    const readItems = visible.filter((n) => n.isRead);
    return { fresh: freshItems, read: readItems };
  }, [visible]);

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
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" asChild>
              <Link href="/profile/settings?tab=notifications" aria-label="Настройки">
                <Settings className="h-3.5 w-3.5" />
              </Link>
            </Button>
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
        </div>
        <div className="px-2 pb-2">
          <Tabs value={tab} onValueChange={(value) => setTab(value as BellTab)}>
            <TabsList className="grid h-8 w-full grid-cols-3">
              <TabsTrigger value="all" className="text-xs">
                Все
              </TabsTrigger>
              <TabsTrigger value="unread" className="text-xs">
                Новые
              </TabsTrigger>
              <TabsTrigger value="priority" className="text-xs">
                Важные
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <DropdownMenuSeparator className="m-0 bg-white/10" />

        <div className="max-h-96 space-y-1.5 overflow-y-auto p-2">
          {list.isLoading ? (
            <div className="space-y-2 p-1">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : visible.length === 0 ? (
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
