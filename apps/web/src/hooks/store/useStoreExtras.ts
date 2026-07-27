'use client';

import type {
  AdminStoreStatsResponse,
  CurrencyExchangeRequest,
  CurrencyExchangeResponse,
  CurrencyRate,
  GameCurrencyRates,
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

export function useCurrencyRates(enabled = true) {
  return useQuery({
    queryKey: queryKeys.storeCurrencyRates,
    queryFn: async () => {
      const { data } = await api.get<GameCurrencyRates>('/store/currency-rates', {
        skipAuthRedirect: true,
      });
      return data;
    },
    enabled,
    staleTime: 60_000,
  });
}

export function useExchangeCurrency() {
  return useMutation({
    mutationFn: async (payload: CurrencyExchangeRequest) => {
      const { data } = await api.post<CurrencyExchangeResponse>('/store/exchange', payload);
      return data;
    },
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
