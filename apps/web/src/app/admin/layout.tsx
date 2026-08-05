'use client';

import { useRouter } from 'next/navigation';
import { RoleGroup } from '@twomc/shared';
import { Bell, Command } from 'lucide-react';
import { useMemo, useState } from 'react';
import { QuickActionsMenu, RolePanelLayout } from '@/components/admin';
import { useRoleGuard } from '@/components/admin/useRoleGuard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardOverview } from '@/hooks/admin';

const adminLinks = [
  { href: '/admin/users', label: 'Пользователи' },
  { href: '/admin/positions', label: 'Позиции' },
  { href: '/admin/badges', label: 'Бейджи' },
  { href: '/admin/awards', label: 'Награды' },
  { href: '/admin/departments', label: 'Отделы' },
  { href: '/admin/custom-positions', label: 'Кастомные должности' },
  { href: '/admin/store/products', label: 'Товары' },
  { href: '/admin/store/categories', label: 'Категории' },
  { href: '/admin/store/bundles', label: 'Бандлы' },
  { href: '/admin/promocodes', label: 'Промокоды' },
  { href: '/admin/store/bulk-discounts', label: 'Скидки' },
  { href: '/admin/orders', label: 'Заказы' },
  { href: '/admin/news', label: 'Новости' },
  { href: '/admin/activity/manage', label: 'Лента' },
  { href: '/admin/activity/stats', label: 'Лента · статистика' },
  { href: '/admin/activity/custom', label: 'Лента · объявление' },
  { href: '/admin/topics', label: 'Темы' },
  { href: '/admin/emojis', label: 'Эмодзи' },
  { href: '/admin/media-requests', label: 'Медиа заявки' },
  { href: '/admin/broadcast', label: 'Рассылка' },
  { href: '/admin/exports/scheduled', label: 'Экспорт' },
  { href: '/admin/settings/site', label: 'Настройки' },
  { href: '/admin/audit-log', label: 'Audit log' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoading, allowed } = useRoleGuard(RoleGroup.ADMIN);
  const [quickOpen, setQuickOpen] = useState(false);
  const overview = useDashboardOverview(allowed);

  const quickActions = useMemo(
    () => [
      {
        id: 'users',
        label: 'Пользователи',
        group: 'Навигация',
        onSelect: () => router.push('/admin/users'),
      },
      {
        id: 'orders',
        label: 'Заказы',
        group: 'Навигация',
        onSelect: () => router.push('/admin/orders'),
      },
      {
        id: 'news',
        label: 'Новости',
        group: 'Навигация',
        onSelect: () => router.push('/admin/news'),
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
        id: 'exports',
        label: 'Запланированный экспорт',
        group: 'Действия',
        onSelect: () => router.push('/admin/exports/scheduled'),
      },
      {
        id: 'dashboard',
        label: 'Дашборд владельца',
        group: 'Навигация',
        onSelect: () => router.push('/dashboard'),
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
        <Button asChild variant="secondary" size="sm">
          <a href="/moderation/reports">
            <Bell className="mr-1.5 h-4 w-4" />
            <span className="rounded-full bg-[#F57C00] px-1.5 py-0.5 text-xs text-white">
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
      <RolePanelLayout
        title="Админ-панель"
        links={adminLinks}
        variant="sidebar"
        headerExtra={headerExtra}
      >
        {children}
      </RolePanelLayout>
      <QuickActionsMenu actions={quickActions} open={quickOpen} onOpenChange={setQuickOpen} />
    </>
  );
}
