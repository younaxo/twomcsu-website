'use client';

import type { AchievementWithProgress } from '@twomc/shared';
import { ACHIEVEMENT_RARITY_COLORS } from '@twomc/shared';
import { Link } from '@/i18n/navigation';
import { AchievementIcon } from './AchievementIcon';
import { AchievementRarityBadge } from './AchievementRarityBadge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface AchievementShowcaseProps {
  achievements: AchievementWithProgress[];
  className?: string;
}

export function AchievementShowcase({ achievements, className }: AchievementShowcaseProps) {
  if (achievements.length === 0) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn('grid grid-cols-3 gap-2 sm:grid-cols-6', className)}>
        {achievements.map((achievement) => {
          const color = ACHIEVEMENT_RARITY_COLORS[achievement.rarity];
          return (
            <Tooltip key={achievement.id}>
              <TooltipTrigger asChild>
                <Link
                  href={`/achievements/${achievement.slug}`}
                  className="flex flex-col items-center gap-1.5 rounded-xl p-2 transition-colors hover:bg-white/[0.04]"
                  style={{
                    border: `1px solid ${color}33`,
                    background: `${color}08`,
                  }}
                >
                  <AchievementIcon
                    iconUrl={achievement.iconUrl}
                    rarity={achievement.rarity}
                    size={40}
                  />
                  <span className="w-full truncate text-center text-[10px] text-muted-foreground">
                    {achievement.name}
                  </span>
                </Link>
              </TooltipTrigger>
              <TooltipContent className="max-w-52">
                <p className="font-medium">{achievement.name}</p>
                <p className="text-xs text-primary-foreground/80">{achievement.description}</p>
                <AchievementRarityBadge rarity={achievement.rarity} className="mt-1" />
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
