'use client';

import type {
  Conversation,
  ConversationsResponse,
  DirectMessage,
  DirectMessagePolicy,
  DirectMessagesResponse,
  GroupInvite,
  GroupInvitePreview,
} from '@twomc/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useConversations(enabled = true) {
  return useQuery({
    queryKey: queryKeys.conversations,
    queryFn: async () => (await api.get<ConversationsResponse>('/messages/conversations')).data,
    enabled,
  });
}

export function useConversation(id: string | null) {
  return useQuery({
    queryKey: queryKeys.conversation(id ?? ''),
    queryFn: async () => (await api.get<Conversation>(`/messages/conversations/${id}`)).data,
    enabled: Boolean(id),
  });
}

export function useDirectMessageItems(conversationId: string | null) {
  return useQuery({
    queryKey: queryKeys.directMessages(conversationId ?? ''),
    queryFn: async () =>
      (await api.get<DirectMessagesResponse>(`/messages/conversations/${conversationId}/messages`)).data,
    enabled: Boolean(conversationId),
  });
}

export function useCreateDirectConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (username: string) =>
      (await api.post<Conversation>('/messages/conversations/direct', { username })).data,
    onSuccess: (conversation) => {
      void qc.invalidateQueries({ queryKey: queryKeys.conversations });
      qc.setQueryData(queryKeys.conversation(conversation.id), conversation);
    },
  });
}

export function useCreateGroupConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; usernames: string[] }) =>
      (await api.post<Conversation>('/messages/conversations/group', input)).data,
    onSuccess: (conversation) => {
      void qc.invalidateQueries({ queryKey: queryKeys.conversations });
      qc.setQueryData(queryKeys.conversation(conversation.id), conversation);
    },
  });
}

export function useSendDirectMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { content: string; parentId?: string }) =>
      (await api.post<DirectMessage>(`/messages/conversations/${conversationId}/messages`, input)).data,
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.conversations }),
  });
}

export function useSendDirectMessageAttachment(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { file: File; content?: string; parentId?: string }) => {
      const form = new FormData();
      form.append('file', input.file);
      if (input.content) form.append('content', input.content);
      if (input.parentId) form.append('parentId', input.parentId);
      return (await api.post<DirectMessage>(`/messages/conversations/${conversationId}/messages/upload`, form)).data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.conversations }),
  });
}

export function useEditDirectMessage() {
  return useMutation({
    mutationFn: async (input: { messageId: string; content: string }) =>
      (await api.patch<DirectMessage>(`/messages/messages/${input.messageId}`, { content: input.content })).data,
  });
}

export function useDeleteDirectMessage() {
  return useMutation({
    mutationFn: async (messageId: string) =>
      (await api.delete<DirectMessage>(`/messages/messages/${messageId}`)).data,
  });
}

export function useReactToDirectMessage() {
  return useMutation({
    mutationFn: async (input: { messageId: string; emoji: string }) =>
      (await api.post<DirectMessage>(`/messages/messages/${input.messageId}/reactions`, { emoji: input.emoji })).data,
  });
}

export function useMarkConversationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { conversationId: string; messageId?: string }) =>
      (await api.post(`/messages/conversations/${input.conversationId}/read`, { messageId: input.messageId })).data,
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.conversations }),
  });
}

export function useDirectMessagePrivacy() {
  return useQuery({
    queryKey: queryKeys.directMessagePrivacy,
    queryFn: async () =>
      (await api.get<{ policy: DirectMessagePolicy }>('/messages/privacy')).data,
  });
}

export function useUpdateDirectMessagePrivacy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (policy: DirectMessagePolicy) =>
      (await api.patch<{ policy: DirectMessagePolicy }>('/messages/privacy', { policy })).data,
    onSuccess: (data) => qc.setQueryData(queryKeys.directMessagePrivacy, data),
  });
}

export function useCreateGroupInvite(conversationId: string) {
  return useMutation({
    mutationFn: async (input: { maxUses?: number; expiresInHours?: number }) =>
      (await api.post<GroupInvite>(`/messages/conversations/${conversationId}/invites`, input)).data,
  });
}

export function useGroupInvite(code: string) {
  return useQuery({
    queryKey: queryKeys.groupInvite(code),
    queryFn: async () => (await api.get<GroupInvitePreview>(`/messages/invites/${code}`)).data,
    enabled: Boolean(code),
  });
}

export function useJoinGroupInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) =>
      (await api.post<Conversation>(`/messages/invites/${code}/join`)).data,
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.conversations }),
  });
}
