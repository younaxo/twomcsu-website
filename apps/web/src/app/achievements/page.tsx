'use client';

import type {
  AchievementCategory,
  AchievementFilter,
  AchievementRarity,
  AchievementWithProgress,
} from '@twomc/shared';
import {
  ACHIEVEMENT_CATEGORY_LABELS,
  ACHIEVEMENT_RARITY_LABELS,
  AchievementCategory as AchievementCategoryEnum,
  AchievementRarity as AchievementRarityEnum,
} from '@twomc/shared';
import { Search, Trophy } from 'lucide-react';
import { useState } from 'react';
import { useDebounce } from 'use-debounce';
import { AchievementCard } from '@/components/achievements/AchievementCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAchievements, useAchievementsStats } from '@/hooks/achievements';
import { cn } from '@/lib/utils';

const FILTER_OPTIONS: { value: AchievementFilter | 'all'; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'unlocked', label: 'Получены' },
  { value: 'available', label: 'Доступны' },
  { value: 'locked', label: 'Недоступны' },
];

const SORT_OPTIONS = [
  { value: 'order', label: 'По порядку' },
  { value: 'rarity', label: 'По редкости' },
  { value: 'name', label: 'По имени' },
  { value: 'unlocked', label: 'По популярности' },
];

const CATEGORIES: { value: AchievementCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Все категории' },
  ...Object.entries(ACHIEVEMENT_CATEGORY_LABELS).map(([k, v]) => ({
    value: k as AchievementCategory,
    label: v,
  })),
];

const RARITIES: { value: AchievementRarity | 'all'; label: string }[] = [
  { value: 'all', label: 'Любая редкость' },
  ...Object.entries(ACHIEVEMENT_RARITY_LABELS).map(([k, v]) => ({
    value: k as AchievementRarity,
    label: v,
  })),
];

export default function AchievementsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 350);
  const [filter, setFilter] = useState<AchievementFilter | 'all'>('all');
  const [category, setCategory] = useState<AchievementCategory | 'all'>('all');
  const [rarity, setRarity] = useState<AchievementRarity | 'all'>('all');
  const [sort, setSort] = useState('rarity');

  const { data: stats } = useAchievementsStats();

  const { data: achievements, isLoading } = useAchievements({
    search: debouncedSearch || undefined,
    filter: filter === 'all' ? undefined : filter,
    category: category === 'all' ? undefined : category,
    rarity: rarity === 'all' ? undefined : rarity,
    sort: sort as 'order' | 'rarity' | 'name' | 'unlocked',
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Trophy className="h-6 w-6 text-[#F57C00]" />
            Достижения
          </h1>
          {stats ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Всего: {stats.totalAchievements} · Получено раз: {stats.totalUnlocks}
            </p>
          ) : null}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            type="button"
            size="sm"
            variant={filter === opt.value ? 'default' : 'secondary'}
            onClick={() => setFilter(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Поиск достижений…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category */}
        <Select value={category} onValueChange={(v) => setCategory(v as AchievementCategory | 'all')}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Rarity */}
        <Select value={rarity} onValueChange={(v) => setRarity(v as AchievementRarity | 'all')}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RARITIES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : !achievements || achievements.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <Trophy className="h-10 w-10 opacity-30" />
          <p className="font-medium">Достижения не найдены</p>
          <p className="text-sm">Попробуйте изменить фильтры</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {achievements.map((achievement: AchievementWithProgress) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>
      )}
    </div>
  );
}
