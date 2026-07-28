'use client';

import { DefaultAvatar } from '@/components/shared/DefaultAvatar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { resolveMediaUrl } from '@/lib/profile';
import { cn } from '@/lib/utils';

const sizes = {
  sm: { avatar: 32, head: 16 },
  md: { avatar: 48, head: 20 },
  lg: { avatar: 128, head: 48 },
} as const;

interface AvatarWithSkinProps {
  user: { username: string; avatar?: string | null };
  size?: keyof typeof sizes;
  className?: string;
}

export function AvatarWithSkin({ user, size = 'md', className }: AvatarWithSkinProps) {
  const dim = sizes[size];
  const avatarUrl = resolveMediaUrl(user.avatar);
  const headUrl = `https://mc-heads.net/head/${encodeURIComponent(user.username)}/${dim.head}`;

  return (
    <div
      className={cn('relative shrink-0', className)}
      style={{ width: dim.avatar, height: dim.avatar }}
    >
      <Avatar className="h-full w-full" style={{ width: dim.avatar, height: dim.avatar }}>
        <AvatarImage src={avatarUrl} alt={user.username} />
        <AvatarFallback className="p-0">
          {user.username ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`https://mc-heads.net/avatar/${encodeURIComponent(user.username)}/${dim.avatar}`}
              alt={user.username}
              className="h-full w-full object-cover"
            />
          ) : (
            <DefaultAvatar username={user.username} />
          )}
        </AvatarFallback>
      </Avatar>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={headUrl}
        alt=""
        width={dim.head}
        height={dim.head}
        className="absolute -bottom-0.5 -right-0.5 rounded-full"
        style={{ width: dim.head, height: dim.head }}
      />
    </div>
  );
}
