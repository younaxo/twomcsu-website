'use client';

import type { ReportDetails } from '@twomc/shared';
import { REPORT_STATUS_LABELS } from '@twomc/shared';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function ReportTimeline({
  report,
  className,
}: {
  report: ReportDetails;
  className?: string;
}) {
  const systemEvents = report.messages
    .filter((message) => message.isSystem)
    .map((message) => ({
      id: message.id,
      label: message.content,
      at: message.createdAt,
    }));

  const items = [
    {
      id: 'created',
      label: `Создано · ${REPORT_STATUS_LABELS.PENDING}`,
      at: report.createdAt,
    },
    ...systemEvents,
  ];

  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="text-sm font-medium text-white">История</h3>
      <ol className="relative space-y-4 border-l border-white/15 pl-4">
        {items.map((item) => (
          <li key={item.id} className="relative">
            <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
            <p className="text-sm text-neutral-200">{item.label}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(item.at), 'dd.MM.yyyy HH:mm', { locale: ru })}
            </p>
          </li>
        ))}
      </ol>

      {report.incidentDate ? (
        <div className="rounded-lg glass-light px-3 py-2 text-sm">
          <p className="text-muted-foreground">Дата инцидента</p>
          <p className="text-white">
            {format(new Date(report.incidentDate), 'dd.MM.yyyy HH:mm', { locale: ru })}
          </p>
        </div>
      ) : null}

      {report.server ? (
        <div className="rounded-lg glass-light px-3 py-2 text-sm">
          <p className="text-muted-foreground">Сервер</p>
          <p className="text-white">{report.server}</p>
        </div>
      ) : null}
    </div>
  );
}
