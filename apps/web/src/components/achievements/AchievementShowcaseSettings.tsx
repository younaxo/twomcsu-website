'use client';

import type { AchievementWithProgress } from '@twomc/shared';
import { MAX_SHOWCASE_ACHIEVEMENTS, ACHIEVEMENT_RARITY_COLORS } from '@twomc/shared';
import { useState } from 'react';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import { AchievementIcon } from './AchievementIcon';
import { AchievementRarityBadge } from './AchievementRarityBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyAchievements, useSetShowcase } from '@/hooks/achievements';
import { cn } from '@/lib/utils';

export function AchievementShowcaseSettings() {
  const { data, isLoading } = useMyAchievements();
  const setShowcase = useSetShowcase();
  const [selected, setSelected] = useState<string[] | null>(null);

  const showcaseIds = (data?.showcase ?? []).map((a: AchievementWithProgress) => a.id);
  const unlocked = (data?.achievements ?? []).filter(
    (a: AchievementWithProgress) => a.progress?.isCompleted,
  );

  const currentSelected = selected ?? showcaseIds;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const current = prev ?? showcaseIds;
      if (current.includes(id)) {
        return current.filter((x) => x !== id);
      }
      if (current.length >= MAX_SHOWCASE_ACHIEVEMENTS) {
        toast.error(`Можно выбрать не более ${MAX_SHOWCASE_ACHIEVEMENTS} достижений`);
        return current;
      }
      return [...current, id];
    });
  };

  const save = async () => {
    try {
      await setShowcase.mutateAsync(currentSelected);
      setSelected(null);
      toast.success('Витрина обновлена');
    } catch {
      toast.error('Не удалось сохранить витрину');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-44" />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Выбрано {currentSelected.length} из {MAX_SHOWCASE_ACHIEVEMENTS}
        </p>
        {selected !== null ? (
          <Button
            type="button"
            size="sm"
            onClick={() => void save()}
            disabled={setShowcase.isPending}
          >
            {setShowcase.isPending ? 'Сохранение...' : 'Сохранить'}
          </Button>
        ) : null}
      </div>

      {unlocked.length === 0 ? (
        <p className="text-sm text-muted-foreground">Нет полученных достижений для отображения</p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {unlocked.map((achievement: AchievementWithProgress) => {
            const isChosen = currentSelected.includes(achievement.id);
            const color = ACHIEVEMENT_RARITY_COLORS[achievement.rarity];
            return (
              <button
                key={achievement.id}
                type="button"
                onClick={() => toggle(achievement.id)}
                className={cn(
                  'flex items-center gap-3 rounded-xl border p-3 text-left transition-all',
                  isChosen
                    ? 'border-primary/50 bg-primary/10'
                    : 'border-white/10 hover:border-white/20 hover:bg-white/[0.03]',
                )}
              >
                <AchievementIcon
                  iconUrl={achievement.iconUrl}
                  rarity={achievement.rarity}
                  size={36}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{achievement.name}</p>
                  <AchievementRarityBadge rarity={achievement.rarity} className="mt-0.5" />
                </div>
                <div
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                    isChosen ? 'border-primary bg-primary' : 'border-white/20',
                  )}
                >
                  {isChosen ? <Check className="h-3 w-3 text-white" /> : null}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
