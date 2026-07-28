'use client';

import { RoleGroup } from '@twomc/shared';
import { Skeleton } from '@/components/ui/skeleton';
import { RolePanelLayout } from '@/components/admin/RolePanelLayout';
import { useRoleGuard } from '@/components/admin/useRoleGuard';

const adminLinks = [
  { href: '/admin/positions', label: 'Позиции' },
  { href: '/admin/badges', label: 'Префиксы' },
  { href: '/admin/awards', label: 'Награды' },
  { href: '/admin/servers', label: 'Серверы' },
  { href: '/admin/broadcast', label: 'Рассылка' },
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
