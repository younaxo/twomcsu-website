'use client';

import { cn } from '@/lib/utils';

function hashUsername(username: string): number {
  let hash = 0;
  for (let i = 0; i < username.length; i += 1) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function avatarColorFromUsername(username: string): string {
  const hue = hashUsername(username) % 360;
  return `hsl(${hue} 55% 42%)`;
}

interface DefaultAvatarProps {
  username: string;
  className?: string;
  /** Font size class; defaults scale with container */
  letterClassName?: string;
}

/** Colorful letter fallback when no avatar/skin is available */
export function DefaultAvatar({ username, className, letterClassName }: DefaultAvatarProps) {
  const letter = (username.trim().charAt(0) || '?').toUpperCase();
  const background = avatarColorFromUsername(username || 'user');

  return (
    <span
      className={cn(
        'flex h-full w-full items-center justify-center font-semibold text-white',
        className,
      )}
      style={{ background }}
      aria-hidden
    >
      <span className={cn('select-none', letterClassName)}>{letter}</span>
    </span>
  );
}
