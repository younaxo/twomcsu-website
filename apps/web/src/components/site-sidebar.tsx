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
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
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
  labelKey: string;
  icon: ComponentType<{ className?: string }>;
  soon?: boolean;
  action?: 'chat' | 'cart';
};

type NavGroup = {
  titleKey: string;
  items: NavItem[];
};

const mainGroups: NavGroup[] = [
  {
    titleKey: 'groupMain',
    items: [
      { href: '/', labelKey: 'home', icon: Home },
      { href: '/store', labelKey: 'store', icon: ShoppingBag },
      { href: '/servers', labelKey: 'servers', icon: Server },
      { href: '/news', labelKey: 'news', icon: Newspaper },
      { href: '/events', labelKey: 'events', icon: CalendarDays },
      { href: '/feed', labelKey: 'feed', icon: Activity },
      { href: '/achievements', labelKey: 'achievements', icon: Trophy },
      { href: '/leaderboards', labelKey: 'leaderboards', icon: Medal },
      { href: '/streams', labelKey: 'streams', icon: Radio },
      { href: '/vote', labelKey: 'vote', icon: Vote },
    ],
  },
  {
    titleKey: 'groupCommunity',
    items: [
      { href: '/rules', labelKey: 'rules', icon: Scale },
      { href: '/documents', labelKey: 'documents', icon: FileText },
      { href: '/forms', labelKey: 'forms', icon: ClipboardList },
      { href: '/wiki', labelKey: 'wiki', icon: BookOpen, soon: true },
      { href: '/reports', labelKey: 'reports', icon: AlertTriangle, soon: true },
    ],
  },
];

const quickAccess: NavItem[] = [
  { href: '/messages', labelKey: 'messages', icon: MessagesSquare },
  { labelKey: 'chat', icon: MessageCircle, action: 'chat' },
  { labelKey: 'cart', icon: ShoppingCart, action: 'cart' },
];

function NavButton({
  item,
  label,
  active,
  badge,
  soonLabel,
  onAction,
  collapsed,
}: {
  item: NavItem;
  label: string;
  active?: boolean;
  badge?: number;
  soonLabel: string;
  onAction?: () => void;
  collapsed?: boolean;
}) {
  const Icon = item.icon;
  const content = (
    <span
      className={cn(
        'relative flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-[background-color,color] duration-200',
        collapsed && 'justify-center px-2',
        active
          ? 'bg-white/[0.09] text-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
          : 'text-muted-foreground hover:bg-white/[0.05] hover:text-foreground',
        item.soon && 'opacity-70',
      )}
    >
      <Icon className={cn('h-5 w-5 shrink-0', active && 'text-primary')} />
      {!collapsed ? (
        <span className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium">
          <span className="truncate">{label}</span>
          {item.soon ? (
            <Badge variant="secondary" className="shrink-0 px-1.5 py-0 text-[10px]">
              {soonLabel}
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
    <Link href={item.href} className="block cursor-pointer" aria-label={label}>
      {content}
    </Link>
  ) : (
    <button
      type="button"
      className="block w-full cursor-pointer"
      onClick={onAction}
      aria-label={label}
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
        {label}
        {item.soon ? <span className="text-muted-foreground">· {soonLabel}</span> : null}
      </TooltipContent>
    </Tooltip>
  );
}

function GroupTitle({ title, collapsed }: { title: string; collapsed?: boolean }) {
  if (collapsed) {
    return <div className="mx-auto my-2 h-px w-8 bg-white/10" aria-hidden />;
  }
  return (
    <p className="px-3 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
      {title}
    </p>
  );
}

function SidebarNav({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const t = useTranslations('nav');
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
    roleItems.push({ href: '/moderation', labelKey: 'moderation', icon: Shield });
  }
  if (user && hasRoleGroup(user.roleGroup, RoleGroup.ADMIN)) {
    roleItems.push({ href: '/admin', labelKey: 'admin', icon: LayoutDashboard });
  }
  if (user && hasRoleGroup(user.roleGroup, RoleGroup.OWNER)) {
    roleItems.push({ href: '/dashboard', labelKey: 'dashboard', icon: LayoutDashboard });
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
            group.titleKey === 'groupCommunity' && isAuthenticated
              ? [
                  ...group.items,
                  { href: '/report', labelKey: 'reportsAuth', icon: Mail } satisfies NavItem,
                ]
              : group.items;

          return (
            <div key={group.titleKey} className="mb-1">
              <GroupTitle title={t(group.titleKey)} collapsed={collapsed} />
              <div className="flex flex-col gap-0.5">
                {items.map((item) => (
                  <div key={item.labelKey} onClick={onNavigate}>
                    <NavButton
                      item={item}
                      label={t(item.labelKey)}
                      soonLabel={t('soon')}
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
            <GroupTitle title={t('groupPanels')} collapsed={collapsed} />
            <div className="flex flex-col gap-0.5">
              {roleItems.map((item) => (
                <div key={item.labelKey} onClick={onNavigate}>
                  <NavButton
                    item={item}
                    label={t(item.labelKey)}
                    soonLabel={t('soon')}
                    active={isActive(item.href)}
                    collapsed={collapsed}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </nav>

      <div className="mt-auto shrink-0 space-y-1 border-t border-white/[0.07] px-2.5 py-3">
        {!collapsed ? (
          <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {t('quickAccess')}
          </p>
        ) : (
          <div className="mx-auto my-1 h-px w-8 bg-white/10" aria-hidden />
        )}
        {quickAccess.map((item) => (
          <NavButton
            key={item.labelKey}
            item={item}
            label={t(item.labelKey)}
            soonLabel={t('soon')}
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
              <TooltipContent side="right">{t('quickAccess')}</TooltipContent>
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
  const t = useTranslations('nav');
  const th = useTranslations('header');
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
    const width = expanded ? '256px' : '72px';
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
          'glass-strong pointer-events-auto fixed bottom-3 left-3 top-3 z-40 hidden flex-col overflow-hidden rounded-[20px] transition-[width] duration-300 ease-out',
          'lg:flex',
          expanded ? 'w-64' : 'w-[72px]',
        )}
        aria-label={t('sidebarLabel')}
      >
        <div
          className={cn(
            'flex h-[68px] shrink-0 items-center border-b border-white/[0.07] px-3',
            expanded ? 'justify-between' : 'justify-center',
          )}
        >
          {expanded ? (
            <p className="pl-2 text-sm font-semibold text-foreground">{th('menu')}</p>
          ) : null}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-10 w-10 text-muted-foreground hover:text-foreground"
                onClick={() => setExpanded((value) => !value)}
                aria-label={expanded ? th('collapse') : th('expand')}
              >
                {expanded ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{expanded ? th('collapse') : th('expand')}</TooltipContent>
          </Tooltip>
        </div>
        <div className="min-h-0 flex-1">
          <SidebarNav collapsed={!expanded} />
        </div>
      </aside>

      {/* Mobile hamburger */}
      <div className="fixed left-3 top-3 z-40 lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 rounded-xl bg-white/[0.05] text-foreground"
              aria-label={th('openMenu')}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="glass-strong w-[min(100vw-2rem,280px)] p-0">
            <SheetHeader className="border-b border-white/[0.07] px-4 py-4 text-left">
              <SheetTitle className="text-base">{th('menu')}</SheetTitle>
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
