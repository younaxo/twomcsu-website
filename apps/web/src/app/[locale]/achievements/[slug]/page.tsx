'use client';

import { ACHIEVEMENT_RARITY_COLORS, ACHIEVEMENT_CATEGORY_LABELS } from '@twomc/shared';
import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ArrowLeft, Calendar, Trophy, Users } from 'lucide-react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { use } from 'react';
import { AchievementIcon } from '@/components/achievements/AchievementIcon';
import { AchievementProgressBar } from '@/components/achievements/AchievementProgressBar';
import { AchievementRarityBadge } from '@/components/achievements/AchievementRarityBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAchievement } from '@/hooks/achievements';
import { useAuth } from '@/hooks/useAuth';
import { resolveMediaUrl } from '@/lib/profile';

interface AchievementDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default function AchievementDetailPage({ params }: AchievementDetailPageProps) {
  const { slug } = use(params);
  const { data: achievement, isLoading } = useAchievement(slug);
  const { isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-56 w-full rounded-2xl" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!achievement) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <Trophy className="h-12 w-12 text-muted-foreground/30" />
        <p className="font-medium text-muted-foreground">Достижение не найдено</p>
        <Link href="/achievements" className="text-sm text-primary hover:underline">
          ← Все достижения
        </Link>
      </div>
    );
  }

  const color = ACHIEVEMENT_RARITY_COLORS[achievement.rarity];
  const isUnlocked = achievement.progress?.isCompleted ?? false;

  return (
    <div className="space-y-6">
      <Link
        href="/achievements"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Все достижения
      </Link>

      {/* Hero card */}
      <div
        className="glass-medium rounded-2xl p-6"
        style={{
          borderLeft: `4px solid ${color}`,
          border: `1px solid rgba(255,255,255,0.06)`,
          borderLeftWidth: 4,
          borderLeftColor: color,
          boxShadow: `0 0 32px ${color}1a`,
        }}
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <AchievementIcon
            iconUrl={achievement.iconUrl}
            rarity={achievement.rarity}
            size={96}
            isSecret={achievement.isHidden}
            isLocked={!isUnlocked}
            className="mx-auto sm:mx-0"
          />

          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-white">
                {achievement.isHidden ? '???' : achievement.name}
              </h1>
              <AchievementRarityBadge rarity={achievement.rarity} />
            </div>

            <p className="text-muted-foreground">
              {achievement.isHidden
                ? 'Секретное достижение — описание скрыто'
                : achievement.description}
            </p>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {achievement.unlockedCount} игроков получили
              </span>
              <span className="flex items-center gap-1.5">
                <Trophy className="h-4 w-4" />
                {ACHIEVEMENT_CATEGORY_LABELS[achievement.category]}
              </span>
            </div>

            {isAuthenticated &&
            !isUnlocked &&
            !achievement.isHidden &&
            achievement.conditionValue !== null ? (
              <AchievementProgressBar
                value={achievement.progressPercent}
                color={color}
                showLabel
                current={achievement.progress?.currentProgress}
                total={achievement.conditionValue}
                className="mt-2 max-w-sm"
              />
            ) : null}

            {isUnlocked && achievement.progress?.completedAt ? (
              <p className="flex items-center gap-1.5 text-sm text-emerald-400">
                <Calendar className="h-4 w-4" />
                Получено{' '}
                {format(new Date(achievement.progress.completedAt), 'dd MMMM yyyy', { locale: ru })}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Rewards */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Награды</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {achievement.rewardRubies > 0 ? (
              <p>
                <span className="font-semibold text-amber-400">{achievement.rewardRubies}</span>{' '}
                рубинов
              </p>
            ) : null}
            {achievement.rewardTitle ? (
              <p>
                Титул:{' '}
                <span className="font-medium" style={{ color }}>
                  {achievement.rewardTitle}
                </span>
              </p>
            ) : null}
            {achievement.rewardBadgeType ? (
              <p>
                Бейдж: <span className="font-medium">{achievement.rewardBadgeType}</span>
              </p>
            ) : null}
            {achievement.rewardMessage ? (
              <p className="text-muted-foreground italic">{achievement.rewardMessage}</p>
            ) : null}
            {!achievement.rewardRubies &&
            !achievement.rewardTitle &&
            !achievement.rewardBadgeType ? (
              <p className="text-muted-foreground">Нет дополнительных наград</p>
            ) : null}
          </CardContent>
        </Card>

        {/* Recent unlocks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Недавние получатели</CardTitle>
          </CardHeader>
          <CardContent>
            {achievement.recentUnlocks && achievement.recentUnlocks.length > 0 ? (
              <ul className="space-y-3">
                {achievement.recentUnlocks.map((unlock) => {
                  const avatar = resolveMediaUrl(unlock.avatar);
                  return (
                    <li key={unlock.userId} className="flex items-center gap-3 text-sm">
                      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-secondary">
                        {avatar ? (
                          <Image
                            src={avatar}
                            alt={unlock.username}
                            width={32}
                            height={32}
                            className="h-full w-full object-cover"
                            unoptimized
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/users/${unlock.username}`}
                          className="truncate font-medium hover:underline"
                        >
                          {unlock.username}
                        </Link>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(unlock.completedAt), {
                          addSuffix: true,
                          locale: ru,
                        })}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Никто ещё не получил это достижение</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
