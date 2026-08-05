'use client';

import {
  REPORT_STATUS_COLORS,
  REPORT_STATUS_LABELS,
  type ReportStatus,
} from '@twomc/shared';
import {
  CheckCircle2,
  Clock,
  Eye,
  MessageCircle,
  XCircle,
  Archive,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const STATUS_ICONS: Record<ReportStatus, LucideIcon> = {
  PENDING: Clock,
  IN_REVIEW: Eye,
  WAITING_RESPONSE: MessageCircle,
  RESOLVED: CheckCircle2,
  REJECTED: XCircle,
  CLOSED: Archive,
};

export function ReportStatusBadge({
  status,
  className,
}: {
  status: ReportStatus;
  className?: string;
}) {
  const color = REPORT_STATUS_COLORS[status];
  const Icon = STATUS_ICONS[status];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={cn('inline-flex items-center gap-1 border-transparent font-medium', className)}
          style={{ backgroundColor: `${color}22`, color }}
        >
          <Icon className="h-3.5 w-3.5" />
          {REPORT_STATUS_LABELS[status]}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{REPORT_STATUS_LABELS[status]}</TooltipContent>
    </Tooltip>
  );
}
