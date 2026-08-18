'use client';

import { AvatarWithSkin } from '@/components/shared/AvatarWithSkin';

interface SkinHeadProps {
  avatar?: string | null;
  username: string;
  size?: number;
  className?: string;
  /** @deprecated Online ring removed from design */
  isOnline?: boolean;
}

export function SkinHead({ avatar, username, size = 64, className }: SkinHeadProps) {
  return (
    <AvatarWithSkin
      user={{ username, avatar }}
      size={size}
      className={className}
      showMinecraftHead={false}
    />
  );
}
