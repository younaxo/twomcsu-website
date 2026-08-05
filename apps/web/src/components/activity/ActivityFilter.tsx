'use client';

import {
  ActivityFeedFilter,
  ActivityType,
  ACTIVITY_TYPE_LABELS,
} from '@twomc/shared';
import { cn } from '@/lib/utils';

const scopeTabs: Array<{ value: ActivityFeedFilter; label: string }> = [
  { value: ActivityFeedFilter.ALL, label: 'Все' },
  { value: ActivityFeedFilter.FRIENDS, label: 'Только друзья' },
  { value: ActivityFeedFilter.ME, label: 'Только моя' },
];

const quickTypes: Array<{ type: ActivityType | null; label: string }> = [
  { type: null, label: 'Все типы' },
  { type: ActivityType.PURCHASE_MADE, label: '💰 Покупки' },
  { type: ActivityType.ACHIEVEMENT_UNLOCKED, label: '🏆 Достижения' },
  { type: ActivityType.GIFT_SENT, label: '🎁 Подарки' },
  { type: ActivityType.FRIENDSHIP_STARTED, label: '👥 Дружба' },
  { type: ActivityType.EVENT_ANNOUNCED, label: '🎉 События' },
];

interface ActivityFilterProps {
  filter: ActivityFeedFilter;
  type: ActivityType | null;
  onFilterChange: (filter: ActivityFeedFilter) => void;
  onTypeChange: (type: ActivityType | null) => void;
  showScope?: boolean;
}

export function ActivityFilter({
  filter,
  type,
  onFilterChange,
  onTypeChange,
  showScope = true,
}: ActivityFilterProps) {
  return (
    <div className="space-y-3">
      {showScope ? (
        <div className="flex flex-wrap gap-2">
          {scopeTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => onFilterChange(tab.value)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-sm transition-colors',
                filter === tab.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {quickTypes.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onTypeChange(item.type)}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-sm transition-colors',
              type === item.type
                ? 'border-primary/60 bg-primary/15 text-white'
                : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10',
            )}
            title={item.type ? ACTIVITY_TYPE_LABELS[item.type] : 'Все типы'}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
