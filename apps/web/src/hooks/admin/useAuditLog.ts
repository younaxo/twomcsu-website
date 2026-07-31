'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type AuditLogItem = {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  severity?: string;
  changes?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
  duration?: number | null;
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
  targetType?: string;
};

export type AuditLogResponse = {
  items: AuditLogItem[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
};

export type AuditLogStats = {
  total: number;
  byAction: Array<{ action: string; count: number }>;
  bySeverity: Array<{ severity: string; count: number }>;
  topActors: Array<{
    actor: { id: string; username: string; avatar: string | null } | null;
    count: number;
  }>;
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
          targetType: filters.targetType || undefined,
        },
      });
      return data;
    },
    enabled,
  });
}

export function useAuditLogStats(days = 30, enabled = true) {
  return useQuery({
    queryKey: ['admin', 'audit-log', 'stats', days],
    queryFn: async () => {
      const { data } = await api.get<AuditLogStats>('/admin/audit-log/stats', {
        params: { days },
      });
      return data;
    },
    enabled,
    staleTime: 60_000,
  });
}

export function useExportAuditLog() {
  return useMutation({
    mutationFn: async (payload: {
      format: 'csv' | 'excel' | 'pdf';
      actorId?: string;
      action?: string;
      severity?: string;
      search?: string;
      dateFrom?: string;
      dateTo?: string;
    }) => {
      const response = await api.post<Blob>('/admin/audit-log/export', payload, {
        responseType: 'blob',
      });
      return response.data;
    },
  });
}
