'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RoleGroup, hasRoleGroup } from '@twomc/shared';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const adminLinks = [
  { href: '/admin/dashboard', label: 'Дашборд' },
  { href: '/admin/positions', label: 'Позиции' },
  { href: '/admin/badges', label: 'Бейджи' },
  { href: '/admin/awards', label: 'Награды' },
  { href: '/admin/servers', label: 'Серверы' },
  { href: '/admin/broadcast', label: 'Рассылка' },
  { href: '/admin/announcements', label: 'Объявления' },
  { href: '/admin/settings', label: 'Настройки' },
  { href: '/admin/audit-log', label: 'Audit log' },
  { href: '/admin/store/categories', label: 'Категории' },
  { href: '/admin/store/products', label: 'Товары' },
  { href: '/admin/store/bundles', label: 'Наборы' },
  { href: '/admin/store/bulk-discounts', label: 'Опт' },
  { href: '/admin/store/loyalty', label: 'Лояльность' },
  { href: '/admin/store/currencies', label: 'Валюты' },
  { href: '/admin/store/stats', label: 'Статистика' },
  { href: '/admin/promocodes', label: 'Промокоды' },
  { href: '/admin/orders', label: 'Заказы' },
  { href: '/admin/orders/stats', label: 'Заказы: сводка' },
  { href: '/admin/media-requests', label: 'Медиа' },
  { href: '/admin/profile-reports', label: 'Жалобы' },
  { href: '/admin/comment-reports', label: 'Комментарии' },
  { href: '/admin/chat/channels', label: 'Чат: каналы' },
  { href: '/admin/chat/mutes', label: 'Чат: муты' },
  { href: '/admin/chat/bans', label: 'Чат: баны' },
  { href: '/admin/chat/search', label: 'Чат: поиск' },
  { href: '/admin/chat/settings', label: 'Чат: настройки' },
];

/** Middleware only checks the cookie, the role itself is verified here and on the api */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const allowed = user ? hasRoleGroup(user.roleGroup, RoleGroup.ADMIN) : false;

  useEffect(() => {
    if (isLoading || allowed) {
      return;
    }

    toast.error('Недостаточно прав');
    router.replace('/');
  }, [allowed, isLoading, router]);

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!allowed) return null;

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-1 rounded-xl border border-border bg-card/50 p-2">
        {adminLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'rounded-md px-2.5 py-1.5 text-xs transition-colors hover:bg-accent',
              pathname.startsWith(link.href)
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground',
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
