'use client';

import type { Position, UserBadge } from '@twomc/shared';
import Link from 'next/link';
import { memo } from 'react';
import { UserBadgeIcon } from '@/components/shared/UserBadgeIcon';
import { PositionBadge } from '@/components/shared/PositionBadge';
import { usePrefetchProfile } from '@/hooks/useFriendsQueries';
import { cn } from '@/lib/utils';

type UsernameSize = 'sm' | 'md' | 'lg';

interface ColoredUsernameProps {
  user: { username: string; position: Position };
  size?: UsernameSize;
  showBadge?: boolean;
  linkToProfile?: boolean;
  badges?: UserBadge[];
  className?: string;
}

const sizeClasses: Record<UsernameSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-2xl',
};

const badgeSize: Record<UsernameSize, number> = {
  sm: 14,
  md: 16,
  lg: 20,
};

function ColoredUsernameComponent({
  user,
  size = 'md',
  showBadge = false,
  linkToProfile = true,
  badges,
  className,
}: ColoredUsernameProps) {
  const prefetchProfile = usePrefetchProfile();

  const name = (
    <span
      className={cn('truncate font-semibold', sizeClasses[size], className)}
      style={{ color: user.position.color }}
    >
      {user.username}
    </span>
  );

  return (
    <span className="inline-flex items-center gap-2">
      {linkToProfile ? (
        <Link
          href={`/users/${user.username}`}
          className="transition-opacity hover:opacity-80"
          onMouseEnter={() => prefetchProfile(user.username)}
        >
          {name}
        </Link>
      ) : (
        name
      )}

      {badges?.map((badge) => (
        <UserBadgeIcon key={badge.id} type={badge.type} size={badgeSize[size]} />
      ))}

      {showBadge ? (
        <PositionBadge position={user.position} size={size === 'lg' ? 'md' : 'sm'} />
      ) : null}
    </span>
  );
}

export const ColoredUsername = memo(ColoredUsernameComponent);
