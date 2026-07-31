'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type AdminUserListItem = {
  id: string;
  username: string;
  email: string;
  roleGroup: string;
  isBanned: boolean;
  createdAt: string;
  lastActivityAt: string | null;
  avatar: string | null;
  shortId: string;
  tag: string;
};

export type AdminUsersFilters = {
  page?: number;
  limit?: number;
  search?: string;
  roleGroup?: string;
  isBanned?: boolean;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
};

export type AdminUsersListResponse = {
  items: AdminUserListItem[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
};

export type AdminUserFullData = AdminUserListItem & {
  profile?: Record<string, unknown>;
  statistics?: Record<string, unknown>;
  badges?: unknown[];
  awards?: unknown[];
  departments?: unknown[];
  punishments?: unknown[];
};

export type BulkUpdateUsersPayload = {
  userIds: string[];
  updates: {
    roleGroup?: string;
    isBanned?: boolean;
    banReason?: string;
  };
};

export type ExportUsersPayload = {
  format: 'csv' | 'excel' | 'pdf';
  columns: string[];
  filters?: AdminUsersFilters;
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
          roleGroup: filters.roleGroup || undefined,
          isBanned: filters.isBanned,
          sortBy: filters.sortBy || undefined,
          sortDir: filters.sortDir || undefined,
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
      const { data } = await api.patch<{ updated: number }>('/admin/users/bulk', payload);
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
