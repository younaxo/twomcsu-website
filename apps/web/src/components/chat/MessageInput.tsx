'use client';

import type { ChatMessage } from '@twomc/shared';
import { Info, Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MessageInputProps {
  disabled?: boolean;
  muteMessage?: string | null;
  replyTo?: ChatMessage | null;
  onCancelReply?: () => void;
  onSend: (content: string) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  onMentionInsert?: (username: string) => void;
  mentionSuggestion?: string | null;
}

const MARKDOWN_HELP = [
  { code: '**жирный текст**', desc: 'жирный' },
  { code: '*курсив*', desc: 'курсив' },
  { code: '~~зачёркнутый~~', desc: 'зачёркнутый' },
  { code: '`код`', desc: 'инлайн код' },
  { code: '> цитата', desc: 'цитата' },
  { code: '||спойлер||', desc: 'спойлер' },
  { code: '[ссылка](https://...)', desc: 'ссылка' },
  { code: '@ник', desc: 'упоминание пользователя' },
] as const;

export function MessageInput({
  disabled,
  muteMessage,
  replyTo,
  onCancelReply,
  onSend,
  onTypingStart,
  onTypingStop,
}: MessageInputProps) {
  const [value, setValue] = useState('');
  const typingRef = useRef(false);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (replyTo) taRef.current?.focus();
  }, [replyTo]);

  const submit = () => {
    const content = value.trim();
    if (!content || disabled || muteMessage) return;
    onSend(content);
    setValue('');
    onTypingStop?.();
    typingRef.current = false;
  };

  const onChange = (next: string) => {
    setValue(next);
    if (!typingRef.current) {
      typingRef.current = true;
      onTypingStart?.();
    }
    if (stopTimer.current) clearTimeout(stopTimer.current);
    stopTimer.current = setTimeout(() => {
      typingRef.current = false;
      onTypingStop?.();
    }, 1500);
  };

  if (muteMessage) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {muteMessage}
      </div>
    );
  }

  return (
    <div className="space-y-2 border-t border-border pt-3">
      {replyTo ? (
        <div className="flex items-center justify-between rounded-md bg-secondary/50 px-2 py-1 text-xs">
          <span className="truncate text-muted-foreground">
            Ответ на {replyTo.author?.username}: {replyTo.content.slice(0, 60)}
          </span>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onCancelReply}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : null}

      <div className="flex gap-2">
        <Textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Написать сообщение… (@ник для упоминания)"
          className="min-h-[44px] max-h-32 resize-none"
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <div className="flex shrink-0 flex-col gap-1">
          <Dialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 cursor-help"
                    aria-label="Форматирование"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent>Как форматировать</TooltipContent>
            </Tooltip>
            <DialogContent className="border-white/10 bg-[rgba(15,15,20,0.9)] backdrop-blur-[30px] sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Как форматировать сообщения</DialogTitle>
              </DialogHeader>
              <ul className="space-y-2 text-sm">
                {MARKDOWN_HELP.map((row) => (
                  <li key={row.code} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
                    <code className="shrink-0 rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-primary">
                      {row.code}
                    </code>
                    <span className="text-muted-foreground">— {row.desc}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-muted-foreground">
                Также поддерживаются списки (<code className="text-xs">- пункт</code>) и
                многострочный код (<code className="text-xs">```code```</code>).
              </p>
            </DialogContent>
          </Dialog>
          <Button
            type="button"
            size="icon"
            className="shrink-0"
            disabled={disabled || !value.trim()}
            onClick={submit}
            aria-label="Отправить"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
