'use client';

import type { AppNotification } from '@twomc/shared';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function NotificationCard({
  notification,
  onRead,
  onDelete,
}: {
  notification: AppNotification;
  onRead?: () => void;
  onDelete?: () => void;
}) {
  const href = notification.actionUrl || notification.link || '/profile/notifications';
  const isUrgent = notification.priority === 'URGENT' || notification.priority === 'HIGH';

  return (
    <article
      className={cn(
        'rounded-xl glass-light p-4 transition',
        !notification.isRead && 'border border-white/10',
        notification.priority === 'URGENT' && 'border-red-500/40',
      )}
    >
      <div className="flex gap-3">
        <div className="relative shrink-0">
          {notification.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={notification.imageUrl}
              alt=""
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm">
              !
            </div>
          )}
          {isUrgent && !notification.isRead ? (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
          ) : null}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-sm font-medium text-white">{notification.title}</h3>
            <time className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
                locale: ru,
              })}
            </time>
          </div>
          {notification.message ? (
            <p className="text-sm text-muted-foreground">{notification.message}</p>
          ) : null}
          {notification.metadata && typeof notification.metadata.count === 'number' ? (
            <p className="text-xs text-[#F57C00]">
              Сгруппировано: {String(notification.metadata.count)}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild size="sm" className="bg-[#F57C00] text-black hover:bg-[#E65100]">
              <Link href={href} onClick={onRead}>
                {notification.actionLabel ?? 'Открыть'}
              </Link>
            </Button>
            {!notification.isRead && onRead ? (
              <Button type="button" size="sm" variant="ghost" onClick={onRead}>
                Прочитано
              </Button>
            ) : null}
            {onDelete ? (
              <Button type="button" size="sm" variant="ghost" onClick={onDelete}>
                Удалить
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
