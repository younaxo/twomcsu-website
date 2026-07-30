'use client';

import {
  PUNISHMENT_TYPE_LABELS,
  type PunishmentType,
  type UserPunishmentSummary,
} from '@twomc/shared';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Ban,
  Clock,
  MessageSquareOff,
  ShieldAlert,
  UserX,
  type LucideIcon,
} from 'lucide-react';
import { ColoredUsername } from '@/components/shared/ColoredUsername';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyPunishments } from '@/hooks/reports/useReports';
import { cn } from '@/lib/utils';

const PUNISHMENT_ICONS: Record<PunishmentType, LucideIcon> = {
  WARN: ShieldAlert,
  MUTE: MessageSquareOff,
  KICK: UserX,
  TEMPBAN: Clock,
  PERMBAN: Ban,
};

function PunishmentCard({
  punishment,
  selected,
  onSelect,
}: {
  punishment: UserPunishmentSummary;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = PUNISHMENT_ICONS[punishment.punishmentType];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full rounded-xl glass-light p-4 text-left transition',
        'hover:bg-white/10',
        selected && 'ring-2 ring-[#F57C00] bg-white/5',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#F57C00]">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-white">
              {PUNISHMENT_TYPE_LABELS[punishment.punishmentType]}
            </span>
            <Badge
              variant="outline"
              className={cn(
                'border-transparent text-xs',
                punishment.isActive
                  ? 'bg-red-500/20 text-red-300'
                  : 'bg-neutral-500/20 text-neutral-300',
              )}
            >
              {punishment.isActive ? 'Активно' : 'Снято'}
            </Badge>
          </div>
          <p className="text-sm text-neutral-200">{punishment.reason}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {punishment.server ? <span>Сервер: {punishment.server}</span> : null}
            <span>
              Выдано:{' '}
              {format(new Date(punishment.issuedAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
            </span>
            {punishment.issuedByUser ? (
              <span className="inline-flex items-center gap-1">
                Кем: <ColoredUsername user={punishment.issuedByUser} size="sm" linkToProfile={false} />
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  );
}

export function PunishmentSelector({
  value,
  onChange,
  className,
}: {
  value: string | null;
  onChange: (punishmentId: string | null) => void;
  className?: string;
}) {
  const punishments = useMyPunishments(true);
  const items = punishments.data ?? [];
  const selected = items.find((item) => item.id === value) ?? null;

  if (punishments.isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className={cn('rounded-xl glass-light px-4 py-6 text-center text-sm text-muted-foreground', className)}>
        У вас нет наказаний для обжалования
      </p>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="space-y-2">
        {items.map((punishment) => (
          <PunishmentCard
            key={punishment.id}
            punishment={punishment}
            selected={value === punishment.id}
            onSelect={() => onChange(punishment.id)}
          />
        ))}
      </div>

      {selected ? (
        <div className="rounded-xl border border-[#F57C00]/30 bg-[#F57C00]/10 p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#F57C00]">
            Выбрано наказание
          </p>
          <PunishmentCard
            punishment={selected}
            selected
            onSelect={() => onChange(selected.id)}
          />
        </div>
      ) : null}
    </div>
  );
}
