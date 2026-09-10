'use client';

import type { CookieConsentInput, CookieConsentRecord } from '@twomc/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { defaultConsent, readConsentCookie, writeConsentCookie } from '@/lib/cookie-consent';

const consentKey = ['consent', 'me'] as const;

/** Server consent for the signed-in account; null on first visit or for guests */
function useServerConsent(enabled: boolean) {
  return useQuery({
    queryKey: consentKey,
    queryFn: async () => {
      const { data } = await api.get<CookieConsentRecord | null>('/users/me/consent', {
        skipAuthRedirect: true,
      });
      return data;
    },
    enabled,
    staleTime: 60_000,
  });
}

/**
 * Single source of truth for cookie consent: a local cookie for instant, SSR-safe reads
 * (works for guests too), synced to the account's server history once signed in.
 */
export function useCookieConsent() {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const server = useServerConsent(isAuthenticated);
  const [local, setLocal] = useState<CookieConsentRecord | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLocal(readConsentCookie());
    setHydrated(true);
  }, []);

  const save = useMutation({
    mutationFn: async (input: CookieConsentInput) => {
      const record = writeConsentCookie(input);
      if (isAuthenticated) {
        await api.put('/users/me/consent', input, { skipAuthRedirect: true });
      }
      return record;
    },
    onSuccess: (record) => {
      setLocal(record);
      qc.setQueryData(consentKey, record);
    },
  });

  // Signed in, but the account has never saved consent server-side — carry the local choice over
  useEffect(() => {
    if (isAuthenticated && server.data === null && local && !save.isPending) {
      void save.mutateAsync({
        analytics: local.analytics,
        marketing: local.marketing,
        preferences: local.preferences,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, server.data, local]);

  const consent = isAuthenticated ? (server.data ?? local) : local;
  const ready = hydrated && (!isAuthenticated || server.isFetched);
  const showBanner = ready && !consent;

  return {
    consent,
    showBanner,
    ready,
    acceptAll: () => save.mutate({ analytics: true, marketing: true, preferences: true }),
    rejectAll: () => save.mutate(defaultConsent),
    saveCustom: (input: CookieConsentInput) => save.mutate(input),
    isSaving: save.isPending,
  };
}
