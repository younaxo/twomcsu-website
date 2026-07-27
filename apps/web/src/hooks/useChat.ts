'use client';

import type {
  ChatChannel,
  ChatMessage,
  ChatMessagesResponse,
  ChatOnlineUser,
} from '@twomc/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useChatChannels(enabled = true) {
  return useQuery({
    queryKey: queryKeys.chatChannels,
    queryFn: async () => {
      const { data } = await api.get<ChatChannel[]>('/chat/channels', {
        skipAuthRedirect: true,
      });
      return data;
    },
    enabled,
    staleTime: 60_000,
  });
}

export function useChatChannel(slug: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.chatChannel(slug ?? ''),
    queryFn: async () => {
      const { data } = await api.get<ChatChannel>(`/chat/channels/${slug}`, {
        skipAuthRedirect: true,
      });
      return data;
    },
    enabled: Boolean(slug) && enabled,
  });
}

export function useChatMessages(slug: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.chatMessages(slug ?? ''),
    queryFn: async () => {
      const { data } = await api.get<ChatMessagesResponse>(
        `/chat/channels/${slug}/messages`,
        { params: { limit: 50 }, skipAuthRedirect: true },
      );
      return data;
    },
    enabled: Boolean(slug) && enabled,
  });
}

export function useChatOnline(slug: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.chatOnline(slug ?? ''),
    queryFn: async () => {
      const { data } = await api.get<ChatOnlineUser[]>(`/chat/channels/${slug}/online`, {
        skipAuthRedirect: true,
      });
      return data;
    },
    enabled: Boolean(slug) && enabled,
    refetchInterval: 15_000,
  });
}

export function useChatPinned(slug: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.chatPinned(slug ?? ''),
    queryFn: async () => {
      const { data } = await api.get<ChatMessage[]>(`/chat/channels/${slug}/pinned`, {
        skipAuthRedirect: true,
      });
      return data;
    },
    enabled: Boolean(slug) && enabled,
  });
}

export function useLoadOlderMessages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ slug, before }: { slug: string; before: string }) => {
      const { data } = await api.get<ChatMessagesResponse>(`/chat/channels/${slug}/messages`, {
        params: { before, limit: 50 },
      });
      return data;
    },
    onSuccess: (data, vars) => {
      queryClient.setQueryData<ChatMessagesResponse>(
        queryKeys.chatMessages(vars.slug),
        (prev) => {
          if (!prev) return data;
          const ids = new Set(prev.items.map((m) => m.id));
          const older = data.items.filter((m) => !ids.has(m.id));
          return {
            items: [...older, ...prev.items],
            hasMore: data.hasMore,
          };
        },
      );
    },
  });
}
