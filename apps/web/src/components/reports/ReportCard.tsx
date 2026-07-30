'use client';

import {
  REPORT_TYPE_LABELS,
  type ReportSummary,
} from '@twomc/shared';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronRight, Clock } from 'lucide-react';
import Link from 'next/link';
import { ReportStatusBadge } from '@/components/reports/ReportStatusBadge';
import { ReportTypeIcon } from '@/components/reports/ReportTypeIcon';
import { cn } from '@/lib/utils';

function formatTargetUsernames(report: ReportSummary): string | null {
  const names =
    report.targets.length > 0
      ? report.targets.map((target) => target.username)
      : report.targetUsername
        ? [report.targetUsername]
        : [];

  if (names.length === 0) return null;
  return names.map((name) => `@${name}`).join(', ');
}

export function ReportCard({
  report,
  href,
  onClick,
  className,
}: {
  report: ReportSummary;
  href?: string;
  onClick?: () => void;
  className?: string;
}) {
  const targetsLabel = formatTargetUsernames(report);
  const createdRelative = formatDistanceToNow(new Date(report.createdAt), {
    addSuffix: true,
    locale: ru,
  });
  const linkHref = href ?? `/report/${report.reportNumber}`;

  const content = (
    <>
      <div className="flex shrink-0 items-center justify-center">
        <ReportTypeIcon type={report.type} size="xl" />
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-base font-medium text-white">
            #{report.reportNumber} · {REPORT_TYPE_LABELS[report.type]}
          </h3>
          <ReportStatusBadge status={report.status} />
        </div>

        <p className="text-sm text-muted-foreground">
          От игрока: {report.author.username} · Создано: {createdRelative}
        </p>

        {targetsLabel ? (
          <p className="truncate text-sm text-neutral-300">На игроков: {targetsLabel}</p>
        ) : null}

        {report.assignedTo ? (
          <p className="text-sm text-neutral-400">
            Обрабатывает: @{report.assignedTo.username}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1 self-center">
        <div
          className={cn(
            'flex items-center gap-1.5 text-sm',
            report.isOverdue ? 'text-red-400' : 'text-muted-foreground',
          )}
        >
          <Clock className="h-4 w-4 shrink-0" />
          <span>{report.isOverdue ? 'Просрочено' : createdRelative}</span>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-[#F57C00]" />
      </div>
    </>
  );

  const cardClassName = cn(
    'group flex items-start gap-4 rounded-2xl glass-medium p-4 transition duration-200',
    'hover:glass-light',
    (href || onClick || linkHref) && 'cursor-pointer',
    className,
  );

  if (onClick) {
    return (
      <div
        className={cardClassName}
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick();
          }
        }}
      >
        {content}
      </div>
    );
  }

  return (
    <Link href={linkHref} className={cardClassName}>
      {content}
    </Link>
  );
}
