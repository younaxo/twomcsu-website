'use client';

import type { AppNotification } from '@twomc/shared';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Check, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { extractErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

const SWIPE_THRESHOLD = 88;

interface SwipeableNotificationItemProps {
  notification: AppNotification;
  onRead: (id: string) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  compact?: boolean;
}

export function SwipeableNotificationItem({
  notification,
  onRead,
  onDelete,
  compact,
}: SwipeableNotificationItemProps) {
  const startX = useRef(0);
  const offsetRef = useRef(0);
  const dragging = useRef(false);
  const [offset, setOffset] = useState(0);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    offsetRef.current = 0;
    setOffset(0);
  };

  const finish = async (dx: number) => {
    if (busy) {
      reset();
      return;
    }

    // Swipe left → read, swipe right → delete
    if (dx <= -SWIPE_THRESHOLD && !notification.isRead) {
      setBusy(true);
      try {
        await onRead(notification.id);
        toast.success('Прочитано');
      } catch (error) {
        toast.error(extractErrorMessage(error, 'Не удалось отметить'));
      } finally {
        setBusy(false);
        reset();
      }
      return;
    }

    if (dx >= SWIPE_THRESHOLD) {
      setBusy(true);
      try {
        await onDelete(notification.id);
        toast.success('Удалено');
      } catch (error) {
        toast.error(extractErrorMessage(error, 'Не удалось удалить'));
      } finally {
        setBusy(false);
        reset();
      }
      return;
    }

    reset();
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragging.current = true;
    startX.current = e.clientX;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = Math.max(-140, Math.min(140, e.clientX - startX.current));
    offsetRef.current = dx;
    setOffset(dx);
  };

  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    void finish(offsetRef.current);
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Swipe right reveals delete; swipe left reveals read */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 flex w-24 items-center justify-center bg-destructive/80 text-white"
        aria-hidden
      >
        <Trash2 className="h-5 w-5" />
      </div>
      <div
        className="pointer-events-none absolute inset-y-0 right-0 flex w-24 items-center justify-center bg-emerald-500/80 text-white"
        aria-hidden
      >
        <Check className="h-5 w-5" />
      </div>

      <div
        className={cn(
          'relative touch-pan-y rounded-xl border border-white/10 bg-[rgba(30,30,40,0.55)] backdrop-blur-[20px] transition-transform',
          !notification.isRead && 'border-primary/30 bg-primary/10',
          busy && 'opacity-70',
        )}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={reset}
      >
        <Link
          href={notification.link || '/profile/notifications'}
          onClick={(e) => {
            if (Math.abs(offset) > 8) {
              e.preventDefault();
              return;
            }
            if (!notification.isRead) void onRead(notification.id);
          }}
          className={cn('block cursor-pointer px-4 py-3', compact && 'px-2.5 py-2')}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-0.5">
              <p className={cn('truncate font-semibold text-white', compact ? 'text-sm' : 'text-base')}>
                {notification.title}
              </p>
              {notification.message ? (
                <p className={cn('text-muted-foreground', compact ? 'line-clamp-2 text-xs' : 'text-sm')}>
                  {notification.message}
                </p>
              ) : null}
              <p className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                  locale: ru,
                })}
              </p>
            </div>
            {!notification.isRead ? (
              <Badge variant="destructive" className="shrink-0">
                Новое
              </Badge>
            ) : null}
          </div>
        </Link>
      </div>
    </div>
  );
}
