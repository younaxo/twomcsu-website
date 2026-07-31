'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type AuditLogItem = {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  severity?: string;
  createdAt: string;
  actor: { id: string; username: string; avatar?: string | null };
};

export type AuditLogFilters = {
  page?: number;
  limit?: number;
  action?: string;
  actorId?: string;
  q?: string;
  from?: string;
  to?: string;
  severity?: string;
};

export type AuditLogResponse = {
  items: AuditLogItem[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
};

export function useAuditLog(filters: AuditLogFilters, enabled = true) {
  return useQuery({
    queryKey: ['admin', 'audit-log', filters],
    queryFn: async () => {
      const { data } = await api.get<AuditLogResponse>('/admin/audit-log', {
        params: {
          page: filters.page,
          limit: filters.limit,
          action: filters.action || undefined,
          actorId: filters.actorId || undefined,
          q: filters.q || undefined,
          from: filters.from || undefined,
          to: filters.to || undefined,
          severity: filters.severity || undefined,
        },
      });
      return data;
    },
    enabled,
  });
}
