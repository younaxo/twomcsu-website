'use client';

import type { AchievementRarity } from '@twomc/shared';
import { ACHIEVEMENT_RARITY_COLORS, ACHIEVEMENT_RARITY_LABELS } from '@twomc/shared';
import { cn } from '@/lib/utils';

interface AchievementRarityBadgeProps {
  rarity: AchievementRarity;
  className?: string;
}

export function AchievementRarityBadge({ rarity, className }: AchievementRarityBadgeProps) {
  const color = ACHIEVEMENT_RARITY_COLORS[rarity];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
        className,
      )}
      style={{
        color,
        background: `${color}1a`,
        border: `1px solid ${color}44`,
      }}
    >
      {ACHIEVEMENT_RARITY_LABELS[rarity]}
    </span>
  );
}
