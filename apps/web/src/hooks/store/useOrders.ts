'use client';

import type { CreateOrderResponse, OrdersResponse, StoreOrder } from '@twomc/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { useAuth } from '@/hooks/useAuth';

export function useOrders(page = 1, limit = 20, enabled = true) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.storeOrders(page),
    queryFn: async () => {
      const { data } = await api.get<OrdersResponse>('/store/orders', {
        params: { page, limit },
      });
      return data;
    },
    enabled: enabled && isAuthenticated,
  });
}

export function useOrder(orderNumber: string, enabled = true) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.storeOrder(orderNumber),
    queryFn: async () => {
      const { data } = await api.get<StoreOrder>(
        `/store/orders/${encodeURIComponent(orderNumber)}`,
      );
      return data;
    },
    enabled: enabled && isAuthenticated && Boolean(orderNumber),
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload?: { promoCode?: string; notes?: string }) => {
      const { data } = await api.post<CreateOrderResponse>('/store/orders', payload ?? {});
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.storeCart });
      void queryClient.invalidateQueries({ queryKey: ['store', 'orders'] });
    },
  });
}

export function useSimulatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await api.post<StoreOrder>(
        `/store/orders/${encodeURIComponent(orderId)}/mock-complete`,
      );
      return data;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['store', 'orders'] });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.storeOrder(data.orderNumber),
      });
    },
  });
}
