'use client';

import type {
  CreateNewsPayload,
  NewsAdminItem,
  NewsCategory,
  NewsCategoryCount,
  NewsComment,
  NewsCommentSort,
  NewsDetails,
  NewsSort,
  NewsStats,
  NewsStatus,
  NewsSummary,
  NewsTagCount,
  PaginatedResponse,
  UpdateNewsPayload,
  CommentEmoji,
} from '@twomc/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export type NewsListFilters = {
  page?: number;
  limit?: number;
  category?: NewsCategory;
  tag?: string;
  search?: string;
  featured?: boolean;
  sort?: NewsSort;
};

export function useNews(filters: NewsListFilters = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.news(filters),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<NewsSummary>>('/news', {
        params: filters,
        skipAuthRedirect: true,
      });
      return data;
    },
    enabled,
  });
}

export function useNewsFeatured(enabled = true) {
  return useQuery({
    queryKey: queryKeys.newsFeatured,
    queryFn: async () => {
      const { data } = await api.get<NewsSummary[]>('/news/featured', {
        skipAuthRedirect: true,
      });
      return data;
    },
    enabled,
  });
}

export function useNewsLatest(limit = 3, enabled = true) {
  return useQuery({
    queryKey: queryKeys.newsLatest(limit),
    queryFn: async () => {
      const { data } = await api.get<NewsSummary[]>('/news/latest', {
        params: { limit },
        skipAuthRedirect: true,
      });
      return data;
    },
    enabled,
  });
}

export function useNewsPopular(enabled = true) {
  return useQuery({
    queryKey: queryKeys.newsPopular,
    queryFn: async () => {
      const { data } = await api.get<NewsSummary[]>('/news/popular', {
        skipAuthRedirect: true,
      });
      return data;
    },
    enabled,
  });
}

export function useNewsBySlug(slug: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.newsBySlug(slug),
    queryFn: async () => {
      const { data } = await api.get<NewsDetails>(`/news/${slug}`, {
        skipAuthRedirect: true,
      });
      return data;
    },
    enabled: enabled && Boolean(slug),
  });
}

export function useNewsCategories(enabled = true) {
  return useQuery({
    queryKey: queryKeys.newsCategories,
    queryFn: async () => {
      const { data } = await api.get<NewsCategoryCount[]>('/news/categories', {
        skipAuthRedirect: true,
      });
      return data;
    },
    enabled,
  });
}

export function useNewsTags(limit = 20, enabled = true) {
  return useQuery({
    queryKey: queryKeys.newsTags(limit),
    queryFn: async () => {
      const { data } = await api.get<NewsTagCount[]>('/news/tags', {
        params: { limit },
        skipAuthRedirect: true,
      });
      return data;
    },
    enabled,
  });
}

export function useLikeNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (newsId: string) => {
      const { data } = await api.post<{ liked: boolean; likesCount: number }>(
        `/news/${newsId}/like`,
      );
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['news'] });
    },
  });
}

export function useNewsComments(
  slug: string,
  filters: { page?: number; sort?: NewsCommentSort; limit?: number } = {},
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.newsComments(slug, filters),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<NewsComment>>(
        `/news/${slug}/comments`,
        { params: filters, skipAuthRedirect: true },
      );
      return data;
    },
    enabled: enabled && Boolean(slug),
  });
}

export function useCreateNewsComment(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { content: string; parentId?: string }) => {
      const { data } = await api.post<NewsComment>(`/news/${slug}/comments`, payload);
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.newsComments(slug) });
      void qc.invalidateQueries({ queryKey: queryKeys.newsBySlug(slug) });
    },
  });
}

export function useUpdateNewsComment(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      const { data } = await api.patch<NewsComment>(
        `/news/${slug}/comments/${commentId}`,
        { content },
      );
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.newsComments(slug) });
    },
  });
}

export function useDeleteNewsComment(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      await api.delete(`/news/${slug}/comments/${commentId}`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.newsComments(slug) });
      void qc.invalidateQueries({ queryKey: queryKeys.newsBySlug(slug) });
    },
  });
}

export function useReactToNewsComment(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, emoji }: { commentId: string; emoji: CommentEmoji }) => {
      const { data } = await api.post<NewsComment>(
        `/news/${slug}/comments/${commentId}/reactions`,
        { emoji },
      );
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.newsComments(slug) });
    },
  });
}

export type AdminNewsFilters = {
  page?: number;
  limit?: number;
  status?: NewsStatus;
  category?: NewsCategory;
  author?: string;
  search?: string;
};

export function useAdminNews(filters: AdminNewsFilters = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminNews(filters),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<NewsAdminItem>>('/admin/news', {
        params: filters,
      });
      return data;
    },
    enabled,
  });
}

export function useAdminNewsItem(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminNewsItem(id),
    queryFn: async () => {
      const { data } = await api.get<NewsAdminItem>(`/admin/news/${id}`);
      return data;
    },
    enabled: enabled && Boolean(id),
  });
}

export function useNewsStats(enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminNewsStats,
    queryFn: async () => {
      const { data } = await api.get<NewsStats>('/admin/news/stats');
      return data;
    },
    enabled,
  });
}

export function useCreateNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateNewsPayload) => {
      const { data } = await api.post<NewsAdminItem>('/admin/news', payload);
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'news'] });
      void qc.invalidateQueries({ queryKey: ['news'] });
    },
  });
}

export function useUpdateNews(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateNewsPayload) => {
      const { data } = await api.patch<NewsAdminItem>(`/admin/news/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'news'] });
      void qc.invalidateQueries({ queryKey: ['news'] });
    },
  });
}

export function useDeleteNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/news/${id}`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'news'] });
      void qc.invalidateQueries({ queryKey: ['news'] });
    },
  });
}

export function usePinNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      const { data } = await api.post<NewsAdminItem>(
        `/admin/news/${id}/${pinned ? 'pin' : 'unpin'}`,
      );
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'news'] });
      void qc.invalidateQueries({ queryKey: ['news'] });
    },
  });
}

export function useFeatureNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      const { data } = await api.post<NewsAdminItem>(
        `/admin/news/${id}/${featured ? 'feature' : 'unfeature'}`,
      );
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'news'] });
      void qc.invalidateQueries({ queryKey: ['news'] });
    },
  });
}

export function useUploadNewsImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post<{ url: string }>('/admin/news/upload-image', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.url;
    },
  });
}
