'use client';

import type { ActivityAuthor, ActivityType } from '@twomc/shared';
import { ACTIVITY_TYPE_LABELS } from '@twomc/shared';
import Link from 'next/link';
import { AvatarWithSkin } from '@/components/shared/AvatarWithSkin';
import { ColoredUsername } from '@/components/shared/ColoredUsername';
import { ActivityPinIcon, ActivityTypeIcon } from './ActivityTypeIcon';
import { formatActivityTime } from './format-activity-time';

interface ActivityHeaderProps {
  user: ActivityAuthor;
  type: ActivityType;
  createdAt: string;
  isPinned?: boolean;
}

export function ActivityHeader({ user, type, createdAt, isPinned }: ActivityHeaderProps) {
  return (
    <div className="flex items-start gap-3">
      <Link href={`/users/${user.username}`} className="shrink-0">
        <AvatarWithSkin
          user={{ username: user.username, avatar: user.avatar }}
          size="sm"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {user.position ? (
            <ColoredUsername
              user={{ username: user.username, position: user.position }}
              badges={user.badges}
              size="sm"
            />
          ) : (
            <Link
              href={`/users/${user.username}`}
              className="text-sm font-medium text-white hover:underline"
            >
              {user.username}
            </Link>
          )}
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <ActivityTypeIcon type={type} className="h-3.5 w-3.5" />
            {ACTIVITY_TYPE_LABELS[type]}
          </span>
          {isPinned ? (
            <span className="inline-flex items-center gap-1 text-xs text-primary">
              <ActivityPinIcon />
              Закреплено
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{formatActivityTime(createdAt)}</p>
      </div>
    </div>
  );
}
