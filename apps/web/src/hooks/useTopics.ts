'use client';

import type {
  PaginatedResponse,
  TopicCategory,
  TopicDetails,
  TopicSummary,
} from '@twomc/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useTopics(
  filters: { category?: TopicCategory; page?: number; limit?: number; search?: string },
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.topics(filters),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<TopicSummary>>('/topics', {
        params: filters,
        skipAuthRedirect: true,
      });
      return data;
    },
    enabled,
  });
}

export function useTopic(slug: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.topic(slug),
    queryFn: async () => {
      const { data } = await api.get<TopicDetails>(`/topics/${slug}`, {
        skipAuthRedirect: true,
      });
      return data;
    },
    enabled: enabled && Boolean(slug),
    retry: (_, error) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      return status !== 403 && status !== 404;
    },
  });
}

export function useAdminTopics(enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminTopics,
    queryFn: async () => {
      const { data } = await api.get<TopicSummary[]>('/admin/topics');
      return data;
    },
    enabled,
  });
}

export function useAdminTopic(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminTopic(id),
    queryFn: async () => {
      const { data } = await api.get<TopicDetails>(`/admin/topics/${id}`);
      return data;
    },
    enabled: enabled && Boolean(id),
  });
}

export function useSaveTopic() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id?: string;
      payload: Record<string, unknown>;
    }) => {
      if (id) {
        const { data } = await api.patch<TopicDetails>(`/admin/topics/${id}`, payload);
        return data;
      }

      const { data } = await api.post<TopicDetails>('/admin/topics', payload);
      return data;
    },
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ['topics'] });
      void qc.invalidateQueries({ queryKey: queryKeys.adminTopics });
      void qc.invalidateQueries({ queryKey: queryKeys.adminTopic(data.id) });
      void qc.invalidateQueries({ queryKey: queryKeys.topic(data.slug) });
    },
  });
}

export function useDeleteTopic() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/topics/${id}`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['topics'] });
      void qc.invalidateQueries({ queryKey: queryKeys.adminTopics });
    },
  });
}

export function usePinTopic() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, pin }: { id: string; pin: boolean }) => {
      const path = pin ? 'pin' : 'unpin';
      const { data } = await api.post<TopicSummary>(`/admin/topics/${id}/${path}`);
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['topics'] });
      void qc.invalidateQueries({ queryKey: queryKeys.adminTopics });
    },
  });
}

export function useUploadTopicAttachment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post<TopicDetails>(`/admin/topics/${id}/attachments`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: queryKeys.adminTopic(data.id) });
      void qc.invalidateQueries({ queryKey: queryKeys.topic(data.slug) });
    },
  });
}

export function useDeleteTopicAttachment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, attachmentId }: { id: string; attachmentId: string }) => {
      const { data } = await api.delete<TopicDetails>(
        `/admin/topics/${id}/attachments/${attachmentId}`,
      );
      return data;
    },
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: queryKeys.adminTopic(data.id) });
      void qc.invalidateQueries({ queryKey: queryKeys.topic(data.slug) });
    },
  });
}
