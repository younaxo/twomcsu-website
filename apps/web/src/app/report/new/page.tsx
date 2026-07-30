'use client';

import { REPORT_TYPE_LABELS, ReportType } from '@twomc/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ReportTypeIcon, reportTypeMeta } from '@/components/reports/ReportTypeIcon';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const TYPES: Array<{
  type: ReportType;
  href: string;
  description: string;
}> = [
  {
    type: ReportType.PLAYER_COMPLAINT,
    href: '/report/new/player',
    description: 'Читы, гриферство, токсичность и другие нарушения игроков',
  },
  {
    type: ReportType.ADMIN_COMPLAINT,
    href: '/report/new/admin',
    description: 'Жалоба на действия хелпера, модератора или администратора',
  },
  {
    type: ReportType.PUNISHMENT_APPEAL,
    href: '/report/new/appeal',
    description: 'Обжалование варна, мута, кика или бана',
  },
  {
    type: ReportType.TECHNICAL_ISSUE,
    href: '/report/new/technical',
    description: 'Баги, проблемы с подключением и работой серверов',
  },
  {
    type: ReportType.DONATION_PROBLEM,
    href: '/support',
    description: 'Проблемы с оплатой, донатом и выдачей привилегий',
  },
  {
    type: ReportType.OTHER,
    href: '/report/new/other',
    description: 'Вопросы, которые не подходят под другие категории',
  },
];

export default function ReportNewPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return <Skeleton className="mx-auto mt-10 h-96 max-w-4xl rounded-2xl" />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-semibold text-white">Создать обращение</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {TYPES.map((item) => {
          const meta = reportTypeMeta(item.type);
          return (
            <Link
              key={item.type}
              href={item.href}
              className={cn(
                'group rounded-2xl glass-medium p-6 transition duration-200',
                'hover:glass-light hover:ring-1 hover:ring-[#F57C00]/50',
              )}
            >
              <div className="mb-4" style={{ color: meta.color }}>
                <ReportTypeIcon type={item.type} size="lg" />
              </div>
              <h2 className="mb-2 text-lg font-medium text-white">
                {REPORT_TYPE_LABELS[item.type]}
              </h2>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
