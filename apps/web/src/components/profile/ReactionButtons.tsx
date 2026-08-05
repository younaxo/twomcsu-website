'use client';

import type { ProfileReactionSummary, ReactionType } from '@twomc/shared';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { api, extractErrorMessage } from '@/lib/api';
import { formatNumber } from '@/lib/profile';
import { cn } from '@/lib/utils';

interface ReactionButtonsProps {
  username: string;
  likesCount: number;
  dislikesCount: number;
  userReaction: ReactionType | null;
  disabled?: boolean;
}

export function ReactionButtons({
  username,
  likesCount,
  dislikesCount,
  userReaction,
  disabled,
}: ReactionButtonsProps) {
  const [summary, setSummary] = useState({ likesCount, dislikesCount, userReaction });
  const [isBusy, setBusy] = useState(false);

  const toggle = async (type: ReactionType) => {
    if (disabled) return;

    setBusy(true);
    try {
      const next = summary.userReaction === type ? null : type;
      const { data } = await api.put<ProfileReactionSummary>(
        `/users/${encodeURIComponent(username)}/reaction`,
        { type: next },
      );
      setSummary(data);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось сохранить реакцию'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || isBusy}
              onClick={() => void toggle('LIKE')}
              className={cn(summary.userReaction === 'LIKE' && 'border-primary text-primary')}
            >
              <ThumbsUp className="h-4 w-4" />
              {formatNumber(summary.likesCount)}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Нравится</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || isBusy}
              onClick={() => void toggle('DISLIKE')}
              className={cn(summary.userReaction === 'DISLIKE' && 'border-destructive text-destructive')}
            >
              <ThumbsDown className="h-4 w-4" />
              {formatNumber(summary.dislikesCount)}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Не нравится</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
