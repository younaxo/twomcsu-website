'use client';

import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { SwipeableNotificationItem } from '@/components/notifications/SwipeableNotificationItem';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/hooks/useNotifications';
import { extractErrorMessage } from '@/lib/api';

type Filter = 'all' | 'unread';

export default function NotificationsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(1);
  const list = useNotifications({
    page,
    limit: 20,
    unreadOnly: filter === 'unread',
    enabled: isAuthenticated,
  });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const remove = useDeleteNotification();

  if (authLoading) return <Skeleton className="h-64 w-full" />;

  if (!isAuthenticated) {
    return (
      <EmptyState
        icon={Bell}
        title="Уведомления"
        description="Войдите, чтобы видеть уведомления"
        action={
          <Button asChild>
            <Link href="/login">Войти</Link>
          </Button>
        }
      />
    );
  }

  const items = list.data?.items ?? [];
  const totalPages = list.data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Уведомления</h1>
          <p className="text-sm text-muted-foreground">
            Свайп влево — прочитать, вправо — удалить
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={markAll.isPending}
          onClick={() => {
            void markAll
              .mutateAsync()
              .then(() => toast.success('Все уведомления прочитаны'))
              .catch((error: unknown) => {
                console.error('markAllNotificationsRead failed', error);
                toast.error(extractErrorMessage(error, 'Не удалось отметить уведомления'));
              });
          }}
        >
          Прочитать все
        </Button>
      </div>

      <Tabs
        value={filter}
        onValueChange={(v) => {
          setFilter(v as Filter);
          setPage(1);
        }}
      >
        <TabsList>
          <TabsTrigger value="all">Все</TabsTrigger>
          <TabsTrigger value="unread">Непрочитанные</TabsTrigger>
        </TabsList>
      </Tabs>

      {list.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Пока пусто"
          description={
            filter === 'unread' ? 'Нет непрочитанных уведомлений' : 'Уведомлений пока нет'
          }
        />
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <SwipeableNotificationItem
              key={n.id}
              notification={n}
              onRead={(id) => markRead.mutateAsync(id)}
              onDelete={(id) => remove.mutateAsync(id)}
            />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Назад
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Далее
          </Button>
        </div>
      ) : null}
    </div>
  );
}
