'use client';

import type { ReportMessage as ReportMessageType } from '@twomc/shared';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { AvatarWithSkin } from '@/components/shared/AvatarWithSkin';
import { ColoredUsername } from '@/components/shared/ColoredUsername';
import { cn } from '@/lib/utils';

export function ReportMessagesList({
  messages,
  className,
}: {
  messages: ReportMessageType[];
  className?: string;
}) {
  if (messages.length === 0) {
    return (
      <p className={cn('text-sm text-muted-foreground', className)}>
        Сообщений пока нет
      </p>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {messages.map((message) => {
        if (message.isSystem) {
          return (
            <div
              key={message.id}
              className="rounded-lg bg-white/5 px-4 py-2 text-center text-sm text-neutral-400"
            >
              {message.content}
              <span className="ml-2 text-xs opacity-70">
                {format(new Date(message.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
              </span>
            </div>
          );
        }

        return (
          <article
            key={message.id}
            className={cn(
              'rounded-xl glass-light p-4',
              message.isInternal && 'border border-amber-400/40 bg-amber-500/10',
            )}
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <AvatarWithSkin user={message.author} size="sm" />
              <ColoredUsername user={message.author} size="sm" />
              {message.isStaff ? (
                <Badge variant="secondary" className="text-[10px]">
                  Модератор
                </Badge>
              ) : null}
              {message.isInternal ? (
                <Badge className="bg-amber-500/20 text-[10px] text-amber-200">
                  Внутренняя заметка
                </Badge>
              ) : null}
              <span className="ml-auto text-xs text-muted-foreground">
                {format(new Date(message.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
              </span>
            </div>
            {message.contentHtml ? (
              <div
                className="prose prose-invert max-w-none text-sm"
                dangerouslySetInnerHTML={{ __html: message.contentHtml }}
              />
            ) : (
              <p className="whitespace-pre-wrap text-sm text-neutral-200">{message.content}</p>
            )}
          </article>
        );
      })}
    </div>
  );
}
