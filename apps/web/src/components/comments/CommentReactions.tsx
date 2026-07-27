'use client';

import {
  COMMENT_EMOJI_CHARS,
  COMMENT_EMOJI_LABELS,
  COMMENT_EMOJIS,
  type CommentEmoji,
  type CommentReactionSummary,
} from '@twomc/shared';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface CommentReactionsProps {
  reactions: CommentReactionSummary[];
  disabled?: boolean;
  onToggle: (emoji: CommentEmoji) => void;
}

export function CommentReactions({ reactions, disabled, onToggle }: CommentReactionsProps) {
  const byEmoji = new Map(reactions.map((reaction) => [reaction.emoji, reaction]));

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {COMMENT_EMOJIS.map((emoji) => {
        const current = byEmoji.get(emoji);
        const count = current?.count ?? 0;
        const reacted = current?.reacted ?? false;
        const users = current?.users.map((user) => user.username).filter(Boolean) ?? [];

        return (
          <Tooltip key={emoji}>
            <TooltipTrigger asChild>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onToggle(emoji)}
                className={cn(
                  'inline-flex h-8 items-center gap-1 rounded-full border px-2 text-sm transition-colors',
                  reacted
                    ? 'border-primary/50 bg-primary/10 text-foreground'
                    : 'border-border bg-secondary/40 text-muted-foreground hover:bg-secondary',
                  disabled && 'cursor-not-allowed opacity-60',
                )}
              >
                <span aria-hidden>{COMMENT_EMOJI_CHARS[emoji]}</span>
                {count > 0 ? <span className="tabular-nums">{count}</span> : null}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{COMMENT_EMOJI_LABELS[emoji]}</p>
              {users.length > 0 ? (
                <p className="text-xs text-muted-foreground">{users.slice(0, 5).join(', ')}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Нажмите, чтобы отреагировать</p>
              )}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
