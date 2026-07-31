'use client';

import { useState } from 'react';
import { DefaultAvatar } from '@/components/shared/DefaultAvatar';
import { ImagePreview } from '@/components/shared/ImagePreview';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { resolveMediaUrl } from '@/lib/profile';
import { getMinecraftUsername } from '@/lib/username-aliases';
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
  const [previewOpen, setPreviewOpen] = useState(false);
  const dim = sizes[size];
  const avatarUrl = resolveMediaUrl(user.avatar);
  const skinName = getMinecraftUsername(user.username);
  const fallbackAvatar = `https://mc-heads.net/avatar/${encodeURIComponent(skinName)}/256`;
  const previewSrc = avatarUrl || fallbackAvatar;
  const headUrl = `https://mc-heads.net/head/${encodeURIComponent(skinName)}/${dim.head}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setPreviewOpen(true)}
        className={cn('relative shrink-0', className)}
        style={{ width: dim.avatar, height: dim.avatar }}
        aria-label={`Аватар ${user.username}`}
      >
        <Avatar className="h-full w-full" style={{ width: dim.avatar, height: dim.avatar }}>
          <AvatarImage src={avatarUrl} alt={user.username} />
          <AvatarFallback className="p-0">
            {user.username ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://mc-heads.net/avatar/${encodeURIComponent(skinName)}/${dim.avatar}`}
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
          className="pointer-events-none absolute -bottom-0.5 -right-0.5 rounded-full"
          style={{ width: dim.head, height: dim.head }}
        />
      </button>
      <ImagePreview
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        src={previewSrc}
        alt={user.username}
      />
    </>
  );
}
