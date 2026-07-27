'use client';

import type { CreateOrderResponse, WishlistResponse } from '@twomc/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { useAuth } from '@/hooks/useAuth';

export function useWishlist(enabled = true) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.storeWishlist,
    queryFn: async () => {
      const { data } = await api.get<WishlistResponse>('/store/wishlist');
      return data;
    },
    enabled: enabled && isAuthenticated,
  });
}

export function useAddToWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const { data } = await api.post<WishlistResponse>(
        `/store/wishlist/items/${productId}`,
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.storeWishlist, data);
      void queryClient.invalidateQueries({ queryKey: ['store', 'product'] });
      void queryClient.invalidateQueries({ queryKey: ['store', 'products'] });
    },
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const { data } = await api.delete<WishlistResponse>(
        `/store/wishlist/items/${productId}`,
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.storeWishlist, data);
      void queryClient.invalidateQueries({ queryKey: ['store', 'product'] });
      void queryClient.invalidateQueries({ queryKey: ['store', 'products'] });
    },
  });
}

export function useUpdateWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { isPublic: boolean }) => {
      const { data } = await api.patch<WishlistResponse>('/store/wishlist', payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.storeWishlist, data);
    },
  });
}

export function useGiftFromWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      giftMessage,
    }: {
      productId: string;
      giftMessage?: string;
    }) => {
      const { data } = await api.post<CreateOrderResponse>(
        `/store/wishlist/items/${productId}/gift`,
        { giftMessage },
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.storeCart });
      void queryClient.invalidateQueries({ queryKey: ['store', 'orders'] });
    },
  });
}
