'use client';

import type { ActivityCommentItem } from '@twomc/shared';
import { useState } from 'react';
import { toast } from 'sonner';
import { MarkdownEditor } from '@/components/shared/MarkdownEditor';
import { Button } from '@/components/ui/button';
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
        <div className="space-y-2">
          <MarkdownEditor
            value={content}
            onChange={setContent}
            placeholder="Написать комментарий…"
            minHeight={72}
            maxHeight={240}
            showToolbar={false}
            maxLength={1000}
            disabled={addComment.isPending}
          />
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => void submit()}
              disabled={addComment.isPending || !content.trim()}
            >
              Отправить
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Войдите, чтобы комментировать</p>
      )}
    </div>
  );
}
