'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DefaultAvatar } from '@/components/shared/DefaultAvatar';
import { cn } from '@/lib/utils';

interface SkinHeadProps {
  avatar?: string | null;
  username: string;
  size?: number;
  className?: string;
  /** Show online ring around the head */
  isOnline?: boolean;
}

export function SkinHead({
  avatar,
  username,
  size = 64,
  className,
  isOnline,
}: SkinHeadProps) {
  const src = username
    ? `https://mc-heads.net/avatar/${encodeURIComponent(username)}/${size}`
    : (avatar ?? undefined);

  return (
    <Avatar
      className={cn(
        'rounded-xl',
        isOnline === true && 'ring-2 ring-primary ring-offset-2 ring-offset-card',
        isOnline === false && 'ring-2 ring-muted-foreground/40 ring-offset-2 ring-offset-card',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <AvatarImage src={src} alt={username} className="rounded-xl" />
      <AvatarFallback className="rounded-xl p-0">
        <DefaultAvatar username={username} letterClassName="text-lg" />
      </AvatarFallback>
    </Avatar>
  );
}
