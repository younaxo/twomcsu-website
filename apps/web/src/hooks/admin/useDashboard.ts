'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type DashboardOverview = {
  users: {
    total: number;
    new24h: number;
    new7d: number;
    new30d: number;
    onlineNow: number;
    onlineInGame: number;
    activeBans: number;
    change24hPct: number;
  };
  orders: {
    total: number;
    today: number;
    week: number;
    revenueTotal: number;
    revenueToday: number;
    revenueWeek: number;
    revenueMonth: number;
    averageOrder: number;
    revenueChangePct: number;
  };
  reports: {
    total: number;
    pending: number;
    inReview: number;
    resolved: number;
    overduePending: number;
    pendingChangePct: number;
  };
  servers: {
    total: number;
    online: number;
    totalPlayersOnline: number;
  };
  activity: {
    commentsToday: number;
    chatMessagesToday: number;
    newsPublishedThisWeek: number;
  };
};

export type DaySeriesPoint = { date: string; count?: number; total?: number };
export type ReportTypePoint = { type: string; count: number };
export type ServerOnlinePoint = Record<string, string | number>;

export type TopProduct = {
  rank: number;
  productId: string | null;
  name: string;
  slug: string | null;
  image: string | null;
  sold: number;
  revenue: number;
};

export type TopBuyer = {
  rank: number;
  user: {
    id: string;
    username: string;
    avatar: string | null;
    shortId: string;
    tag: string;
  } | null;
  totalSpent: number;
  ordersCount: number;
};

export type ModeratorActivityItem = {
  userId: string;
  username: string;
  avatar: string | null;
  resolvedCount: number;
};

const adminDashboardKeys = {
  overview: ['admin', 'dashboard', 'overview'] as const,
  usersChart: (days: number) => ['admin', 'dashboard', 'charts', 'users', days] as const,
  revenueChart: (days: number) => ['admin', 'dashboard', 'charts', 'revenue', days] as const,
  reportsChart: (days: number) => ['admin', 'dashboard', 'charts', 'reports', days] as const,
  serversChart: (hours: number) => ['admin', 'dashboard', 'charts', 'servers', hours] as const,
  topProducts: (limit: number) => ['admin', 'dashboard', 'top-products', limit] as const,
  topBuyers: (limit: number) => ['admin', 'dashboard', 'top-buyers', limit] as const,
  moderatorActivity: (days: number) =>
    ['admin', 'dashboard', 'moderator-activity', days] as const,
};

export function useDashboardOverview(enabled = true) {
  return useQuery({
    queryKey: adminDashboardKeys.overview,
    queryFn: async () => {
      const { data } = await api.get<DashboardOverview>('/admin/dashboard/overview');
      return data;
    },
    enabled,
    staleTime: 60_000,
  });
}

export function useUsersChartData(days = 30, enabled = true) {
  return useQuery({
    queryKey: adminDashboardKeys.usersChart(days),
    queryFn: async () => {
      const { data } = await api.get<DaySeriesPoint[]>('/admin/dashboard/charts/users', {
        params: { days },
      });
      return data;
    },
    enabled,
    staleTime: 60_000,
  });
}

export function useRevenueChartData(days = 30, enabled = true) {
  return useQuery({
    queryKey: adminDashboardKeys.revenueChart(days),
    queryFn: async () => {
      const { data } = await api.get<DaySeriesPoint[]>('/admin/dashboard/charts/revenue', {
        params: { days },
      });
      return data;
    },
    enabled,
    staleTime: 60_000,
  });
}

export function useReportsChartData(days = 30, enabled = true) {
  return useQuery({
    queryKey: adminDashboardKeys.reportsChart(days),
    queryFn: async () => {
      const { data } = await api.get<ReportTypePoint[]>('/admin/dashboard/charts/reports', {
        params: { days },
      });
      return data;
    },
    enabled,
    staleTime: 60_000,
  });
}

export function useServersChartData(hours = 24, enabled = true) {
  return useQuery({
    queryKey: adminDashboardKeys.serversChart(hours),
    queryFn: async () => {
      const { data } = await api.get<ServerOnlinePoint[]>('/admin/dashboard/charts/servers', {
        params: { hours },
      });
      return data;
    },
    enabled,
    staleTime: 60_000,
  });
}

export function useTopProducts(limit = 10, enabled = true) {
  return useQuery({
    queryKey: adminDashboardKeys.topProducts(limit),
    queryFn: async () => {
      const { data } = await api.get<TopProduct[]>('/admin/dashboard/top-products', {
        params: { limit },
      });
      return data;
    },
    enabled,
    staleTime: 60_000,
  });
}

export function useTopBuyers(limit = 10, enabled = true) {
  return useQuery({
    queryKey: adminDashboardKeys.topBuyers(limit),
    queryFn: async () => {
      const { data } = await api.get<TopBuyer[]>('/admin/dashboard/top-buyers', {
        params: { limit },
      });
      return data;
    },
    enabled,
    staleTime: 60_000,
  });
}

export function useModeratorActivity(days = 30, enabled = true) {
  return useQuery({
    queryKey: adminDashboardKeys.moderatorActivity(days),
    queryFn: async () => {
      const { data } = await api.get<ModeratorActivityItem[]>(
        '/admin/dashboard/moderator-activity',
        { params: { days } },
      );
      return data;
    },
    enabled,
    staleTime: 60_000,
  });
}
