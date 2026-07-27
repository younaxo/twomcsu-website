'use client';

import type { CartResponse, CartTotals } from '@twomc/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { useAuth } from '@/hooks/useAuth';

export interface AddCartItemInput {
  productId?: string;
  variantId?: string;
  bundleId?: string;
  quantity?: number;
  giftToUserId?: string | null;
  giftMessage?: string | null;
}

export interface UpdateCartItemInput {
  quantity?: number;
  giftToUserId?: string | null;
  giftMessage?: string | null;
}

export function useCart(enabled = true) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.storeCart,
    queryFn: async () => {
      const { data } = await api.get<CartResponse>('/store/cart');
      return data;
    },
    enabled: enabled && isAuthenticated,
  });
}

function invalidateCart(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.storeCart });
}

export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AddCartItemInput) => {
      const { data } = await api.post<CartResponse>('/store/cart/items', payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.storeCart, data);
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateCartItemInput & { id: string }) => {
      const { data } = await api.patch<CartResponse>(`/store/cart/items/${id}`, payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.storeCart, data);
    },
  });
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { data } = await api.delete<CartResponse>(`/store/cart/items/${itemId}`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.storeCart, data);
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.delete<CartResponse>('/store/cart');
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.storeCart, data);
    },
  });
}

export function useApplyPromoCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      const { data } = await api.post<CartResponse>('/store/cart/apply-promo', { code });
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.storeCart, data);
    },
  });
}

export function useRemovePromoCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.delete<CartResponse>('/store/cart/promo');
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.storeCart, data);
    },
  });
}

export function useCalculateCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<CartTotals>('/store/cart/calculate');
      return data;
    },
    onSuccess: () => {
      void invalidateCart(queryClient);
    },
  });
}
