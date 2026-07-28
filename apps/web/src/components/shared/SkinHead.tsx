'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DefaultAvatar } from '@/components/shared/DefaultAvatar';
import { cn } from '@/lib/utils';

interface SkinHeadProps {
  avatar?: string | null;
  username: string;
  size?: number;
  className?: string;
  /** @deprecated Online ring removed from design */
  isOnline?: boolean;
}

export function SkinHead({ avatar, username, size = 64, className }: SkinHeadProps) {
  const src = username
    ? `https://mc-heads.net/avatar/${encodeURIComponent(username)}/${size}`
    : (avatar ?? undefined);

  return (
    <Avatar
      className={cn('rounded-full', className)}
      style={{ width: size, height: size }}
    >
      <AvatarImage src={src} alt={username} className="rounded-full" />
      <AvatarFallback className="rounded-full p-0">
        <DefaultAvatar username={username} letterClassName="text-lg" />
      </AvatarFallback>
    </Avatar>
  );
}
