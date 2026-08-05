'use client';

import type { ReportTarget, ReportUserSummary } from '@twomc/shared';
import type { UserSearchResult } from '@twomc/shared';
import { User } from 'lucide-react';
import { AvatarWithSkin } from '@/components/shared/AvatarWithSkin';
import { ColoredUsername } from '@/components/shared/ColoredUsername';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type TargetUser = ReportUserSummary | UserSearchResult;

type TargetChipProps = {
  className?: string;
  onRemove?: () => void;
} & (
  | { target: ReportTarget; username?: never; user?: never }
  | { username: string; user?: TargetUser | null; target?: never }
);

export function TargetChip(props: TargetChipProps) {
  const username = props.target?.username ?? props.username;
  const user = props.target?.user ?? props.user ?? null;
  const registered = Boolean(user);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-xl glass-light px-3 py-2',
        props.className,
      )}
    >
      {registered && user ? (
        <>
          <AvatarWithSkin user={user} size="sm" />
          <ColoredUsername user={user} size="sm" />
        </>
      ) : (
        <>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="text-sm font-medium text-white">{username}</span>
          <Badge variant="outline" className="border-white/20 text-xs text-muted-foreground">
            Не зарегистрирован
          </Badge>
        </>
      )}
      {props.onRemove ? (
        <button
          type="button"
          onClick={props.onRemove}
          className="ml-1 text-xs text-muted-foreground transition hover:text-white"
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}
