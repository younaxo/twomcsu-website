'use client';

import type { Position } from '@twomc/shared';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface MentionTextProps {
  username: string;
  position?: Position;
}

export function MentionText({ username, position }: MentionTextProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={`/users/${encodeURIComponent(username)}`}
          className="font-medium hover:underline"
          style={{ color: position?.color ?? 'hsl(var(--primary))' }}
        >
          @{username}
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        <p>@{username}</p>
        {position ? <p className="text-xs text-muted-foreground">{position.displayName}</p> : null}
      </TooltipContent>
    </Tooltip>
  );
}
