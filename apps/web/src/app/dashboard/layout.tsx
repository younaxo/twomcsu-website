'use client';

import { useRouter } from 'next/navigation';
import { RoleGroup } from '@twomc/shared';
import { Bell, Command } from 'lucide-react';
import { useMemo, useState } from 'react';
import { QuickActionsMenu, RolePanelLayout } from '@/components/admin';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRoleGuard } from '@/components/admin/useRoleGuard';
import { useDashboardOverview } from '@/hooks/admin';

const dashboardLinks = [
  { href: '/dashboard', label: 'Обзор' },
  { href: '/admin/settings/site', label: 'Настройки сайта' },
  { href: '/dashboard/announcements', label: 'Объявления' },
  { href: '/dashboard/audit-log', label: 'Audit log' },
  { href: '/dashboard/orders/stats', label: 'Заказы: сводка' },
  { href: '/dashboard/store/stats', label: 'Статистика магазина' },
  { href: '/dashboard/store/loyalty', label: 'Лояльность' },
  { href: '/dashboard/store/currencies', label: 'Валюты' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoading, allowed } = useRoleGuard(RoleGroup.OWNER);
  const [quickOpen, setQuickOpen] = useState(false);
  const overview = useDashboardOverview(allowed);

  const quickActions = useMemo(
    () => [
      {
        id: 'overview',
        label: 'Обзор дашборда',
        group: 'Навигация',
        onSelect: () => router.push('/dashboard'),
      },
      {
        id: 'users',
        label: 'Пользователи',
        group: 'Навигация',
        onSelect: () => router.push('/admin/users'),
      },
      {
        id: 'settings',
        label: 'Настройки сайта',
        group: 'Навигация',
        onSelect: () => router.push('/admin/settings/site'),
      },
      {
        id: 'audit',
        label: 'Audit log',
        group: 'Навигация',
        onSelect: () => router.push('/admin/audit-log'),
      },
      {
        id: 'broadcast',
        label: 'Рассылка',
        group: 'Действия',
        onSelect: () => router.push('/admin/broadcast'),
      },
    ],
    [router],
  );

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!allowed) return null;

  const pendingCount =
    (overview.data?.reports.pending ?? 0) + (overview.data?.reports.inReview ?? 0);

  const headerExtra = (
    <>
      {pendingCount > 0 ? (
        <Button asChild variant="secondary" size="sm" className="relative">
          <a href="/moderation/reports">
            <Bell className="mr-1.5 h-4 w-4" />
            Обращения
            <span className="ml-1.5 rounded-full bg-[#F57C00] px-1.5 py-0.5 text-xs text-white">
              {pendingCount}
            </span>
          </a>
        </Button>
      ) : null}
      <Button type="button" variant="secondary" size="sm" onClick={() => setQuickOpen(true)}>
        <Command className="mr-1.5 h-4 w-4" />
        Ctrl+K
      </Button>
    </>
  );

  return (
    <>
      <RolePanelLayout title="Дашборд" links={dashboardLinks} headerExtra={headerExtra}>
        {children}
      </RolePanelLayout>
      <QuickActionsMenu actions={quickActions} open={quickOpen} onOpenChange={setQuickOpen} />
    </>
  );
}
