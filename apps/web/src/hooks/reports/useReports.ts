'use client';

import type {
  PunishmentType,
  ReportAttachment,
  ReportDetails,
  ReportListResponse,
  ReportStats,
  ReportStatus,
  ReportType,
  TopicDetails,
  UserPunishmentSummary,
  UserSearchHint,
} from '@twomc/shared';
import { ReportStatus as ReportStatusEnum } from '@twomc/shared';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export type ReportFilters = {
  page?: number;
  limit?: number;
  type?: ReportType | '';
  status?: ReportStatus | '';
  server?: string;
  search?: string;
  assigned?: string;
  role?: 'author' | 'target' | 'moderator' | 'all' | '';
};

export type CreateReportPayload = {
  type: ReportType;
  targets?: Array<{ username: string; order?: number }>;
  evidenceLinks?: Array<{ url: string; title?: string; order?: number }>;
  server?: string;
  incidentDate?: string;
  description: string;
  additionalText?: string;
  appealedPunishmentId?: string;
  captchaToken?: string;
};

export type MyReportStats = {
  total: number;
  pending: number;
  inReview: number;
  resolved: number;
  isLoading: boolean;
};

export function useReports(filters: ReportFilters, enabled = true) {
  return useQuery({
    queryKey: queryKeys.reports(filters),
    queryFn: async () => {
      const { data } = await api.get<ReportListResponse>('/reports', {
        params: {
          page: filters.page,
          limit: filters.limit,
          type: filters.type || undefined,
          status: filters.status || undefined,
          server: filters.server || undefined,
          search: filters.search || undefined,
          role: filters.role && filters.role !== 'all' ? filters.role : undefined,
        },
      });
      return data;
    },
    enabled,
  });
}

export function useMyReportStats(enabled = true): MyReportStats {
  const statuses: Array<{ key: keyof Omit<MyReportStats, 'isLoading'>; status?: ReportStatus }> =
    [
      { key: 'total' },
      { key: 'pending', status: ReportStatusEnum.PENDING },
      { key: 'inReview', status: ReportStatusEnum.IN_REVIEW },
      { key: 'resolved', status: ReportStatusEnum.RESOLVED },
    ];

  const queries = useQueries({
    queries: statuses.map(({ key, status }) => ({
      queryKey: [...queryKeys.myReportStats, key],
      queryFn: async () => {
        const { data } = await api.get<ReportListResponse>('/reports', {
          params: { page: 1, limit: 1, status: status || undefined },
        });
        return data.total;
      },
      enabled,
      staleTime: 30_000,
    })),
  });

  const [totalQ, pendingQ, inReviewQ, resolvedQ] = queries;

  return {
    total: totalQ.data ?? 0,
    pending: pendingQ.data ?? 0,
    inReview: inReviewQ.data ?? 0,
    resolved: resolvedQ.data ?? 0,
    isLoading: queries.some((query) => query.isLoading),
  };
}

export function useReport(reportNumber: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.report(reportNumber),
    queryFn: async () => {
      const { data } = await api.get<ReportDetails>(`/reports/${reportNumber}`);
      return data;
    },
    enabled: enabled && Boolean(reportNumber),
  });
}

export function useReportRules(type: ReportType | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.reportRules(type ?? 'none'),
    queryFn: async () => {
      const { data } = await api.get<TopicDetails | null>('/reports/rules', {
        params: { type },
        skipAuthRedirect: true,
      });
      return data;
    },
    enabled: enabled && Boolean(type),
  });
}

export function useMyPunishments(onlyAppealable?: boolean, enabled = true) {
  return useQuery({
    queryKey: queryKeys.myPunishments(onlyAppealable),
    queryFn: async () => {
      const { data } = await api.get<UserPunishmentSummary[]>('/users/me/punishments', {
        params: { onlyAppealable: onlyAppealable || undefined },
      });
      return data;
    },
    enabled,
  });
}

export function useUserSearchHint(username: string, enabled = true) {
  const trimmed = username.trim();
  return useQuery({
    queryKey: queryKeys.userSearchHint(trimmed),
    queryFn: async () => {
      const { data } = await api.get<UserSearchHint>(
        `/users/${encodeURIComponent(trimmed)}/search-hint`,
        { skipAuthRedirect: true },
      );
      return data;
    },
    enabled: enabled && trimmed.length >= 2,
    staleTime: 60_000,
  });
}

export function useCreateReport() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateReportPayload) => {
      const { data } = await api.post<ReportDetails>('/reports', payload);
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useCreateDonationProblem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post<ReportDetails>('/support/donation-problem', payload);
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useAddReportMessage(reportNumber: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { content: string; isInternal?: boolean }) => {
      const { data } = await api.post<ReportDetails>(
        `/reports/${reportNumber}/messages`,
        payload,
      );
      return data;
    },
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.report(reportNumber), data);
      void qc.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useUploadReportAttachment(reportNumber: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post<ReportAttachment>(
        `/reports/${reportNumber}/attachments`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.report(reportNumber) });
    },
  });
}

export function useModerationReports(filters: ReportFilters, enabled = true) {
  return useQuery({
    queryKey: queryKeys.moderationReports(filters),
    queryFn: async () => {
      const { data } = await api.get<ReportListResponse>('/moderation/reports', {
        params: {
          page: filters.page,
          limit: filters.limit,
          type: filters.type || undefined,
          status: filters.status || undefined,
          search: filters.search || undefined,
          assigned: filters.assigned || undefined,
        },
      });
      return data;
    },
    enabled,
  });
}

export function useAssignReport() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reportNumber,
      userId,
    }: {
      reportNumber: string;
      userId?: string | null;
    }) => {
      const { data } = await api.patch<ReportDetails>(
        `/moderation/reports/${reportNumber}/assign`,
        { userId },
      );
      return data;
    },
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.report(data.reportNumber), data);
      void qc.invalidateQueries({ queryKey: ['reports'] });
      void qc.invalidateQueries({ queryKey: ['moderation', 'reports'] });
    },
  });
}

export function useChangeReportStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reportNumber,
      status,
    }: {
      reportNumber: string;
      status: ReportStatus;
    }) => {
      const { data } = await api.patch<ReportDetails>(
        `/moderation/reports/${reportNumber}/status`,
        { status },
      );
      return data;
    },
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.report(data.reportNumber), data);
      void qc.invalidateQueries({ queryKey: ['reports'] });
      void qc.invalidateQueries({ queryKey: ['moderation', 'reports'] });
    },
  });
}

export function useSetVerdict() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reportNumber,
      verdict,
    }: {
      reportNumber: string;
      verdict: string;
    }) => {
      const { data } = await api.patch<ReportDetails>(
        `/moderation/reports/${reportNumber}/verdict`,
        { verdict },
      );
      return data;
    },
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.report(data.reportNumber), data);
      void qc.invalidateQueries({ queryKey: ['reports'] });
      void qc.invalidateQueries({ queryKey: ['moderation', 'reports'] });
    },
  });
}

export function usePunishReport() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reportNumber,
      targetUsername,
      punishmentType,
      duration,
      reason,
    }: {
      reportNumber: string;
      targetUsername: string;
      punishmentType: PunishmentType;
      duration?: string;
      reason: string;
    }) => {
      const { data } = await api.post<ReportDetails>(
        `/moderation/reports/${reportNumber}/punish`,
        { targetUsername, punishmentType, duration, reason },
      );
      return data;
    },
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.report(data.reportNumber), data);
      void qc.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useLockReport() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reportNumber,
      reason,
    }: {
      reportNumber: string;
      reason: string;
    }) => {
      const { data } = await api.post<ReportDetails>(
        `/moderation/reports/${reportNumber}/lock`,
        { reason },
      );
      return data;
    },
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.report(data.reportNumber), data);
      void qc.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useDonationReports(filters: ReportFilters, enabled = true) {
  return useQuery({
    queryKey: queryKeys.donationReports(filters),
    queryFn: async () => {
      const { data } = await api.get<ReportListResponse>('/admin/support/donations', {
        params: {
          page: filters.page,
          limit: filters.limit,
          status: filters.status || undefined,
          search: filters.search || undefined,
        },
      });
      return data;
    },
    enabled,
  });
}

export function useReportStats(enabled = true) {
  return useQuery({
    queryKey: queryKeys.reportStats,
    queryFn: async () => {
      const { data } = await api.get<ReportStats>('/admin/reports/stats');
      return data;
    },
    enabled,
  });
}
