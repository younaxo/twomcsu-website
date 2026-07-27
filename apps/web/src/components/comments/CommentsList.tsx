'use client';

import { CommentSort } from '@twomc/shared';
import { MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { CommentCard } from '@/components/comments/CommentCard';
import { CommentEditor } from '@/components/comments/CommentEditor';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useCreateComment, useProfileComments } from '@/hooks/useProfileComments';
import { extractErrorMessage } from '@/lib/api';

interface CommentsListProps {
  profileUsername: string;
  commentsEnabled?: boolean;
  commentsForcedReason?: string | null;
}

export function CommentsList({
  profileUsername,
  commentsEnabled = true,
  commentsForcedReason,
}: CommentsListProps) {
  const { isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<CommentSort>(CommentSort.NEWEST);
  const commentsQuery = useProfileComments(profileUsername, { page, sort });
  const createComment = useCreateComment(profileUsername);

  if (!commentsEnabled) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-10 text-center">
        <p className="font-medium">Комментарии отключены администратором</p>
        {commentsForcedReason ? (
          <p className="mt-2 text-sm text-muted-foreground">Причина: {commentsForcedReason}</p>
        ) : null}
      </div>
    );
  }

  if (commentsQuery.isPending || (commentsQuery.isLoading && !commentsQuery.data)) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (commentsQuery.isError) {
    return (
      <div className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-8 text-center">
        <p className="font-medium">Не удалось загрузить комментарии</p>
        <p className="text-sm text-muted-foreground">
          {extractErrorMessage(commentsQuery.error, 'Попробуйте обновить страницу')}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => void commentsQuery.refetch()}>
          Повторить
        </Button>
      </div>
    );
  }

  const data = commentsQuery.data;
  const pinned = data?.pinned ?? [];
  const items = data?.data ?? [];
  const hasComments = pinned.length > 0 || items.length > 0;
  const canComment = Boolean(isAuthenticated && data?.canComment);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Комментарии</h2>
        </div>
        <Select
          value={sort}
          onValueChange={(value) => {
            setSort(value as CommentSort);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={CommentSort.NEWEST}>Новые</SelectItem>
            <SelectItem value={CommentSort.OLDEST}>Старые</SelectItem>
            <SelectItem value={CommentSort.POPULAR}>Популярные</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {canComment ? (
        <CommentEditor
          isSubmitting={createComment.isPending}
          onSubmit={async (content) => {
            await createComment.mutateAsync({ content });
            toast.success('Комментарий опубликован');
          }}
        />
      ) : isAuthenticated ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
          Вы не можете оставлять комментарии на этом профиле
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
          Войдите, чтобы оставить комментарий
        </div>
      )}

      {pinned.length > 0 ? (
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">Закреплённые</p>
          {pinned.map((comment) => (
            <CommentCard key={comment.id} comment={comment} profileUsername={profileUsername} />
          ))}
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="space-y-5">
          {items.map((comment) => (
            <CommentCard key={comment.id} comment={comment} profileUsername={profileUsername} />
          ))}
        </div>
      ) : null}

      {!hasComments ? (
        <EmptyState
          icon={MessageSquare}
          title="Пока нет комментариев"
          description="Будьте первым!"
          className="py-10"
        />
      ) : null}

      {data?.pagination.hasNext ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPage((current) => current + 1)}
            disabled={commentsQuery.isFetching}
          >
            Загрузить ещё
          </Button>
        </div>
      ) : null}
    </div>
  );
}
