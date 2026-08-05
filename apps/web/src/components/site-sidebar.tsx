'use client';

import { RoleGroup, hasRoleGroup } from '@twomc/shared';
import type { ComponentType } from 'react';
import {
  AlertTriangle,
  BookOpen,
  ClipboardList,
  FileText,
  Home,
  LayoutDashboard,
  Mail,
  Menu,
  MessageCircle,
  Newspaper,
  Activity,
  Scale,
  Server,
  Shield,
  ShoppingBag,
  ShoppingCart,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CurrencySelector } from '@/components/store/CurrencySelector';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/store';
import { useChatStore } from '@/stores/chatStore';
import { useStoreUiStore } from '@/stores/storeUiStore';
import { cn } from '@/lib/utils';

type NavItem = {
  href?: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  soon?: boolean;
  action?: 'chat' | 'cart';
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const mainGroups: NavGroup[] = [
  {
    title: 'Основное',
    items: [
      { href: '/', label: 'Главная', icon: Home },
      { href: '/store', label: 'Магазин', icon: ShoppingBag },
      { href: '/servers', label: 'Серверы', icon: Server },
      { href: '/news', label: 'Новости', icon: Newspaper },
      { href: '/feed', label: 'Лента активности', icon: Activity },
    ],
  },
  {
    title: 'Сообщество',
    items: [
      { href: '/rules', label: 'Правила', icon: Scale },
      { href: '/documents', label: 'Документы', icon: FileText },
      { href: '/forms', label: 'Формы', icon: ClipboardList },
      { href: '/wiki', label: 'Вики', icon: BookOpen, soon: true },
      { href: '/reports', label: 'Репорты', icon: AlertTriangle, soon: true },
    ],
  },
];

const quickAccess: NavItem[] = [
  { label: 'Чат', icon: MessageCircle, action: 'chat' },
  { label: 'Корзина', icon: ShoppingCart, action: 'cart' },
];

function NavButton({
  item,
  active,
  badge,
  onAction,
  collapsed,
}: {
  item: NavItem;
  active?: boolean;
  badge?: number;
  onAction?: () => void;
  collapsed?: boolean;
}) {
  const Icon = item.icon;
  const content = (
    <span
      className={cn(
        'relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150',
        collapsed && 'justify-center px-2',
        active
          ? 'border-l-2 border-primary bg-primary/15 text-primary'
          : 'border-l-2 border-transparent text-neutral-400 hover:bg-white/[0.06] hover:text-white',
        item.soon && 'opacity-70',
      )}
    >
      <Icon className="h-6 w-6 shrink-0" />
      {!collapsed ? (
        <span className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium">
          <span className="truncate">{item.label}</span>
          {item.soon ? (
            <Badge variant="secondary" className="shrink-0 px-1.5 py-0 text-[10px]">
              скоро
            </Badge>
          ) : null}
        </span>
      ) : null}
      {badge && badge > 0 ? (
        <Badge
          variant="destructive"
          className={cn(
            'h-5 min-w-5 justify-center px-1 text-[10px]',
            collapsed ? 'absolute -right-0.5 -top-0.5' : 'ml-auto',
          )}
        >
          {badge > 99 ? '99+' : badge}
        </Badge>
      ) : null}
    </span>
  );

  const node = item.href ? (
    <Link href={item.href} className="block cursor-pointer" aria-label={item.label}>
      {content}
    </Link>
  ) : (
    <button type="button" className="block w-full cursor-pointer" onClick={onAction} aria-label={item.label}>
      {content}
    </button>
  );

  if (!collapsed) return node;

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>{node}</TooltipTrigger>
      <TooltipContent side="right" className="flex items-center gap-2">
        {item.label}
        {item.soon ? <span className="text-muted-foreground">· в разработке</span> : null}
      </TooltipContent>
    </Tooltip>
  );
}

function GroupTitle({ title, collapsed }: { title: string; collapsed?: boolean }) {
  if (collapsed) {
    return <div className="mx-auto my-2 h-px w-8 bg-white/10" aria-hidden />;
  }
  return (
    <p className="px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
      {title}
    </p>
  );
}

function SidebarNav({
  collapsed,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const openCartDrawer = useStoreUiStore((s) => s.openCartDrawer);
  const setWidgetOpen = useChatStore((s) => s.setWidgetOpen);
  const unreadChat = useChatStore((s) =>
    Object.values(s.unreadCounts).reduce((a, b) => a + b, 0),
  );
  const cart = useCart(isAuthenticated);
  const cartCount = cart.data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  const roleItems: NavItem[] = [];
  if (user && hasRoleGroup(user.roleGroup, RoleGroup.HELPER)) {
    roleItems.push({ href: '/moderation', label: 'Модерация', icon: Shield });
  }
  if (user && hasRoleGroup(user.roleGroup, RoleGroup.ADMIN)) {
    roleItems.push({ href: '/admin', label: 'Админ', icon: LayoutDashboard });
  }
  if (user && hasRoleGroup(user.roleGroup, RoleGroup.OWNER)) {
    roleItems.push({ href: '/dashboard', label: 'Дашборд', icon: LayoutDashboard });
  }

  const handleAction = (action?: 'chat' | 'cart') => {
    if (action === 'chat') setWidgetOpen(true);
    if (action === 'cart') openCartDrawer();
    onNavigate?.();
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2 py-3">
        {mainGroups.map((group) => {
          const items =
            group.title === 'Сообщество' && isAuthenticated
              ? [
                  ...group.items,
                  { href: '/report', label: 'Обращения', icon: Mail } satisfies NavItem,
                ]
              : group.items;

          return (
          <div key={group.title} className="mb-1">
            <GroupTitle title={group.title} collapsed={collapsed} />
            <div className="flex flex-col gap-0.5">
              {items.map((item) => (
                <div key={item.label} onClick={onNavigate}>
                  <NavButton
                    item={item}
                    active={isActive(item.href)}
                    collapsed={collapsed}
                  />
                </div>
              ))}
            </div>
          </div>
          );
        })}

        {roleItems.length > 0 ? (
          <div className="mb-1">
            <GroupTitle title="Панели" collapsed={collapsed} />
            <div className="flex flex-col gap-0.5">
              {roleItems.map((item) => (
                <div key={item.label} onClick={onNavigate}>
                  <NavButton item={item} active={isActive(item.href)} collapsed={collapsed} />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </nav>

      <div className="mt-auto shrink-0 space-y-1 border-t border-white/5 px-2 py-3">
        {!collapsed ? (
          <p className="px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
            Быстрый доступ
          </p>
        ) : (
          <div className="mx-auto my-1 h-px w-8 bg-white/10" aria-hidden />
        )}
        {quickAccess.map((item) => (
          <NavButton
            key={item.label}
            item={item}
            collapsed={collapsed}
            badge={item.action === 'chat' ? unreadChat : item.action === 'cart' ? cartCount : undefined}
            onAction={() => handleAction(item.action)}
          />
        ))}
        <div className={cn('pt-1', collapsed && 'flex justify-center')}>
          {collapsed ? (
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <div className="w-full">
                  <CurrencySelector compact className="h-10 w-full justify-center px-2" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">Валюта</TooltipContent>
            </Tooltip>
          ) : (
            <CurrencySelector compact className="w-full" />
          )}
        </div>
      </div>
    </div>
  );
}

export function SiteSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Desktop: fixed rail — does not scroll with the page */}
      <aside
        className={cn(
          'pointer-events-auto fixed left-0 top-0 z-40 hidden h-screen w-[72px] flex-col overflow-hidden',
          'border-r border-white/5 bg-neutral-950/70 backdrop-blur-[20px]',
          'lg:flex xl:w-[260px]',
        )}
        aria-label="Боковая навигация"
      >
        <div className="hidden h-full min-h-0 xl:block">
          <SidebarNav />
        </div>
        <div className="h-full min-h-0 xl:hidden">
          <SidebarNav collapsed />
        </div>
      </aside>

      {/* Mobile hamburger */}
      <div className="fixed bottom-5 left-5 z-40 lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              size="icon"
              className="h-12 w-12 rounded-2xl border border-white/10 bg-neutral-950/80 shadow-lg backdrop-blur-xl"
              aria-label="Открыть меню"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[min(100vw-2rem,260px)] border-white/5 bg-neutral-950/90 p-0 backdrop-blur-[20px]"
          >
            <SheetHeader className="border-b border-white/5 px-4 py-4 text-left">
              <SheetTitle className="text-base">Навигация</SheetTitle>
            </SheetHeader>
            <div className="h-[calc(100%-4rem)] overflow-y-auto">
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
