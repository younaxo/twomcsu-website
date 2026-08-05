'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type AdminUserPosition = {
  id: string;
  displayName: string;
  color: string;
  slug: string;
};

export type AdminUserListItem = {
  id: string;
  username: string;
  email: string;
  roleGroup: string;
  isBanned: boolean;
  banReason?: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  lastActivityAt: string | null;
  avatar: string | null;
  shortId: number;
  tag: string;
  position?: AdminUserPosition | null;
  departments?: Array<{ id: string; name: string }>;
  isOnline?: boolean;
  isOnlineInGame?: boolean;
  ordersCount: number;
  reportsCount: number;
};

export type AdminUsersFilters = {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isBanned?: boolean;
  positionId?: string;
  departmentId?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: string;
  order?: 'asc' | 'desc';
};

export type AdminUsersListResponse = {
  items: AdminUserListItem[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
};

export type AdminUserFullData = {
  user: Record<string, unknown> & {
    id: string;
    username: string;
    email: string;
    roleGroup: string;
    isBanned: boolean;
    avatar: string | null;
    shortId: number;
    tag: string;
    createdAt: string;
    lastLoginAt: string | null;
    banReason?: string | null;
  };
  stats: {
    orders: number;
    reportsAuthored: number;
    reportsAgainst: number;
    comments: number;
    friends: number;
    punishments: number;
  };
  orders: Array<Record<string, unknown>>;
  reports: {
    authored: Array<Record<string, unknown>>;
    against: Array<Record<string, unknown>>;
  };
  comments: Array<Record<string, unknown>>;
  friends: Array<{ id: string; username: string; avatar: string | null }>;
  punishments: Array<Record<string, unknown>>;
  activity: Array<Record<string, unknown>>;
  sessions: Array<Record<string, unknown>>;
};

export type BulkUpdateUsersPayload = {
  userIds: string[];
  action: 'ban' | 'unban' | 'change_role' | 'send_notification';
  data?: {
    roleGroup?: string;
    banReason?: string;
    bannedUntil?: string | null;
    notificationTitle?: string;
    notificationMessage?: string;
  };
};

export type ExportUsersPayload = {
  format: 'csv' | 'excel' | 'pdf';
  search?: string;
  roleGroup?: string;
  isBanned?: boolean;
  dateFrom?: string;
  dateTo?: string;
  userIds?: string[];
};

const adminUsersKeys = {
  list: (filters: AdminUsersFilters) => ['admin', 'users', filters] as const,
  detail: (userId: string) => ['admin', 'users', 'detail', userId] as const,
};

export function useAdminUsers(filters: AdminUsersFilters, enabled = true) {
  return useQuery({
    queryKey: adminUsersKeys.list(filters),
    queryFn: async () => {
      const { data } = await api.get<AdminUsersListResponse>('/admin/users', {
        params: {
          page: filters.page,
          limit: filters.limit,
          search: filters.search || undefined,
          role: filters.role || undefined,
          isBanned: filters.isBanned,
          positionId: filters.positionId || undefined,
          departmentId: filters.departmentId || undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
          sort: filters.sort || undefined,
          order: filters.order || undefined,
        },
      });
      return data;
    },
    enabled,
  });
}

export function useUserFullData(userId: string, enabled = true) {
  return useQuery({
    queryKey: adminUsersKeys.detail(userId),
    queryFn: async () => {
      const { data } = await api.get<AdminUserFullData>(`/admin/users/${userId}/full`);
      return data;
    },
    enabled: enabled && Boolean(userId),
  });
}

export function useBulkUpdateUsers() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: BulkUpdateUsersPayload) => {
      const { data } = await api.patch<{ affected: number }>('/admin/users/bulk', payload);
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useExportUsers() {
  return useMutation({
    mutationFn: async (payload: ExportUsersPayload) => {
      const response = await api.post<Blob>('/admin/users/export', payload, {
        responseType: 'blob',
      });
      return response.data;
    },
  });
}
