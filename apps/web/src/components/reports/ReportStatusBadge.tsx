'use client';

import {
  REPORT_STATUS_COLORS,
  REPORT_STATUS_LABELS,
  type ReportStatus,
} from '@twomc/shared';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function ReportStatusBadge({
  status,
  className,
}: {
  status: ReportStatus;
  className?: string;
}) {
  const color = REPORT_STATUS_COLORS[status];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={cn('border-transparent font-medium', className)}
          style={{ backgroundColor: `${color}22`, color }}
        >
          {REPORT_STATUS_LABELS[status]}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{REPORT_STATUS_LABELS[status]}</TooltipContent>
    </Tooltip>
  );
}
