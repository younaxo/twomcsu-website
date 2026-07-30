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
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const TYPE_CONFIG: Record<
  ReportType,
  {
    href: string;
    description: string;
    icon: LucideIcon;
    color: string;
    badges?: string[];
  }
> = {
  [ReportType.PLAYER_COMPLAINT]: {
    href: '/report/new/player',
    description: 'Читы, гриферство, токсичность и другие нарушения игроков',
    icon: Target,
    color: '#EF4444',
  },
  [ReportType.ADMIN_COMPLAINT]: {
    href: '/report/new/admin',
    description: 'Жалоба на действия хелпера, модератора или администратора',
    icon: Shield,
    color: '#F57C00',
    badges: ['Хелпер', 'Модератор', 'Администратор', 'Владелец'],
  },
  [ReportType.PUNISHMENT_APPEAL]: {
    href: '/report/new/appeal',
    description: 'Обжалование варна, мута, кика или бана',
    icon: Scale,
    color: '#8B5CF6',
  },
  [ReportType.TECHNICAL_ISSUE]: {
    href: '/report/new/technical',
    description: 'Баги, проблемы с подключением и работой серверов',
    icon: Wrench,
    color: '#3B82F6',
  },
  [ReportType.DONATION_PROBLEM]: {
    href: '/support',
    description: 'Проблемы с оплатой, донатом и выдачей привилегий',
    icon: CreditCard,
    color: '#10B981',
  },
  [ReportType.OTHER]: {
    href: '/report/new/other',
    description: 'Вопросы, которые не подходят под другие категории',
    icon: MessageSquare,
    color: '#6B7280',
  },
};

const DISPLAY_ORDER: ReportType[] = [
  ReportType.PLAYER_COMPLAINT,
  ReportType.ADMIN_COMPLAINT,
  ReportType.PUNISHMENT_APPEAL,
  ReportType.TECHNICAL_ISSUE,
  ReportType.DONATION_PROBLEM,
  ReportType.OTHER,
];

export function ReportTypeCard({ type }: { type: ReportType }) {
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;

  return (
    <Link
      href={config.href}
      className={cn(
        'group flex h-full flex-col rounded-2xl glass-medium p-6 transition duration-200',
        'hover:glass-light hover:scale-[1.02] hover:ring-1 hover:ring-[#F57C00]/50',
      )}
    >
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl glass-light"
        style={{ color: config.color }}
      >
        <Icon className="h-8 w-8" strokeWidth={1.5} />
      </div>
      <h2 className="mb-2 text-lg font-semibold text-white group-hover:text-[#F57C00]">
        {REPORT_TYPE_LABELS[type]}
      </h2>
      <p className="mb-4 flex-1 text-sm text-muted-foreground">{config.description}</p>
      {config.badges ? (
        <div className="flex flex-wrap gap-1.5">
          {config.badges.map((badge) => (
            <Badge key={badge} variant="secondary" className="text-xs">
              {badge}
            </Badge>
          ))}
        </div>
      ) : null}
    </Link>
  );
}

export function ReportTypeCardGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {DISPLAY_ORDER.map((type) => (
        <ReportTypeCard key={type} type={type} />
      ))}
    </div>
  );
}
