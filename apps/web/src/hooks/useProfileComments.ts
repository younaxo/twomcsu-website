'use client';

import type {
  CommentEmoji,
  CommentReportReason,
  CommentSort,
  ProfileComment,
  ProfileCommentsResponse,
} from '@twomc/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

interface CommentsQueryOptions {
  page?: number;
  limit?: number;
  sort?: CommentSort;
  enabled?: boolean;
}

export function useProfileComments(
  username: string,
  { page = 1, limit = 20, sort = 'newest', enabled = true }: CommentsQueryOptions = {},
) {
  return useQuery({
    queryKey: queryKeys.comments(username, page, sort),
    queryFn: async () => {
      const { data } = await api.get<ProfileCommentsResponse>(
        `/users/${encodeURIComponent(username)}/comments`,
        {
          params: { page, limit, sort },
          skipAuthRedirect: true,
        },
      );

      if (!data || !Array.isArray(data.data) || !Array.isArray(data.pinned)) {
        throw new Error('Некорректный ответ сервера для комментариев');
      }

      return data;
    },
    enabled: enabled && Boolean(username),
    refetchOnMount: 'always',
  });
}

function invalidateComments(queryClient: ReturnType<typeof useQueryClient>, username: string) {
  return queryClient.invalidateQueries({ queryKey: ['comments', username] });
}

export function useCreateComment(username: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { content: string; parentId?: string }) => {
      const { data } = await api.post<ProfileComment>(
        `/users/${encodeURIComponent(username)}/comments`,
        payload,
      );
      return data;
    },
    onSuccess: () => invalidateComments(queryClient, username),
  });
}

export function useUpdateComment(username: string, commentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      const { data } = await api.patch<ProfileComment>(
        `/users/${encodeURIComponent(username)}/comments/${commentId}`,
        { content },
      );
      return data;
    },
    onSuccess: () => invalidateComments(queryClient, username),
  });
}

export function useDeleteComment(username: string, commentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reason?: string) => {
      const { data } = await api.delete(`/users/${encodeURIComponent(username)}/comments/${commentId}`, {
        data: reason ? { reason } : undefined,
      });
      return data;
    },
    onSuccess: () => invalidateComments(queryClient, username),
  });
}

export function usePinComment(username: string, commentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ProfileComment>(
        `/users/${encodeURIComponent(username)}/comments/${commentId}/pin`,
      );
      return data;
    },
    onSuccess: () => invalidateComments(queryClient, username),
  });
}

export function useUnpinComment(username: string, commentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ProfileComment>(
        `/users/${encodeURIComponent(username)}/comments/${commentId}/unpin`,
      );
      return data;
    },
    onSuccess: () => invalidateComments(queryClient, username),
  });
}

export function useAddReaction(username: string, commentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ emoji }: { emoji: CommentEmoji }) => {
      const { data } = await api.post<ProfileComment>(
        `/users/${encodeURIComponent(username)}/comments/${commentId}/reactions`,
        { emoji },
      );
      return data;
    },
    onMutate: async ({ emoji }) => {
      await queryClient.cancelQueries({ queryKey: ['comments', username] });
      const previous = queryClient.getQueriesData<ProfileCommentsResponse>({
        queryKey: ['comments', username],
      });

      queryClient.setQueriesData<ProfileCommentsResponse>(
        { queryKey: ['comments', username] },
        (current) => {
          if (!current) return current;
          return {
            ...current,
            data: current.data.map((comment) => replaceMyReaction(comment, commentId, emoji)),
            pinned: current.pinned.map((comment) => replaceMyReaction(comment, commentId, emoji)),
          };
        },
      );

      return { previous };
    },
    onError: (_error, _vars, context) => {
      context?.previous.forEach(([key, value]) => {
        queryClient.setQueryData(key, value);
      });
    },
    onSettled: () => invalidateComments(queryClient, username),
  });
}

export function useRemoveReaction(username: string, commentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (emoji: CommentEmoji) => {
      const { data } = await api.delete<ProfileComment>(
        `/users/${encodeURIComponent(username)}/comments/${commentId}/reactions/${emoji}`,
      );
      return data;
    },
    onMutate: async (emoji) => {
      await queryClient.cancelQueries({ queryKey: ['comments', username] });
      const previous = queryClient.getQueriesData<ProfileCommentsResponse>({
        queryKey: ['comments', username],
      });

      queryClient.setQueriesData<ProfileCommentsResponse>({ queryKey: ['comments', username] }, (current) => {
        if (!current) return current;
        return {
          ...current,
          data: current.data.map((comment) => patchReaction(comment, commentId, emoji, false)),
          pinned: current.pinned.map((comment) => patchReaction(comment, commentId, emoji, false)),
        };
      });

      return { previous };
    },
    onError: (_error, _vars, context) => {
      context?.previous.forEach(([key, value]) => {
        queryClient.setQueryData(key, value);
      });
    },
    onSettled: () => invalidateComments(queryClient, username),
  });
}

export function useReportComment(username: string, commentId: string) {
  return useMutation({
    mutationFn: async (payload: { reason: CommentReportReason; description?: string }) => {
      const { data } = await api.post(
        `/users/${encodeURIComponent(username)}/comments/${commentId}/report`,
        payload,
      );
      return data;
    },
  });
}

function patchReaction(
  comment: ProfileComment,
  commentId: string,
  emoji: CommentEmoji,
  add: boolean,
): ProfileComment {
  if (comment.id === commentId) {
    return {
      ...comment,
      reactions: upsertReactionList(comment.reactions, emoji, add),
    };
  }

  return {
    ...comment,
    replies: comment.replies.map((reply) => patchReaction(reply, commentId, emoji, add)),
  };
}

/** Single active reaction per viewer: toggle same emoji off, otherwise replace */
function replaceMyReaction(
  comment: ProfileComment,
  commentId: string,
  emoji: CommentEmoji,
): ProfileComment {
  if (comment.id === commentId) {
    const current = comment.reactions.find((reaction) => reaction.reacted);
    if (current?.emoji === emoji) {
      return {
        ...comment,
        reactions: upsertReactionList(comment.reactions, emoji, false),
      };
    }

    let next = comment.reactions;
    if (current) {
      next = upsertReactionList(next, current.emoji, false);
    }
    next = upsertReactionList(next, emoji, true);
    return { ...comment, reactions: next };
  }

  return {
    ...comment,
    replies: comment.replies.map((reply) => replaceMyReaction(reply, commentId, emoji)),
  };
}

function upsertReactionList(
  reactions: ProfileComment['reactions'],
  emoji: CommentEmoji,
  add: boolean,
): ProfileComment['reactions'] {
  const existing = reactions.find((reaction) => reaction.emoji === emoji);

  if (add) {
    if (existing) {
      if (existing.reacted) return reactions;
      return reactions.map((reaction) =>
        reaction.emoji === emoji
          ? { ...reaction, count: reaction.count + 1, reacted: true }
          : reaction,
      );
    }

    return [...reactions, { emoji, count: 1, reacted: true, users: [] }];
  }

  if (!existing?.reacted) return reactions;

  const nextCount = existing.count - 1;
  if (nextCount <= 0) {
    return reactions.filter((reaction) => reaction.emoji !== emoji);
  }

  return reactions.map((reaction) =>
    reaction.emoji === emoji
      ? { ...reaction, count: nextCount, reacted: false }
      : reaction,
  );
}
