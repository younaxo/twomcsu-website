'use client';

import type { ReportDetails } from '@twomc/shared';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { CheckCircle2, Info, XCircle } from 'lucide-react';
import { AvatarWithSkin } from '@/components/shared/AvatarWithSkin';
import { ColoredUsername } from '@/components/shared/ColoredUsername';
import { cn } from '@/lib/utils';

function verdictTone(status: ReportDetails['status']) {
  if (status === 'REJECTED') {
    return {
      Icon: XCircle,
      accent: '#ef4444',
      iconClass: 'text-red-400',
      gradient: 'from-red-500/15 via-transparent to-transparent',
    };
  }
  if (status === 'CLOSED') {
    return {
      Icon: Info,
      accent: '#9ca3af',
      iconClass: 'text-neutral-400',
      gradient: 'from-neutral-500/15 via-transparent to-transparent',
    };
  }
  return {
    Icon: CheckCircle2,
    accent: '#34d399',
    iconClass: 'text-emerald-400',
    gradient: 'from-emerald-500/15 via-transparent to-transparent',
  };
}

export function ReportVerdictCard({ report }: { report: ReportDetails }) {
  if (!report.verdict) {
    return null;
  }

  const tone = verdictTone(report.status);
  const Icon = tone.Icon;

  return (
    <article
      className={cn(
        'animate-in fade-in slide-in-from-top-2 rounded-2xl border border-white/10 bg-gradient-to-br p-6 shadow-lg duration-500 glass-strong',
        tone.gradient,
      )}
      style={{ borderLeftWidth: 4, borderLeftColor: tone.accent }}
    >
      <div className="mb-4 flex items-start gap-3">
        <Icon className={cn('h-12 w-12 shrink-0', tone.iconClass)} />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold text-white">Вердикт по обращению</h2>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {report.assignedTo ? (
              <div className="flex items-center gap-2">
                <AvatarWithSkin user={report.assignedTo} size="sm" />
                <ColoredUsername user={report.assignedTo} size="sm" />
              </div>
            ) : null}
            {report.resolvedAt ? (
              <time dateTime={report.resolvedAt}>
                {format(new Date(report.resolvedAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
              </time>
            ) : null}
          </div>
        </div>
      </div>

      {report.verdictHtml ? (
        <div
          className="prose prose-invert max-w-none text-sm"
          dangerouslySetInnerHTML={{ __html: report.verdictHtml }}
        />
      ) : (
        <p className="whitespace-pre-wrap text-sm text-neutral-100">{report.verdict}</p>
      )}
    </article>
  );
}
