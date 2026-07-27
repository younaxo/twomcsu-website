'use client';

import type { ChatMessage } from '@twomc/shared';
import { Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MessageInputProps {
  disabled?: boolean;
  muteMessage?: string | null;
  slowModeSeconds?: number | null;
  replyTo?: ChatMessage | null;
  onCancelReply?: () => void;
  onSend: (content: string) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  onMentionInsert?: (username: string) => void;
  mentionSuggestion?: string | null;
}

export function MessageInput({
  disabled,
  muteMessage,
  slowModeSeconds,
  replyTo,
  onCancelReply,
  onSend,
  onTypingStart,
  onTypingStop,
}: MessageInputProps) {
  const [value, setValue] = useState('');
  const [wait, setWait] = useState(0);
  const typingRef = useRef(false);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!slowModeSeconds || slowModeSeconds <= 0) {
      setWait(0);
      return;
    }
    setWait(slowModeSeconds);
    const t = setInterval(() => {
      setWait((w) => Math.max(0, w - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [slowModeSeconds]);

  useEffect(() => {
    if (replyTo) taRef.current?.focus();
  }, [replyTo]);

  const insertFormat = (prefix: string, suffix = prefix) => {
    const el = taRef.current;
    if (!el) {
      setValue((v) => `${v}${prefix}${suffix}`);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || 'текст';
    const next = value.slice(0, start) + prefix + selected + suffix + value.slice(end);
    setValue(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    });
  };

  const submit = () => {
    const content = value.trim();
    if (!content || disabled || wait > 0 || muteMessage) return;
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

      <div className="flex flex-wrap gap-1">
        {[
          { label: 'B', tip: 'Жирный', action: () => insertFormat('**') },
          { label: 'I', tip: 'Курсив', action: () => insertFormat('*') },
          { label: 'S', tip: 'Зачёркнутый', action: () => insertFormat('~~') },
          { label: '||', tip: 'Спойлер', action: () => insertFormat('||') },
          { label: '`', tip: 'Код', action: () => insertFormat('`') },
          { label: '>', tip: 'Цитата', action: () => insertFormat('> ', '') },
        ].map((btn) => (
          <Tooltip key={btn.tip}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2 font-mono text-xs"
                onClick={btn.action}
              >
                {btn.label}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{btn.tip}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      <div className="flex gap-2">
        <Textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Написать сообщение… (@ник для упоминания)"
          className="min-h-[44px] max-h-32 resize-none"
          disabled={disabled || wait > 0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <Button
          type="button"
          size="icon"
          className="shrink-0"
          disabled={disabled || wait > 0 || !value.trim()}
          onClick={submit}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {wait > 0 ? (
        <p className="text-xs text-muted-foreground">
          Следующее сообщение через {wait} сек.
        </p>
      ) : null}
    </div>
  );
}
