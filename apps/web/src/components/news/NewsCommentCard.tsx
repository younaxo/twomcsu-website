'use client';

import type { NewsComment } from '@twomc/shared';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Pin, Reply, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { CommentReactions } from '@/components/comments/CommentReactions';
import { ColoredUsername } from '@/components/shared/ColoredUsername';
import { MarkdownContent } from '@/components/shared/MarkdownContent';
import { Button } from '@/components/ui/button';
import {
  useDeleteNewsComment,
  useReactToNewsComment,
  useUpdateNewsComment,
} from '@/hooks/news';
import { NewsCommentForm } from './NewsCommentForm';

interface NewsCommentCardProps {
  comment: NewsComment;
  slug: string;
  depth?: number;
}

export function NewsCommentCard({ comment, slug, depth = 0 }: NewsCommentCardProps) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const react = useReactToNewsComment(slug);
  const remove = useDeleteNewsComment(slug);
  const update = useUpdateNewsComment(slug);

  const onDelete = async () => {
    try {
      await remove.mutateAsync(comment.id);
      toast.success('Комментарий удалён');
    } catch {
      toast.error('Не удалось удалить');
    }
  };

  return (
    <div id={`comment-${comment.id}`} className="space-y-3">
      <article className="rounded-xl glass-light p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
          {comment.isPinned ? <Pin className="h-3.5 w-3.5 text-primary" /> : null}
          <ColoredUsername user={comment.author} size="sm" showBadge badges={comment.author.badges} />
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ru })}
            {comment.isEdited ? ' · изменено' : ''}
          </span>
        </div>

        {editing ? (
          <NewsCommentForm
            slug={slug}
            initialValue={comment.content}
            submitLabel="Сохранить"
            onCancel={() => setEditing(false)}
            onSubmit={async (content) => {
              await update.mutateAsync({ commentId: comment.id, content });
              setEditing(false);
              toast.success('Сохранено');
            }}
          />
        ) : (
          <MarkdownContent
            content={comment.content}
            html={comment.contentHtml ?? undefined}
            className="prose-sm"
          />
        )}

        {!comment.isDeleted ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <CommentReactions
              reactions={comment.reactions}
              onToggle={(emoji) => react.mutate({ commentId: comment.id, emoji })}
              disabled={react.isPending}
            />
            {depth === 0 ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => setReplyOpen((v) => !v)}>
                <Reply className="mr-1 h-3.5 w-3.5" />
                Ответить
              </Button>
            ) : null}
            {comment.canEdit ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(true)}>
                Изменить
              </Button>
            ) : null}
            {comment.canDelete ? (
              <Button type="button" variant="ghost" size="sm" onClick={onDelete}>
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Удалить
              </Button>
            ) : null}
          </div>
        ) : null}

        {replyOpen ? (
          <div className="mt-3">
            <NewsCommentForm
              slug={slug}
              parentId={comment.id}
              placeholder="Ваш ответ..."
              submitLabel="Ответить"
              onCancel={() => setReplyOpen(false)}
              onSuccess={() => setReplyOpen(false)}
            />
          </div>
        ) : null}
      </article>

      {comment.replies?.length ? (
        <div className="space-y-3 border-l border-border/60 pl-4">
          {comment.replies.map((reply) => (
            <NewsCommentCard key={reply.id} comment={reply} slug={slug} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
