'use client';

import type {
  AdminStoreStatsResponse,
  CurrencyRate,
  QuickBuyRequest,
  QuickBuyResponse,
  RecentPurchaseItem,
  StoreProduct,
} from '@twomc/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useCurrencies(enabled = true) {
  return useQuery({
    queryKey: queryKeys.storeCurrencies,
    queryFn: async () => {
      const { data } = await api.get<CurrencyRate[]>('/store/currencies', {
        skipAuthRedirect: true,
      });
      return data;
    },
    enabled,
  });
}

export function useRecentPurchases(limit = 12, enabled = true) {
  return useQuery({
    queryKey: queryKeys.storeRecentPurchases(limit),
    queryFn: async () => {
      const { data } = await api.get<RecentPurchaseItem[]>('/store/recent-purchases', {
        params: { limit },
        skipAuthRedirect: true,
      });
      return data;
    },
    enabled,
  });
}

export function useBoughtTogether(productId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.storeBoughtTogether(productId ?? ''),
    queryFn: async () => {
      const { data } = await api.get<StoreProduct[]>(
        `/store/products/${productId}/bought-together`,
        { skipAuthRedirect: true },
      );
      return data;
    },
    enabled: Boolean(productId) && enabled,
  });
}

export function useQuickBuy() {
  return useMutation({
    mutationFn: async (payload: QuickBuyRequest) => {
      const { data } = await api.post<QuickBuyResponse>('/store/quick-buy', payload, {
        skipAuthRedirect: true,
      });
      return data;
    },
  });
}

export function useAdminStoreStats(enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminStoreStats,
    queryFn: async () => {
      const { data } = await api.get<AdminStoreStatsResponse>('/admin/store/stats');
      return data;
    },
    enabled,
  });
}
