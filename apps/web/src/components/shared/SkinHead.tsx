'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface SkinHeadProps {
  minecraftNick?: string | null;
  avatar?: string | null;
  username: string;
  size?: number;
  className?: string;
}

export function SkinHead({
  minecraftNick,
  avatar,
  username,
  size = 64,
  className,
}: SkinHeadProps) {
  const src = minecraftNick
    ? `https://mc-heads.net/avatar/${encodeURIComponent(minecraftNick)}/${size}`
    : (avatar ?? undefined);

  return (
    <Avatar className={cn('rounded-xl', className)} style={{ width: size, height: size }}>
      <AvatarImage src={src} alt={username} className="rounded-xl" />
      <AvatarFallback className="rounded-xl text-lg">
        {username.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
