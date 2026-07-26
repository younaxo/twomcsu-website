import type { Position } from '@twomc/shared';
import Link from 'next/link';
import { PositionBadge } from '@/components/shared/PositionBadge';
import { cn } from '@/lib/utils';

type UsernameSize = 'sm' | 'md' | 'lg';

interface ColoredUsernameProps {
  user: { username: string; position: Position };
  size?: UsernameSize;
  showBadge?: boolean;
  linkToProfile?: boolean;
  className?: string;
}

const sizeClasses: Record<UsernameSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-2xl',
};

export function ColoredUsername({
  user,
  size = 'md',
  showBadge = false,
  linkToProfile = true,
  className,
}: ColoredUsernameProps) {
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
        <Link href={`/users/${user.username}`} className="transition-opacity hover:opacity-80">
          {name}
        </Link>
      ) : (
        name
      )}

      {showBadge ? (
        <PositionBadge position={user.position} size={size === 'lg' ? 'md' : 'sm'} />
      ) : null}
    </span>
  );
}
