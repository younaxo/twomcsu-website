'use client';

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSystemStatus, type SystemAnnouncement } from '@/hooks/useSystemStatus';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'twomc.dismissed-announcements';

const typeStyles: Record<
  string,
  { icon: typeof Info; className: string }
> = {
  info: {
    icon: Info,
    className: 'border-sky-500/30 bg-sky-500/10 text-sky-100',
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
  },
  success: {
    icon: CheckCircle2,
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
  },
  error: {
    icon: AlertCircle,
    className: 'border-red-500/30 bg-red-500/10 text-red-100',
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
        'glass-medium flex items-start gap-3 rounded-xl border px-4 py-3',
        style.className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0 opacity-90" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">{item.title}</p>
        <p className="mt-0.5 text-sm text-white/80">{item.message}</p>
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
          className="rounded-md p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
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
