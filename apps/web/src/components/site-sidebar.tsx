'use client';

import { RoleGroup, hasRoleGroup } from '@twomc/shared';
import type { ComponentType } from 'react';
import {
  AlertTriangle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Newspaper,
  PanelLeft,
  Server,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Ticket,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/store';
import { useChatStore } from '@/stores/chatStore';
import { useStoreUiStore } from '@/stores/storeUiStore';
import { cn } from '@/lib/utils';

const SIDEBAR_EXPANDED_KEY = 'twomc.sidebarExpanded';

type NavItem = {
  href?: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  soon?: boolean;
  action?: 'chat' | 'cart';
  roles?: 'helper' | 'admin' | 'owner';
};

const mainNav: NavItem[] = [
  { href: '/store', label: 'Магазин', icon: ShoppingBag },
  { href: '/servers', label: 'Серверы', icon: Server },
  { href: '/news', label: 'Новости', icon: Newspaper },
  { href: '/wiki', label: 'Вики', icon: BookOpen, soon: true },
  { href: '/support', label: 'Обращения', icon: Ticket, soon: true },
  { href: '/reports', label: 'Репорты', icon: AlertTriangle, soon: true },
];

const bottomNav: NavItem[] = [
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
        'relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-colors',
        collapsed && 'justify-center px-2',
        active
          ? 'bg-primary/20 text-primary'
          : 'text-[#b0b0b0] hover:bg-white/8 hover:text-white',
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
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="block cursor-pointer">{node}</span>
      </TooltipTrigger>
      <TooltipContent side="right" className="flex items-center gap-2">
        {item.label}
        {item.soon ? <span className="text-muted-foreground">· в разработке</span> : null}
      </TooltipContent>
    </Tooltip>
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
    roleItems.push({ href: '/moderation', label: 'Модерация', icon: Shield, roles: 'helper' });
  }
  if (user && hasRoleGroup(user.roleGroup, RoleGroup.ADMIN)) {
    roleItems.push({ href: '/admin', label: 'Админ', icon: PanelLeft, roles: 'admin' });
    roleItems.push({ href: '/dashboard', label: 'Дашборд', icon: LayoutDashboard, roles: 'admin' });
  }

  const handleAction = (action?: 'chat' | 'cart') => {
    if (action === 'chat') setWidgetOpen(true);
    if (action === 'cart') openCartDrawer();
    onNavigate?.();
  };

  return (
    <div className="flex h-full flex-col">
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {mainNav.map((item) => {
          const active = item.href
            ? pathname === item.href || pathname.startsWith(`${item.href}/`)
            : false;
          return (
            <div key={item.label} onClick={onNavigate}>
              <NavButton item={item} active={active} collapsed={collapsed} />
            </div>
          );
        })}
        {roleItems.length > 0 ? (
          <>
            <div className="my-2 border-t border-white/10" />
            {roleItems.map((item) => {
              const active = item.href
                ? pathname === item.href || pathname.startsWith(`${item.href}/`)
                : false;
              return (
                <div key={item.label} onClick={onNavigate}>
                  <NavButton item={item} active={active} collapsed={collapsed} />
                </div>
              );
            })}
          </>
        ) : null}
      </nav>

      <div className="mt-auto space-y-1 border-t border-white/10 p-2">
        {bottomNav.map((item) => (
          <NavButton
            key={item.label}
            item={item}
            collapsed={collapsed}
            badge={item.action === 'chat' ? unreadChat : item.action === 'cart' ? cartCount : undefined}
            onAction={() => handleAction(item.action)}
          />
        ))}
      </div>
    </div>
  );
}

export function SiteSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_EXPANDED_KEY);
      if (stored === '1') setExpanded(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const width = expanded ? '240px' : '88px';
    document.documentElement.style.setProperty('--sidebar-rail-width', width);
    try {
      localStorage.setItem(SIDEBAR_EXPANDED_KEY, expanded ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [expanded]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'glass-panel pointer-events-auto fixed bottom-5 left-5 top-24 z-40 hidden flex-col overflow-hidden rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.25)] transition-[width] duration-200 lg:flex',
          expanded ? 'w-[240px]' : 'w-[88px]',
        )}
        aria-label="Боковая навигация"
      >
        <div className="flex items-center justify-end border-b border-white/10 p-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 cursor-pointer text-[#b0b0b0] hover:text-white"
                onClick={() => setExpanded((v) => !v)}
                aria-label={expanded ? 'Свернуть панель' : 'Развернуть панель'}
              >
                {expanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {expanded ? 'Свернуть' : 'Развернуть'}
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="min-h-0 flex-1">
          <SidebarNav collapsed={!expanded} />
        </div>
      </aside>

      {/* Mobile hamburger */}
      <div className="fixed bottom-5 left-5 z-40 lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              size="icon"
              className="glass-modal h-12 w-12 cursor-pointer rounded-2xl shadow-lg"
              aria-label="Открыть меню"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="glass-modal w-[min(100vw-2rem,260px)] p-0">
            <SheetHeader className="border-b border-white/10 px-4 py-4 text-left">
              <SheetTitle className="text-base">Навигация</SheetTitle>
            </SheetHeader>
            <div className="h-[calc(100%-4rem)]">
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
