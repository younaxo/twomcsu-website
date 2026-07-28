'use client';

import type { ChatMessage } from '@twomc/shared';
import { Info, Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';

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
  { syn: '**текст**', desc: 'Жирный' },
  { syn: '*текст*', desc: 'Курсив' },
  { syn: '~~текст~~', desc: 'Зачёркнутый' },
  { syn: '||текст||', desc: 'Спойлер' },
  { syn: '`код`', desc: 'Код' },
  { syn: '> цитата', desc: 'Цитата' },
  { syn: '@ник', desc: 'Упоминание' },
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

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const max = 5 * 24; // ~5 lines
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
  }, [value]);

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
    <div className="space-y-2 border-t border-white/10 pt-3">
      {replyTo ? (
        <div className="flex items-center justify-between rounded-md glass-light px-2 py-1 text-xs">
          <span className="truncate text-muted-foreground">
            Ответ на {replyTo.author?.username}: {replyTo.content.slice(0, 60)}
          </span>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onCancelReply}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : null}

      <div className="relative flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Textarea
            ref={taRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Написать сообщение… (@ник для упоминания)"
            className="min-h-[44px] max-h-[120px] resize-none pr-10"
            rows={1}
            disabled={disabled}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="absolute bottom-1.5 right-1.5 h-7 w-7 text-muted-foreground"
                aria-label="Справка по разметке"
              >
                <Info className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 space-y-1 p-3">
              <p className="mb-2 text-xs font-medium text-white">Разметка сообщений</p>
              {MARKDOWN_HELP.map((row) => (
                <div key={row.syn} className="flex items-center justify-between gap-2 text-xs">
                  <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[11px] text-primary">
                    {row.syn}
                  </code>
                  <span className="text-muted-foreground">{row.desc}</span>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Button
          type="button"
          size="icon"
          className="shrink-0 self-end"
          disabled={disabled || !value.trim()}
          onClick={submit}
          aria-label="Отправить"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
