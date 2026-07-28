'use client';

import type { Award, UserAward } from '@twomc/shared';
import { AwardIcon } from '@/components/shared/AwardIcon';
import { cn } from '@/lib/utils';

interface AwardsListProps {
  awards: Array<Award | UserAward>;
  size?: number;
  className?: string;
}

export function AwardsList({ awards, size = 32, className }: AwardsListProps) {
  if (awards.length === 0) {
    return <p className="text-sm text-muted-foreground">Нет наград</p>;
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {awards.map((award) => (
        <AwardIcon key={award.id} award={award} size={size} />
      ))}
    </div>
  );
}
