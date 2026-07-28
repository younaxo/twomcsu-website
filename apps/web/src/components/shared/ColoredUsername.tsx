'use client';

import type { Position, UserBadge } from '@twomc/shared';
import { userBadgeTypeOrder } from '@twomc/shared';
import Link from 'next/link';
import { memo, useMemo } from 'react';
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
  /** Limit badges shown after the nick (e.g. 1 in header, 2 in chat). */
  maxBadges?: number;
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
  maxBadges,
  className,
}: ColoredUsernameProps) {
  const prefetchProfile = usePrefetchProfile();

  const orderedBadges = useMemo(() => {
    if (!badges?.length) return [];
    const rank = new Map(userBadgeTypeOrder.map((t, i) => [t, i]));
    const sorted = [...badges].sort(
      (a, b) => (rank.get(a.type) ?? 99) - (rank.get(b.type) ?? 99),
    );
    return typeof maxBadges === 'number' ? sorted.slice(0, maxBadges) : sorted;
  }, [badges, maxBadges]);

  const name = (
    <span
      className={cn('truncate font-semibold', sizeClasses[size], className)}
      style={{ color: user.position.color }}
    >
      {user.username}
    </span>
  );

  return (
    <span className="inline-flex min-w-0 items-center">
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

      {orderedBadges.length > 0 ? (
        <span className="ml-1 inline-flex items-center gap-0.5">
          {orderedBadges.map((badge) => (
            <UserBadgeIcon key={badge.id} type={badge.type} size={badgeSize[size]} />
          ))}
        </span>
      ) : null}

      {showBadge ? (
        <span className="ml-1">
          <PositionBadge position={user.position} size={size === 'lg' ? 'md' : 'sm'} />
        </span>
      ) : null}
    </span>
  );
}

export const ColoredUsername = memo(ColoredUsernameComponent);
