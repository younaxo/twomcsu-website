'use client';

import type {
  BlockedUserItem,
  FriendListItem,
  FriendRequestItem,
  FriendsCountResponse,
  FriendshipStatusResponse,
  MyProfile,
  PaginatedResponse,
  PositionSummary,
  UserProfile,
} from '@twomc/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function usePublicProfile(username: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.profile(username),
    queryFn: async () => {
      const { data } = await api.get<UserProfile>(
        `/users/${encodeURIComponent(username)}/public`,
        { skipAuthRedirect: true },
      );
      return data;
    },
    enabled: enabled && Boolean(username),
  });
}

export function useMyProfile(enabled = true) {
  return useQuery({
    queryKey: queryKeys.myProfile,
    queryFn: async () => {
      const { data } = await api.get<MyProfile>('/users/me/profile');
      return data;
    },
    enabled,
  });
}

export function useFriends(page = 1, limit = 12, search = '') {
  return useQuery({
    queryKey: queryKeys.friends(page, search),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<FriendListItem>>('/friends', {
        params: { page, limit, search: search || undefined },
      });
      return data;
    },
  });
}

export function useIncomingRequests(page = 1, limit = 50) {
  return useQuery({
    queryKey: queryKeys.incomingRequests(page),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<FriendRequestItem>>(
        '/friends/requests/incoming',
        { params: { page, limit } },
      );
      return data;
    },
  });
}

export function useOutgoingRequests(page = 1, limit = 50) {
  return useQuery({
    queryKey: queryKeys.outgoingRequests(page),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<FriendRequestItem>>(
        '/friends/requests/outgoing',
        { params: { page, limit } },
      );
      return data;
    },
  });
}

export function useBlockedUsers(page = 1, limit = 50) {
  return useQuery({
    queryKey: queryKeys.blockedUsers(page),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<BlockedUserItem>>('/friends/blocked', {
        params: { page, limit },
      });
      return data;
    },
  });
}

export function useFriendStatus(username: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.friendStatus(username),
    queryFn: async () => {
      const { data } = await api.get<FriendshipStatusResponse>(
        `/friends/status/${encodeURIComponent(username)}`,
        { skipAuthRedirect: true },
      );
      return data;
    },
    enabled: enabled && Boolean(username),
  });
}

export function useFriendsCount(username?: string) {
  return useQuery({
    queryKey: queryKeys.friendsCount(username),
    queryFn: async () => {
      const path = username
        ? `/friends/count/${encodeURIComponent(username)}`
        : '/friends/count';
      const { data } = await api.get<FriendsCountResponse>(path, {
        skipAuthRedirect: true,
      });
      return data;
    },
  });
}

export function useIncomingRequestsCount(enabled = true) {
  return useQuery({
    queryKey: queryKeys.incomingCount,
    queryFn: async () => {
      const { data } = await api.get<FriendsCountResponse>('/friends/requests/incoming/count', {
        skipAuthRedirect: true,
      });
      return data.count;
    },
    enabled,
    refetchInterval: enabled ? 30_000 : false,
  });
}

export function usePositions(group?: string) {
  return useQuery({
    queryKey: queryKeys.positions(group),
    queryFn: async () => {
      const { data } = await api.get<PositionSummary[]>('/positions', {
        params: group ? { group } : undefined,
        skipAuthRedirect: true,
      });
      return data;
    },
  });
}

function useInvalidateFriends() {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['friends'] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.incomingCount }),
    ]);
}

export function useSendFriendRequest() {
  const invalidate = useInvalidateFriends();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (username: string) => {
      await api.post(`/friends/request/${encodeURIComponent(username)}`);
    },
    onSuccess: (_data, username) => {
      void invalidate();
      void queryClient.invalidateQueries({ queryKey: queryKeys.friendStatus(username) });
    },
  });
}

export function useAcceptFriendRequest() {
  const invalidate = useInvalidateFriends();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { data } = await api.post<FriendListItem>(`/friends/accept/${requestId}`);
      return data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['friends', 'incoming'] });
      const previous = queryClient.getQueryData<PaginatedResponse<FriendRequestItem>>(
        queryKeys.incomingRequests(1),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.incomingRequests(1), context.previous);
      }
    },
    onSuccess: () => {
      void invalidate();
    },
  });
}

export function useRejectFriendRequest() {
  const invalidate = useInvalidateFriends();

  return useMutation({
    mutationFn: async (requestId: string) => {
      await api.post(`/friends/reject/${requestId}`);
    },
    onSuccess: () => {
      void invalidate();
    },
  });
}

export function useCancelFriendRequest() {
  const invalidate = useInvalidateFriends();

  return useMutation({
    mutationFn: async (requestId: string) => {
      await api.delete(`/friends/requests/${requestId}`);
    },
    onSuccess: () => {
      void invalidate();
    },
  });
}

export function useRemoveFriend() {
  const invalidate = useInvalidateFriends();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (username: string) => {
      await api.delete(`/friends/${encodeURIComponent(username)}`);
    },
    onSuccess: (_data, username) => {
      void invalidate();
      void queryClient.invalidateQueries({ queryKey: queryKeys.friendStatus(username) });
    },
  });
}

export function useBlockUser() {
  const invalidate = useInvalidateFriends();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (username: string) => {
      await api.post(`/friends/block/${encodeURIComponent(username)}`);
    },
    onSuccess: (_data, username) => {
      void invalidate();
      void queryClient.invalidateQueries({ queryKey: queryKeys.friendStatus(username) });
    },
  });
}

export function useUnblockUser() {
  const invalidate = useInvalidateFriends();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (username: string) => {
      await api.delete(`/friends/block/${encodeURIComponent(username)}`);
    },
    onSuccess: (_data, username) => {
      void invalidate();
      void queryClient.invalidateQueries({ queryKey: queryKeys.friendStatus(username) });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.patch<MyProfile>('/users/me/profile', payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.myProfile, data);
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile(data.username) });
    },
  });
}

export function usePrefetchProfile() {
  const queryClient = useQueryClient();

  return (username: string) => {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.profile(username),
      queryFn: async () => {
        const { data } = await api.get<UserProfile>(
          `/users/${encodeURIComponent(username)}/public`,
          { skipAuthRedirect: true },
        );
        return data;
      },
    });
  };
}
