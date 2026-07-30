'use client';

import { REPORT_TYPE_LABELS, ReportType } from '@twomc/shared';
import {
  CreditCard,
  MessageSquare,
  Scale,
  Shield,
  Target,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPE_META: Record<ReportType, { icon: LucideIcon; color: string }> = {
  PLAYER_COMPLAINT: { icon: Target, color: '#EF4444' },
  ADMIN_COMPLAINT: { icon: Shield, color: '#F59E0B' },
  PUNISHMENT_APPEAL: { icon: Scale, color: '#3B82F6' },
  TECHNICAL_ISSUE: { icon: Wrench, color: '#8B5CF6' },
  DONATION_PROBLEM: { icon: CreditCard, color: '#10B981' },
  OTHER: { icon: MessageSquare, color: '#6B7280' },
};

export function ReportTypeIcon({
  type,
  className,
  showLabel = false,
  size = 'md',
}: {
  type: ReportType;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const meta = TYPE_META[type];
  const Icon = meta.icon;
  const sizeClass = size === 'lg' ? 'h-10 w-10' : size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <span className={cn('inline-flex items-center gap-2', className)} style={{ color: meta.color }}>
      <Icon className={sizeClass} />
      {showLabel ? <span className="text-sm text-white">{REPORT_TYPE_LABELS[type]}</span> : null}
    </span>
  );
}

export function reportTypeMeta(type: ReportType) {
  return TYPE_META[type];
}
