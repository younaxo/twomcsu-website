'use client';

import type { AchievementWithProgress } from '@twomc/shared';
import { ACHIEVEMENT_RARITY_COLORS } from '@twomc/shared';
import { Link } from '@/i18n/navigation';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Lock } from 'lucide-react';
import { AchievementIcon } from './AchievementIcon';
import { AchievementProgressBar } from './AchievementProgressBar';
import { AchievementRarityBadge } from './AchievementRarityBadge';
import { cn } from '@/lib/utils';

interface AchievementCardProps {
  achievement: AchievementWithProgress;
  className?: string;
  showProgress?: boolean;
}

export function AchievementCard({
  achievement,
  className,
  showProgress = true,
}: AchievementCardProps) {
  const { rarity } = achievement;
  const color = ACHIEVEMENT_RARITY_COLORS[rarity];
  const isUnlocked = achievement.progress?.isCompleted ?? false;
  const isHidden = achievement.isHidden;

  return (
    <Link href={`/achievements/${achievement.slug}`} className="block">
      <div
        className={cn(
          'group relative flex gap-4 rounded-2xl glass-medium p-4 transition-all duration-200 hover:bg-white/[0.04]',
          !isUnlocked && 'opacity-75',
          className,
        )}
        style={{
          borderLeft: `3px solid ${isUnlocked ? color : 'rgba(255,255,255,0.12)'}`,
          border: `1px solid rgba(255,255,255,0.06)`,
          borderLeftWidth: 3,
          borderLeftColor: isUnlocked ? color : 'rgba(255,255,255,0.12)',
        }}
      >
        <div className="shrink-0">
          <AchievementIcon
            iconUrl={achievement.iconUrl}
            rarity={rarity}
            size={52}
            isSecret={isHidden}
            isLocked={!isUnlocked}
          />
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={cn(
                'text-sm font-semibold leading-snug',
                !isUnlocked && 'text-muted-foreground',
              )}
            >
              {isHidden ? '???' : achievement.name}
            </p>
            <AchievementRarityBadge rarity={rarity} />
            {isUnlocked && achievement.progress?.completedAt ? (
              <span className="ml-auto text-xs text-emerald-400">
                {format(new Date(achievement.progress.completedAt), 'dd.MM.yyyy', { locale: ru })}
              </span>
            ) : null}
          </div>

          <p className="line-clamp-2 text-xs text-muted-foreground">
            {isHidden ? 'Секретное достижение' : achievement.description}
          </p>

          {showProgress && !isUnlocked && !isHidden && achievement.conditionValue !== null ? (
            <AchievementProgressBar
              value={achievement.progressPercent}
              color={color}
              className="mt-1"
              showLabel
              current={achievement.progress?.currentProgress}
              total={achievement.conditionValue}
            />
          ) : null}

          {!isUnlocked && isHidden ? (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="h-3 w-3 shrink-0" />
              <span>Секретное — открывается автоматически</span>
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
