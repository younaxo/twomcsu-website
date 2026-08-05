'use client';

import type { ActivityCommentItem } from '@twomc/shared';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useAddComment, useDeleteComment } from '@/hooks/activity';
import { ActivityCommentCard } from './ActivityCommentCard';

interface ActivityCommentsProps {
  activityId: string;
  comments: ActivityCommentItem[];
  open?: boolean;
}

export function ActivityComments({
  activityId,
  comments,
  open = true,
}: ActivityCommentsProps) {
  const { isAuthenticated } = useAuth();
  const [content, setContent] = useState('');
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();

  if (!open) return null;

  const submit = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    try {
      await addComment.mutateAsync({ activityId, content: trimmed });
      setContent('');
      toast.success('Комментарий добавлен');
    } catch {
      toast.error('Не удалось отправить комментарий');
    }
  };

  return (
    <div className="space-y-3 border-t border-white/10 pt-3">
      <div className="divide-y divide-white/5">
        {comments.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">Пока нет комментариев</p>
        ) : (
          comments.map((comment) => (
            <ActivityCommentCard
              key={comment.id}
              comment={comment}
              onDelete={async (id) => {
                try {
                  await deleteComment.mutateAsync(id);
                  toast.success('Комментарий удалён');
                } catch {
                  toast.error('Не удалось удалить');
                }
              }}
            />
          ))
        )}
      </div>

      {isAuthenticated ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Написать комментарий…"
            className="min-h-[72px] flex-1"
            maxLength={1000}
          />
          <Button
            type="button"
            onClick={() => void submit()}
            disabled={addComment.isPending || !content.trim()}
            className="sm:self-end"
          >
            Отправить
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Войдите, чтобы комментировать</p>
      )}
    </div>
  );
}
