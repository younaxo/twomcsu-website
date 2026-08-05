'use client';

import {
  ACTIVITY_EMOJI_CHARS,
  ACTIVITY_EMOJI_LABELS,
  ACTIVITY_EMOJIS,
  type ActivityEmoji,
  type ActivityReactionSummary,
} from '@twomc/shared';
import { Plus } from 'lucide-react';
import { Emoji, type AppleEmojiName } from '@/components/shared/Emoji';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const APPLE_SET = new Set([
  'thumbs_up',
  'heart',
  'laugh',
  'wow',
  'party',
  'fire',
]);

function ReactionGlyph({ emoji, size = 16 }: { emoji: ActivityEmoji; size?: number }) {
  if (APPLE_SET.has(emoji)) {
    return (
      <Emoji
        name={emoji as AppleEmojiName}
        size={size}
        alt={ACTIVITY_EMOJI_LABELS[emoji]}
      />
    );
  }
  return (
    <span className="inline-block leading-none" style={{ fontSize: size }}>
      {ACTIVITY_EMOJI_CHARS[emoji]}
    </span>
  );
}

interface ActivityReactionsProps {
  reactions: ActivityReactionSummary[];
  disabled?: boolean;
  onToggle: (emoji: ActivityEmoji) => void;
}

export function ActivityReactions({
  reactions,
  disabled,
  onToggle,
}: ActivityReactionsProps) {
  const top = reactions.slice(0, 4);
  const extra = reactions.length > 4 ? reactions.length - 4 : 0;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {top.map((reaction) => {
        const users = reaction.users.map((u) => u.username).filter(Boolean);
        return (
          <Tooltip key={reaction.emoji}>
            <TooltipTrigger asChild>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onToggle(reaction.emoji)}
                className={cn(
                  'inline-flex h-8 items-center gap-1 rounded-full border px-2 text-sm transition-colors',
                  reaction.reactedByMe
                    ? 'border-primary/50 bg-primary/10 text-foreground'
                    : 'border-border bg-secondary/40 text-muted-foreground hover:bg-secondary',
                  disabled && 'cursor-not-allowed opacity-60',
                )}
              >
                <ReactionGlyph emoji={reaction.emoji} />
                <span className="tabular-nums">{reaction.count}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{ACTIVITY_EMOJI_LABELS[reaction.emoji]}</p>
              {users.length > 0 ? (
                <p className="text-xs text-muted-foreground">{users.slice(0, 5).join(', ')}</p>
              ) : null}
            </TooltipContent>
          </Tooltip>
        );
      })}

      {extra > 0 ? (
        <span className="text-xs text-muted-foreground">+{extra}</span>
      ) : null}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            className="h-8 w-8 rounded-full"
            title="Добавить реакцию"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="flex flex-wrap gap-1 p-2">
          {ACTIVITY_EMOJIS.map((emoji) => (
            <DropdownMenuItem
              key={emoji}
              className="cursor-pointer p-1.5"
              onClick={() => onToggle(emoji)}
            >
              <span className="sr-only">{ACTIVITY_EMOJI_LABELS[emoji]}</span>
              <ReactionGlyph emoji={emoji} size={20} />
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
