'use client';

import type { ChatLinkPreview, ChatMessage } from '@twomc/shared';
import { CHAT_REACTION_EMOJIS } from '@twomc/shared';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Copy, Pin, Reply, Smile, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ColoredUsername } from '@/components/shared/ColoredUsername';
import { PositionBadge } from '@/components/shared/PositionBadge';
import { SkinHead } from '@/components/shared/SkinHead';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const EMOJI_LABELS: Record<string, string> = {
  thumbs_up: '👍',
  heart: '❤️',
  laugh: '😂',
  wow: '😮',
  sad: '😢',
  angry: '😠',
  party: '🥳',
  fire: '🔥',
};

interface MessageBubbleProps {
  message: ChatMessage;
  currentUserId?: string;
  canModerate?: boolean;
  onReply?: (message: ChatMessage) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onRemoveReact?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onPin?: (messageId: string, unpin?: boolean) => void;
}

function LinkPreview({ link }: { link: ChatLinkPreview }) {
  if (link.type === 'youtube' && link.embedId) {
    return (
      <div className="mt-2 overflow-hidden rounded-lg border border-border">
        <iframe
          title="YouTube"
          src={`https://www.youtube.com/embed/${link.embedId}`}
          className="aspect-video w-full"
          allowFullScreen
        />
      </div>
    );
  }
  if (link.type === 'twitch' && link.embedId) {
    return (
      <div className="mt-2 overflow-hidden rounded-lg border border-border">
        <iframe
          title="Twitch"
          src={`https://player.twitch.tv/?${link.embedId}&parent=${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}`}
          className="aspect-video w-full"
          allowFullScreen
        />
      </div>
    );
  }
  if (link.type === 'imgur' && link.imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={link.imageUrl} alt="" className="mt-2 max-h-64 rounded-lg" />;
  }
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noreferrer"
      className="mt-2 block truncate text-sm text-primary hover:underline"
    >
      {link.title ?? link.url}
    </a>
  );
}

export function MessageBubble({
  message,
  currentUserId,
  canModerate,
  onReply,
  onReact,
  onRemoveReact,
  onDelete,
  onPin,
}: MessageBubbleProps) {
  const [showPicker, setShowPicker] = useState(false);
  const isOwn = message.authorId === currentUserId;

  const copy = async () => {
    await navigator.clipboard.writeText(message.content);
    toast.success('Скопировано');
  };

  return (
    <div
      className={cn(
        'group relative rounded-lg px-2 py-1.5 hover:bg-accent/30',
        message.isPinned && 'bg-amber-500/5',
      )}
    >
      {message.parent ? (
        <button
          type="button"
          className="mb-1 block max-w-full truncate border-l-2 border-primary/50 pl-2 text-xs text-muted-foreground"
          onClick={() => onReply?.(message)}
        >
          Ответ {message.parent.author?.username}: {message.parent.content.slice(0, 80)}
        </button>
      ) : null}

      <div className="flex gap-2">
        <SkinHead username={message.author?.username ?? 'Steve'} size={32} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {message.author?.position ? (
              <ColoredUsername
                user={{
                  username: message.author.username,
                  position: message.author.position,
                }}
                size="sm"
              />
            ) : (
              <span className="text-sm font-semibold text-white">
                {message.author?.username ?? 'Система'}
              </span>
            )}
            {message.author?.position ? (
              <PositionBadge position={message.author.position} />
            ) : null}
            {message.isPinned ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Pin className="h-3.5 w-3.5 text-amber-400" />
                </TooltipTrigger>
                <TooltipContent>Закреплено</TooltipContent>
              </Tooltip>
            ) : null}
            <span className="text-[11px] text-muted-foreground">
              {format(new Date(message.createdAt), 'HH:mm', { locale: ru })}
              {message.isEdited ? ' (изм.)' : ''}
            </span>
          </div>

          {message.isDeleted ? (
            <p className="text-sm italic text-muted-foreground">Сообщение удалено</p>
          ) : (
            <div
              className="prose prose-invert prose-sm max-w-none break-words [&_.mention]:text-primary [&_.spoiler]:cursor-pointer [&_.spoiler]:rounded [&_.spoiler]:bg-muted [&_.spoiler]:text-transparent hover:[&_.spoiler]:bg-transparent hover:[&_.spoiler]:text-foreground"
              dangerouslySetInnerHTML={{ __html: message.contentHtml }}
            />
          )}

          {!message.isDeleted &&
            message.metadata?.links?.map((link) => (
              <LinkPreview key={link.url} link={link} />
            ))}

          {message.reactions.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {message.reactions.map((r) => (
                <Tooltip key={r.emoji}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        'rounded-md border px-1.5 py-0.5 text-xs',
                        r.reactedByMe
                          ? 'border-primary/50 bg-primary/15'
                          : 'border-border bg-secondary/40',
                      )}
                      onClick={() =>
                        r.reactedByMe
                          ? onRemoveReact?.(message.id)
                          : onReact?.(message.id, r.emoji)
                      }
                    >
                      {EMOJI_LABELS[r.emoji] ?? r.emoji} {r.count}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{r.emoji}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {!message.isDeleted ? (
        <div className="absolute right-1 top-1 hidden gap-0.5 group-hover:flex">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onReply?.(message)}>
                <Reply className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ответить</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => setShowPicker((v) => !v)}
              >
                <Smile className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Реакция</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => void copy()}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Копировать</TooltipContent>
          </Tooltip>
          {canModerate ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => onPin?.(message.id, message.isPinned)}
                >
                  <Pin className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{message.isPinned ? 'Открепить' : 'Закрепить'}</TooltipContent>
            </Tooltip>
          ) : null}
          {isOwn || canModerate ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => onDelete?.(message.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Удалить</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      ) : null}

      {showPicker ? (
        <div className="mt-1 flex flex-wrap gap-1 rounded-md border border-border bg-card p-1">
          {CHAT_REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="rounded px-1.5 py-0.5 hover:bg-accent"
              onClick={() => {
                onReact?.(message.id, emoji);
                setShowPicker(false);
              }}
            >
              {EMOJI_LABELS[emoji]}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
