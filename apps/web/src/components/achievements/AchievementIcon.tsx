'use client';

import type { AchievementRarity } from '@twomc/shared';
import { ACHIEVEMENT_RARITY_COLORS } from '@twomc/shared';
import Image from 'next/image';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AchievementIconProps {
  iconUrl: string;
  rarity: AchievementRarity;
  size?: number;
  isSecret?: boolean;
  isLocked?: boolean;
  className?: string;
}

export function AchievementIcon({
  iconUrl,
  rarity,
  size = 48,
  isSecret = false,
  isLocked = false,
  className,
}: AchievementIconProps) {
  const color = ACHIEVEMENT_RARITY_COLORS[rarity];

  const glowStyle: React.CSSProperties =
    rarity === 'LEGENDARY'
      ? { filter: `drop-shadow(0 0 6px ${color}99)` }
      : rarity === 'MYTHIC'
        ? { filter: `drop-shadow(0 0 10px ${color}bb)` }
        : {};

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-xl',
        rarity === 'MYTHIC' && 'animate-pulse',
        isLocked && 'grayscale opacity-50',
        className,
      )}
      style={{ width: size, height: size, ...glowStyle }}
    >
      {isSecret ? (
        <div
          className="flex h-full w-full items-center justify-center rounded-xl bg-neutral-800"
          style={{ border: `2px solid ${color}66` }}
        >
          <Trophy className="text-muted-foreground" style={{ width: size * 0.45, height: size * 0.45 }} />
        </div>
      ) : (
        <Image
          src={iconUrl}
          alt=""
          width={size}
          height={size}
          className="h-full w-full object-contain"
          unoptimized
        />
      )}
    </div>
  );
}
