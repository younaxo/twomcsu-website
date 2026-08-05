'use client';

import type {
  AchievementCategory,
  AchievementDetail,
  AchievementFilter,
  AchievementRarity,
  AchievementWithProgress,
  AchievementsStats,
  UserAchievementsResponse,
} from '@twomc/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export type AchievementsFilters = {
  category?: AchievementCategory;
  rarity?: AchievementRarity;
  filter?: AchievementFilter;
  search?: string;
  sort?: 'order' | 'rarity' | 'name' | 'unlocked';
};

export function useAchievements(filters: AchievementsFilters = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.achievements(filters),
    queryFn: async () => {
      const { data } = await api.get<AchievementWithProgress[]>('/achievements', {
        params: filters,
        skipAuthRedirect: true,
      });
      return data;
    },
    enabled,
  });
}

export function useAchievement(slug: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.achievementBySlug(slug),
    queryFn: async () => {
      const { data } = await api.get<AchievementDetail>(`/achievements/${slug}`, {
        skipAuthRedirect: true,
      });
      return data;
    },
    enabled: enabled && Boolean(slug),
  });
}

export function useAchievementsStats(enabled = true) {
  return useQuery({
    queryKey: queryKeys.achievementsStats,
    queryFn: async () => {
      const { data } = await api.get<AchievementsStats>('/achievements/stats', {
        skipAuthRedirect: true,
      });
      return data;
    },
    enabled,
  });
}

export function useUserAchievements(username: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.userAchievements(username),
    queryFn: async () => {
      const { data } = await api.get<UserAchievementsResponse>(
        `/users/${encodeURIComponent(username)}/achievements`,
        { skipAuthRedirect: true },
      );
      return data;
    },
    enabled: enabled && Boolean(username),
  });
}

export function useMyAchievements(enabled = true) {
  return useQuery({
    queryKey: queryKeys.myAchievements,
    queryFn: async () => {
      const { data } = await api.get<UserAchievementsResponse>('/users/me/achievements');
      return data;
    },
    enabled,
  });
}

export function useSetShowcase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (achievementIds: string[]) => {
      const { data } = await api.post<UserAchievementsResponse>(
        '/users/me/achievements/showcase',
        { achievementIds },
      );
      return data;
    },
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.myAchievements, data);
    },
  });
}

export function useRemoveShowcase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (achievementId: string) => {
      await api.delete(`/users/me/achievements/showcase/${achievementId}`);
      return achievementId;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.myAchievements });
    },
  });
}
