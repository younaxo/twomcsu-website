'use client';

import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { LucideIcon } from 'lucide-react';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ActivityFeedItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string | Date;
  icon?: LucideIcon;
  actor?: string;
}

interface ActivityFeedProps {
  title?: string;
  items: ActivityFeedItem[];
  emptyMessage?: string;
  className?: string;
  maxItems?: number;
}

export function ActivityFeed({
  title = 'Последняя активность',
  items,
  emptyMessage = 'Активности пока нет',
  className,
  maxItems,
}: ActivityFeedProps) {
  const visible = maxItems ? items.slice(0, maxItems) : items;

  return (
    <div className={cn('rounded-2xl glass-medium p-4', className)}>
      <h2 className="mb-3 text-sm font-medium text-white">{title}</h2>

      {visible.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ul className="space-y-3">
          {visible.map((item) => {
            const Icon = item.icon ?? Activity;
            const when =
              typeof item.timestamp === 'string'
                ? new Date(item.timestamp)
                : item.timestamp;

            return (
              <li
                key={item.id}
                className="flex gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5">
                  <Icon className="h-4 w-4 text-[#F57C00]" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  {item.description ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.actor ? `${item.actor} · ` : ''}
                    {formatDistanceToNow(when, { addSuffix: true, locale: ru })}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
