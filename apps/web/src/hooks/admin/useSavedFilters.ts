'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type SavedFilter = {
  id: string;
  name: string;
  page: string;
  filters: Record<string, unknown>;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateSavedFilterPayload = {
  name: string;
  page: string;
  filters: Record<string, unknown>;
  isDefault?: boolean;
};

const savedFiltersKey = (page: string) => ['admin', 'saved-filters', page] as const;

export function useSavedFilters(page: string, enabled = true) {
  return useQuery({
    queryKey: savedFiltersKey(page),
    queryFn: async () => {
      const { data } = await api.get<SavedFilter[]>('/admin/saved-filters', {
        params: { page },
      });
      return data;
    },
    enabled: enabled && Boolean(page),
  });
}

export function useCreateSavedFilter(page: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Omit<CreateSavedFilterPayload, 'page'>) => {
      const { data } = await api.post<SavedFilter>('/admin/saved-filters', {
        ...payload,
        page,
      });
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: savedFiltersKey(page) });
    },
  });
}

export function useDeleteSavedFilter(page: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/saved-filters/${id}`);
      return id;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: savedFiltersKey(page) });
    },
  });
}
