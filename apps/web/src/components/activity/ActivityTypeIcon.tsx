'use client';

import { ActivityType } from '@twomc/shared';
import {
  Award,
  BadgeCheck,
  Cake,
  Gift,
  Megaphone,
  Newspaper,
  Pin,
  ShoppingBag,
  Star,
  Trophy,
  UserPlus,
  UserRound,
  Crown,
  Sparkles,
  Server,
  Flame,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconByType: Record<ActivityType, typeof Trophy> = {
  PURCHASE_MADE: ShoppingBag,
  RANK_ACHIEVED: Crown,
  ACHIEVEMENT_UNLOCKED: Trophy,
  BADGE_GRANTED: BadgeCheck,
  AWARD_GRANTED: Award,
  GIFT_SENT: Gift,
  GIFT_RECEIVED: Gift,
  FRIENDSHIP_STARTED: UserPlus,
  PROFILE_UPDATED: UserRound,
  NEWS_POSTED: Newspaper,
  EVENT_ANNOUNCED: Megaphone,
  MILESTONE_REACHED: Trophy,
  JOINED_SERVER: Server,
  TOP_ACHIEVED: Star,
  MEDIA_APPROVED: Sparkles,
  DONATOR_UPGRADED: Flame,
  BIRTHDAY: Cake,
  CUSTOM: Megaphone,
};

export function activityAccentClass(type: ActivityType): string {
  switch (type) {
    case ActivityType.PURCHASE_MADE:
    case ActivityType.DONATOR_UPGRADED:
      return 'border-l-[#F57C00]';
    case ActivityType.ACHIEVEMENT_UNLOCKED:
    case ActivityType.MILESTONE_REACHED:
    case ActivityType.AWARD_GRANTED:
    case ActivityType.TOP_ACHIEVED:
      return 'border-l-amber-400';
    case ActivityType.GIFT_SENT:
    case ActivityType.GIFT_RECEIVED:
      return 'border-l-pink-400';
    case ActivityType.FRIENDSHIP_STARTED:
      return 'border-l-sky-400';
    case ActivityType.CUSTOM:
    case ActivityType.EVENT_ANNOUNCED:
      return 'border-l-violet-400';
    case ActivityType.BADGE_GRANTED:
    case ActivityType.MEDIA_APPROVED:
      return 'border-l-emerald-400';
    default:
      return 'border-l-white/20';
  }
}

export function ActivityTypeIcon({
  type,
  className,
}: {
  type: ActivityType;
  className?: string;
}) {
  const Icon = iconByType[type] ?? Sparkles;
  return <Icon className={cn('h-4 w-4 shrink-0 text-muted-foreground', className)} />;
}

export function ActivityPinIcon({ className }: { className?: string }) {
  return <Pin className={cn('h-3.5 w-3.5 text-primary', className)} />;
}
