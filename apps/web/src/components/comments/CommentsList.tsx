'use client';

import { CommentSort } from '@twomc/shared';
import { MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { CommentCard } from '@/components/comments/CommentCard';
import { CommentEditor } from '@/components/comments/CommentEditor';
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
import { toast } from 'sonner';

interface CommentsListProps {
  profileUsername: string;
  hideComments?: boolean;
  isOwner?: boolean;
  commentsEnabled?: boolean;
  commentsForcedReason?: string | null;
}

export function CommentsList({
  profileUsername,
  hideComments,
  isOwner,
  commentsEnabled = true,
  commentsForcedReason,
}: CommentsListProps) {
  const { isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<CommentSort>(CommentSort.NEWEST);
  const commentsQuery = useProfileComments(profileUsername, { page, sort });
  const createComment = useCreateComment(profileUsername);

  if (hideComments && !isOwner) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
        Комментарии скрыты владельцем профиля
      </div>
    );
  }

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

  if (commentsQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const data = commentsQuery.data;
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
            try {
              await createComment.mutateAsync({ content });
              toast.success('Комментарий опубликован');
            } catch (error) {
              throw error;
            }
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

      {data?.pinned.length ? (
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">Закреплённые</p>
          {data.pinned.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              profileUsername={profileUsername}
            />
          ))}
        </div>
      ) : null}

      {data?.data.length ? (
        <div className="space-y-5">
          {data.data.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              profileUsername={profileUsername}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          Пока нет комментариев. Будьте первым!
        </div>
      )}

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
