'use client';

import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSystemStatus, type SystemAnnouncement } from '@/hooks/useSystemStatus';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'twomc.dismissed-announcements';

const typeStyles: Record<string, { icon: typeof Info; className: string }> = {
  info: {
    icon: Info,
    className: 'border-info/30 bg-info/10 text-info',
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-warning/30 bg-warning/10 text-warning',
  },
  success: {
    icon: CheckCircle2,
    className: 'border-success/30 bg-success/10 text-success',
  },
  error: {
    icon: AlertCircle,
    className: 'border-destructive/30 bg-destructive/10 text-destructive',
  },
};

function readDismissed(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeDismissed(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

function AnnouncementItem({
  item,
  onDismiss,
}: {
  item: SystemAnnouncement;
  onDismiss: (id: string) => void;
}) {
  const style = typeStyles[item.type] ?? typeStyles.info;
  const Icon = style.icon;

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-card border bg-card px-4 py-3',
        style.className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0 opacity-90" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{item.title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{item.message}</p>
        {item.link ? (
          <a
            href={item.link}
            className="mt-1 inline-block text-xs font-medium text-primary underline-offset-2 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Подробнее
          </a>
        ) : null}
      </div>
      {item.isDismissible ? (
        <button
          type="button"
          className="rounded-control p-1 text-muted-foreground transition-colors duration-fast ease-out hover:bg-control-hover hover:text-foreground"
          aria-label="Закрыть"
          onClick={() => onDismiss(item.id)}
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

export function AnnouncementsBanner() {
  const { data } = useSystemStatus();
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    setDismissed(readDismissed());
  }, []);

  const visible = useMemo(() => {
    const list = data?.announcements ?? [];
    return list.filter((a) => !dismissed.includes(a.id));
  }, [data?.announcements, dismissed]);

  if (visible.length === 0) return null;

  const dismiss = (id: string) => {
    const next = [...new Set([...dismissed, id])];
    setDismissed(next);
    writeDismissed(next);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[5.5rem] z-40 mx-auto w-[92%] max-w-[1440px] space-y-2 sm:top-24">
      {visible.map((item) => (
        <div key={item.id} className="pointer-events-auto">
          <AnnouncementItem item={item} onDismiss={dismiss} />
        </div>
      ))}
    </div>
  );
}
