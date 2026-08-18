'use client';

import { useState } from 'react';
import { DefaultAvatar } from '@/components/shared/DefaultAvatar';
import { ImagePreview } from '@/components/shared/ImagePreview';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { resolveMediaUrl } from '@/lib/profile';
import { getMinecraftUsername } from '@/lib/username-aliases';
import { useSelectedDecoration } from '@/hooks/useDecorations';
import { cn } from '@/lib/utils';

const sizes = {
  sm: { avatar: 32, head: 16 },
  md: { avatar: 48, head: 20 },
  lg: { avatar: 128, head: 48 },
  xl: { avatar: 80, head: 32 },
} as const;

interface AvatarWithSkinProps {
  user: {
    username: string;
    avatar?: string | null;
    avatarDecoration?: { imageUrl: string } | null;
  };
  size?: keyof typeof sizes | number;
  className?: string;
  showMinecraftHead?: boolean;
}

export function AvatarWithSkin({
  user,
  size = 'md',
  className,
  showMinecraftHead = true,
}: AvatarWithSkinProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const dim = typeof size === 'number'
    ? { avatar: size, head: Math.max(14, Math.round(size * 0.4)) }
    : sizes[size];
  const avatarUrl = resolveMediaUrl(user.avatar);
  const skinName = getMinecraftUsername(user.username);
  const fallbackAvatar = `https://mc-heads.net/avatar/${encodeURIComponent(skinName)}/256`;
  const previewSrc = avatarUrl || fallbackAvatar;
  const headUrl = `https://mc-heads.net/head/${encodeURIComponent(skinName)}/${dim.head}`;
  const decorationQuery = useSelectedDecoration(
    user.username,
    user.avatarDecoration === undefined && user.username !== 'Steve',
  );
  const decoration = user.avatarDecoration === undefined
    ? decorationQuery.data
    : user.avatarDecoration;
  const headOverlap = Math.round(dim.head * 0.25);
  const canvasSize = dim.avatar + (showMinecraftHead ? dim.head - headOverlap : 0);

  return (
    <>
      <span
        role="button"
        tabIndex={0}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setPreviewOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setPreviewOpen(true);
          }
        }}
        className={cn('relative isolate inline-block shrink-0 cursor-pointer overflow-visible rounded-full', className)}
        style={{ width: canvasSize, height: canvasSize }}
        aria-label={`Аватар ${user.username}`}
      >
        <Avatar
          className="absolute left-0 top-0"
          style={{ width: dim.avatar, height: dim.avatar }}
        >
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
        {decoration ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={decoration.imageUrl}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 z-20 max-w-none object-contain"
            style={{ width: dim.avatar, height: dim.avatar }}
          />
        ) : null}
        {showMinecraftHead ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={headUrl}
            alt=""
            width={dim.head}
            height={dim.head}
            className="pointer-events-none absolute z-30 rounded-full border border-black/60 bg-black/70 shadow-md"
            style={{
              left: dim.avatar - headOverlap,
              top: dim.avatar - headOverlap,
              width: dim.head,
              height: dim.head,
            }}
          />
        ) : null}
      </span>
      <ImagePreview
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        src={previewSrc}
        alt={user.username}
      />
    </>
  );
}
