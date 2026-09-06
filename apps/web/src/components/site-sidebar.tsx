'use client';

import { RoleGroup, hasRoleGroup } from '@twomc/shared';
import type { ComponentType } from 'react';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  Home,
  LayoutDashboard,
  Mail,
  Medal,
  Menu,
  MessageCircle,
  MessagesSquare,
  Newspaper,
  Radio,
  Scale,
  Server,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Trophy,
  Vote,
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
import { useConversations } from '@/hooks/useDirectMessages';
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
      { href: '/events', label: 'Календарь', icon: CalendarDays },
      { href: '/feed', label: 'Лента активности', icon: Activity },
      { href: '/achievements', label: 'Достижения', icon: Trophy },
      { href: '/leaderboards', label: 'Рейтинг', icon: Medal },
      { href: '/streams', label: 'Стримы', icon: Radio },
      { href: '/vote', label: 'Голосование', icon: Vote },
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
  { href: '/messages', label: 'Сообщения', icon: MessagesSquare },
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
        'relative flex min-h-11 w-full items-center gap-3 rounded-xl border px-3 py-2.5 transition-[background-color,border-color,color] duration-200',
        collapsed && 'justify-center px-2',
        active
          ? 'border-primary/25 bg-primary/10 text-primary'
          : 'border-transparent text-neutral-400 hover:border-white/[0.06] hover:bg-white/[0.045] hover:text-white',
        item.soon && 'opacity-70',
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
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
    <button
      type="button"
      className="block w-full cursor-pointer"
      onClick={onAction}
      aria-label={item.label}
    >
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

function GroupTitle({ title, collapsed }: { title: string; collapsed?: boolean }) {
  if (collapsed) {
    return <div className="mx-auto my-2 h-px w-8 bg-white/10" aria-hidden />;
  }
  return (
    <p className="px-3 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-600">
      {title}
    </p>
  );
}

function SidebarNav({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const openCartDrawer = useStoreUiStore((s) => s.openCartDrawer);
  const setWidgetOpen = useChatStore((s) => s.setWidgetOpen);
  const unreadChat = useChatStore((s) => Object.values(s.unreadCounts).reduce((a, b) => a + b, 0));
  const cart = useCart(isAuthenticated);
  const conversations = useConversations(isAuthenticated);
  const cartCount = cart.data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const unreadMessages = conversations.data?.totalUnread ?? 0;

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
      <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2.5 py-2">
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
                    <NavButton item={item} active={isActive(item.href)} collapsed={collapsed} />
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

      <div className="mt-auto shrink-0 space-y-1 border-t border-white/[0.07] px-2.5 py-3">
        {!collapsed ? (
          <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-600">
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
            active={isActive(item.href)}
            badge={
              item.href === '/messages'
                ? unreadMessages
                : item.action === 'chat'
                  ? unreadChat
                  : item.action === 'cart'
                    ? cartCount
                    : undefined
            }
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
    const width = expanded ? '280px' : '76px';
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
          'pointer-events-auto fixed bottom-3 left-3 top-3 z-40 hidden flex-col overflow-hidden rounded-2xl transition-[width] duration-300 ease-out',
          'border border-white/[0.09] bg-[rgba(13,12,11,0.9)] shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-[28px]',
          'lg:flex',
          expanded ? 'w-[280px]' : 'w-[76px]',
        )}
        aria-label="Боковая навигация"
      >
        <div
          className={cn(
            'flex h-[68px] shrink-0 items-center border-b border-white/[0.07] px-3',
            expanded ? 'justify-between' : 'justify-center',
          )}
        >
          {expanded ? (
            <div className="pl-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                Навигация
              </p>
              <p className="text-sm font-semibold text-white">Карта проекта</p>
            </div>
          ) : null}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-10 w-10 text-neutral-400 hover:text-white"
                onClick={() => setExpanded((value) => !value)}
                aria-label={expanded ? 'Свернуть панель' : 'Развернуть панель'}
              >
                {expanded ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{expanded ? 'Свернуть' : 'Развернуть'}</TooltipContent>
          </Tooltip>
        </div>
        <div className="min-h-0 flex-1">
          <SidebarNav collapsed={!expanded} />
        </div>
      </aside>

      {/* Mobile hamburger */}
      <div className="fixed bottom-4 left-4 z-40 lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className="h-12 w-12 rounded-2xl border-white/15 bg-[rgba(17,16,14,0.9)] text-white shadow-[0_14px_36px_rgba(0,0,0,0.34)] backdrop-blur-2xl"
              aria-label="Открыть меню"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[min(100vw-2rem,280px)] border-white/10 bg-[rgba(13,12,11,0.96)] p-0 backdrop-blur-[28px]"
          >
            <SheetHeader className="border-b border-white/[0.07] px-4 py-4 text-left">
              <SheetTitle className="text-base">Карта проекта</SheetTitle>
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
