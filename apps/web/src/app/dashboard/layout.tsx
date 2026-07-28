'use client';

import { RoleGroup } from '@twomc/shared';
import { Skeleton } from '@/components/ui/skeleton';
import { RolePanelLayout } from '@/components/admin/RolePanelLayout';
import { useRoleGuard } from '@/components/admin/useRoleGuard';

const dashboardLinks = [
  { href: '/dashboard', label: 'Обзор' },
  { href: '/dashboard/settings', label: 'Настройки сайта' },
  { href: '/dashboard/announcements', label: 'Объявления' },
  { href: '/dashboard/audit-log', label: 'Audit log' },
  { href: '/dashboard/orders/stats', label: 'Заказы: сводка' },
  { href: '/dashboard/store/stats', label: 'Статистика магазина' },
  { href: '/dashboard/store/loyalty', label: 'Лояльность' },
  { href: '/dashboard/store/currencies', label: 'Валюты' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, allowed } = useRoleGuard(RoleGroup.ADMIN);

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!allowed) return null;

  return (
    <RolePanelLayout title="Дашборд" links={dashboardLinks}>
      {children}
    </RolePanelLayout>
  );
}
