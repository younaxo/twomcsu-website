'use client';

import { AchievementUnlockedDialog } from './AchievementUnlockedDialog';
import { useAchievementUnlocked } from '@/hooks/achievements';

export function AchievementUnlockedListener() {
  const { current, dismiss } = useAchievementUnlocked();

  if (!current) return null;

  return <AchievementUnlockedDialog payload={current} onDismiss={dismiss} />;
}
