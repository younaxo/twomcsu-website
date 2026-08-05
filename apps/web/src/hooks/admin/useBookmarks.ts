'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type AdminBookmark = {
  id: string;
  url: string;
  title: string;
  icon: string | null;
  order: number;
  createdAt: string;
};

export type CreateBookmarkPayload = {
  url: string;
  title: string;
  icon?: string;
  order?: number;
};

export type ReorderBookmarksPayload = {
  items: Array<{ id: string; order: number }>;
};

const bookmarksKey = ['admin', 'bookmarks'] as const;

export function useBookmarks(enabled = true) {
  return useQuery({
    queryKey: bookmarksKey,
    queryFn: async () => {
      const { data } = await api.get<AdminBookmark[]>('/admin/bookmarks');
      return data;
    },
    enabled,
  });
}

export function useCreateBookmark() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateBookmarkPayload) => {
      const { data } = await api.post<AdminBookmark>('/admin/bookmarks', payload);
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: bookmarksKey });
    },
  });
}

export function useUpdateBookmark() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: Partial<CreateBookmarkPayload> & { id: string }) => {
      const { data } = await api.patch<AdminBookmark>(`/admin/bookmarks/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: bookmarksKey });
    },
  });
}

export function useDeleteBookmark() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/bookmarks/${id}`);
      return id;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: bookmarksKey });
    },
  });
}

export function useReorderBookmarks() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const { data } = await api.post<AdminBookmark[]>('/admin/bookmarks/reorder', {
        orderedIds,
      });
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: bookmarksKey });
    },
  });
}
