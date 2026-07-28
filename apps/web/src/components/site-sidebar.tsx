'use client';

import {
  BookOpen,
  Flag,
  Home,
  MessageCircle,
  Newspaper,
  Server,
  ShoppingBag,
  ShoppingCart,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CurrencySelector } from '@/components/store/CurrencySelector';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/store';
import { useChatStore } from '@/stores/chatStore';
import { cn } from '@/lib/utils';

const mainLinks = [
  { href: '/', label: 'Главная', icon: Home },
  { href: '/store', label: 'Магазин', icon: ShoppingBag },
  { href: '/servers', label: 'Серверы', icon: Server },
  { href: '/news', label: 'Новости', icon: Newspaper },
] as const;

const communityLinks = [
  { href: '/wiki', label: 'Вики', icon: BookOpen, soon: true },
  { href: '/reports', label: 'Репорты', icon: Flag, soon: true },
] as const;

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  badge,
  soon,
  onClick,
}: {
  href?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
  badge?: number;
  soon?: boolean;
  onClick?: () => void;
}) {
  const className = cn(
    'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150',
    active
      ? 'bg-primary/15 text-primary before:absolute before:inset-y-1 before:left-0 before:w-0.5 before:rounded-full before:bg-primary'
      : 'text-neutral-400 hover:bg-white/5 hover:text-white',
    soon && 'opacity-70',
  );

  const content = (
    <>
      <Icon className="h-6 w-6 shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {soon ? (
        <Badge variant="secondary" className="shrink-0 px-1.5 py-0 text-[10px]">
          скоро
        </Badge>
      ) : null}
      {badge && badge > 0 ? (
        <Badge variant="destructive" className="h-5 min-w-5 justify-center px-1 text-[10px]">
          {badge > 99 ? '99+' : badge}
        </Badge>
      ) : null}
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={cn(className, 'w-full text-left')} onClick={onClick}>
        {content}
      </button>
    );
  }

  return (
    <Link href={href!} className={className}>
      {content}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
      {children}
    </p>
  );
}

export function SiteSidebar() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const cart = useCart(isAuthenticated);
  const setWidgetOpen = useChatStore((s) => s.setWidgetOpen);
  const unreadChat = useChatStore((s) =>
    Object.values(s.unreadCounts).reduce((a, b) => a + b, 0),
  );
  const cartCount = cart.data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col border-r border-white/5',
        'bg-neutral-950/70 backdrop-blur-[20px] lg:flex',
      )}
    >
      <div className="flex-1 overflow-y-auto px-2 pb-4 pt-28">
        <SectionLabel>Основное</SectionLabel>
        <nav className="space-y-0.5">
          {mainLinks.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isActive(item.href)}
            />
          ))}
        </nav>

        <SectionLabel>Сообщество</SectionLabel>
        <nav className="space-y-0.5">
          {communityLinks.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isActive(item.href)}
              soon={item.soon}
            />
          ))}
        </nav>
      </div>

      <div className="space-y-0.5 border-t border-white/5 px-2 py-3">
        <SectionLabel>Быстрый доступ</SectionLabel>
        {isAuthenticated ? (
          <NavItem
            label="Чат"
            icon={MessageCircle}
            badge={unreadChat}
            onClick={() => setWidgetOpen(true)}
          />
        ) : null}
        {isAuthenticated ? (
          <NavItem href="/store/cart" label="Корзина" icon={ShoppingCart} badge={cartCount} />
        ) : null}
        <div className="px-2 pt-2">
          <CurrencySelector compact />
        </div>
      </div>
    </aside>
  );
}
