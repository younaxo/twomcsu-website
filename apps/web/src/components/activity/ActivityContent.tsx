'use client';

import type { ActivityItem } from '@twomc/shared';
import Image from 'next/image';
import Link from 'next/link';

interface ActivityContentProps {
  activity: Pick<ActivityItem, 'title' | 'description' | 'imageUrl' | 'actionUrl' | 'user' | 'type'>;
}

export function ActivityContent({ activity }: ActivityContentProps) {
  const body = (
    <div className="space-y-3">
      <p className="text-[15px] leading-relaxed text-white">
        <span className="font-medium">{activity.user.username}</span>{' '}
        <span className="text-muted-foreground">{activity.title}</span>
      </p>
      {activity.description ? (
        <p className="text-sm text-muted-foreground">{activity.description}</p>
      ) : null}
      {activity.imageUrl ? (
        <div className="relative overflow-hidden rounded-xl border border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activity.imageUrl}
            alt=""
            className="max-h-64 w-full object-cover"
          />
        </div>
      ) : null}
      {activity.type === 'CUSTOM' || activity.type === 'EVENT_ANNOUNCED' ? (
        <span className="inline-flex rounded-md bg-violet-500/15 px-2 py-0.5 text-xs text-violet-300">
          Объявление
        </span>
      ) : null}
    </div>
  );

  if (activity.actionUrl) {
    return (
      <Link href={activity.actionUrl} className="block transition-colors hover:opacity-90">
        {body}
      </Link>
    );
  }

  return body;
}
