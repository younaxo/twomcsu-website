'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

const EMOJI_FILES = {
  thumbs_up: 'thumbs-up',
  heart: 'heart',
  laugh: 'laugh',
  wow: 'wow',
  sad: 'sad',
  angry: 'angry',
  party: 'party',
  fire: 'fire',
} as const;

export type AppleEmojiName = keyof typeof EMOJI_FILES;

interface EmojiProps {
  name: AppleEmojiName;
  size?: number;
  className?: string;
  alt?: string;
}

export function Emoji({ name, size = 18, className, alt }: EmojiProps) {
  const file = EMOJI_FILES[name];
  return (
    <Image
      src={`/emojis/apple/${file}.png`}
      alt={alt ?? name}
      width={size}
      height={size}
      className={cn('inline-block align-[-0.125em]', className)}
      unoptimized
    />
  );
}
