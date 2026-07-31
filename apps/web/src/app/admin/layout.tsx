'use client';

import { RoleGroup } from '@twomc/shared';
import { Skeleton } from '@/components/ui/skeleton';
import { RolePanelLayout } from '@/components/admin/RolePanelLayout';
import { useRoleGuard } from '@/components/admin/useRoleGuard';

const adminLinks = [
  { href: '/admin/positions', label: 'Префиксы' },
  { href: '/admin/custom-positions', label: 'Должности' },
  { href: '/admin/departments', label: 'Отделы' },
  { href: '/admin/news', label: 'Новости' },
  { href: '/admin/topics', label: 'Темы' },
  { href: '/admin/topics-internal', label: 'Внутренние' },
  { href: '/admin/support/donations', label: 'Донат-обращения' },
  { href: '/admin/reports/archived', label: 'Архив обращений' },
  { href: '/admin/badges', label: 'Бейджи' },
  { href: '/admin/awards', label: 'Награды' },
  { href: '/admin/servers', label: 'Серверы' },
  { href: '/admin/broadcast', label: 'Рассылка' },
  { href: '/admin/notifications/webhooks', label: 'Увед. webhooks' },
  { href: '/admin/notifications/broadcast', label: 'Увед. рассылка' },
  { href: '/admin/notifications/stats', label: 'Увед. статистика' },
  { href: '/admin/store/categories', label: 'Категории' },
  { href: '/admin/store/products', label: 'Товары' },
  { href: '/admin/store/bundles', label: 'Наборы' },
  { href: '/admin/store/bulk-discounts', label: 'Опт' },
  { href: '/admin/promocodes', label: 'Промокоды' },
  { href: '/admin/orders', label: 'Заказы' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, allowed } = useRoleGuard(RoleGroup.ADMIN);

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!allowed) return null;

  return (
    <RolePanelLayout title="Админ-панель" links={adminLinks}>
      {children}
    </RolePanelLayout>
  );
}
