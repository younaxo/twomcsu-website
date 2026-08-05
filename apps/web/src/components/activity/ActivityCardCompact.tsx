'use client';

import type { ActivityItem } from '@twomc/shared';
import Link from 'next/link';
import { AvatarWithSkin } from '@/components/shared/AvatarWithSkin';
import { cn } from '@/lib/utils';
import { activityAccentClass, ActivityTypeIcon } from './ActivityTypeIcon';
import { formatActivityTime } from './format-activity-time';

interface ActivityCardCompactProps {
  activity: ActivityItem;
  className?: string;
}

export function ActivityCardCompact({ activity, className }: ActivityCardCompactProps) {
  return (
    <Link
      href={`/feed/${activity.id}`}
      className={cn(
        'flex gap-3 rounded-xl border border-white/10 border-l-4 glass-medium p-3 transition-colors hover:bg-white/5',
        activityAccentClass(activity.type),
        className,
      )}
    >
      <AvatarWithSkin
        user={{ username: activity.user.username, avatar: activity.user.avatar }}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ActivityTypeIcon type={activity.type} className="h-3.5 w-3.5" />
          <span>{formatActivityTime(activity.createdAt)}</span>
        </div>
        <p className="mt-0.5 truncate text-sm text-white">
          <span className="font-medium">{activity.user.username}</span>{' '}
          <span className="text-muted-foreground">{activity.title}</span>
        </p>
      </div>
    </Link>
  );
}
