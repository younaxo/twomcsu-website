'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type SiteSettings = {
  siteName: string;
  siteDescription: string | null;
  siteLogo: string | null;
  siteFavicon: string | null;
  contactEmail: string | null;
  discordInvite: string | null;
  vkGroup: string | null;
  telegramChannel: string | null;
  youtubeChannel: string | null;
  registrationEnabled: boolean;
  registrationRequiresApproval: boolean;
  maxUsersLimit: number | null;
  autoModeration: boolean;
  profanityFilter: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string[];
  googleAnalyticsId: string | null;
  yandexMetrikaId: string | null;
  chatEnabled: boolean;
  friendsEnabled: boolean;
  storeEnabled: boolean;
  commentsEnabled: boolean;
  newsEnabled: boolean;
  reportsEnabled: boolean;
  defaultNotificationsEnabled: boolean;
  requireAdmin2fa: boolean;
  ipWhitelist: string[];
  updatedAt: string;
};

export type UpdateSiteSettingsPayload = Partial<
  Omit<SiteSettings, 'updatedAt' | 'metaKeywords' | 'ipWhitelist'>
> & {
  metaKeywords?: string[];
  ipWhitelist?: string[];
};

const siteSettingsKey = ['admin', 'settings', 'site'] as const;

export function useSiteSettings(enabled = true) {
  return useQuery({
    queryKey: siteSettingsKey,
    queryFn: async () => {
      const { data } = await api.get<SiteSettings>('/admin/settings/site');
      return data;
    },
    enabled,
  });
}

export function useUpdateSiteSettings() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateSiteSettingsPayload) => {
      const { data } = await api.patch<SiteSettings>('/admin/settings/site', payload);
      return data;
    },
    onSuccess: (data) => {
      qc.setQueryData(siteSettingsKey, data);
    },
  });
}
