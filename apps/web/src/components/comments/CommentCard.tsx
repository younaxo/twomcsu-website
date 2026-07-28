'use client';

import type { ProfileComment as ProfileCommentType } from '@twomc/shared';
import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { MoreHorizontal, Pencil, Pin, Trash2, Flag, Reply } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { CommentEditor } from '@/components/comments/CommentEditor';
import { CommentReactions } from '@/components/comments/CommentReactions';
import { CommentReportDialog } from '@/components/comments/CommentReportDialog';
import { ColoredUsername } from '@/components/shared/ColoredUsername';
import { PositionBadge } from '@/components/shared/PositionBadge';
import { AvatarWithSkin } from '@/components/shared/AvatarWithSkin';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import {
  useAddReaction,
  useCreateComment,
  useDeleteComment,
  usePinComment,
  useUnpinComment,
  useUpdateComment,
} from '@/hooks/useProfileComments';
import { extractErrorMessage } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/profile';
import { cn } from '@/lib/utils';

interface CommentCardProps {
  comment: ProfileCommentType;
  profileUsername: string;
  isReply?: boolean;
}

export function CommentCard({ comment, profileUsername, isReply }: CommentCardProps) {
  const { isAuthenticated } = useAuth();
  const [replyOpen, setReplyOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const createComment = useCreateComment(profileUsername);
  const updateComment = useUpdateComment(profileUsername, comment.id);
  const deleteComment = useDeleteComment(profileUsername, comment.id);
  const pinComment = usePinComment(profileUsername, comment.id);
  const unpinComment = useUnpinComment(profileUsername, comment.id);
  const addReaction = useAddReaction(profileUsername, comment.id);

  const onToggleReaction = async (emoji: Parameters<typeof addReaction.mutateAsync>[0]['emoji']) => {
    if (!isAuthenticated) {
      toast.error('Войдите, чтобы ставить реакции');
      return;
    }

    try {
      await addReaction.mutateAsync({ emoji });
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось обновить реакцию'));
    }
  };

  return (
    <div className={cn('space-y-3', isReply && 'ml-10 border-l border-border pl-4')}>
      <div className="flex gap-3">
        <AvatarWithSkin
          user={{
            username: comment.author.username,
            avatar: resolveMediaUrl(comment.author.avatar) ?? null,
          }}
          size={isReply ? 'sm' : 'md'}
        />

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <ColoredUsername user={comment.author} size="sm" badges={comment.author.badges} />
            <PositionBadge position={comment.author.position} size="sm" />
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                    locale: ru,
                  })}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {format(new Date(comment.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
              </TooltipContent>
            </Tooltip>
            {comment.isEdited ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-muted-foreground">изменено</span>
                </TooltipTrigger>
                <TooltipContent>
                  {comment.editedAt
                    ? format(new Date(comment.editedAt), 'dd.MM.yyyy HH:mm', { locale: ru })
                    : 'Изменено'}
                </TooltipContent>
              </Tooltip>
            ) : null}
            {comment.isPinned ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1 text-xs text-primary">
                    <Pin className="h-3 w-3" />
                    Закреплено
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {comment.pinnedAt
                    ? `Закреплено ${format(new Date(comment.pinnedAt), 'dd.MM.yyyy HH:mm', { locale: ru })}`
                    : 'Закреплено'}
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>

          {editOpen ? (
            <CommentEditor
              initialValue={comment.content}
              submitLabel="Сохранить"
              isSubmitting={updateComment.isPending}
              onCancel={() => setEditOpen(false)}
              onSubmit={async (content) => {
                await updateComment.mutateAsync(content);
                setEditOpen(false);
                toast.success('Комментарий обновлён');
              }}
            />
          ) : (
            <div
              className={cn(
                'comment-markdown text-sm leading-relaxed',
                comment.isDeleted && 'italic text-muted-foreground',
              )}
              dangerouslySetInnerHTML={{ __html: comment.contentHtml }}
              onClick={(event) => {
                const target = event.target as HTMLElement;
                if (target.classList.contains('spoiler')) {
                  target.classList.toggle('revealed');
                  return;
                }
                if (target.classList.contains('mention')) {
                  const username = target.textContent?.replace(/^@/, '').trim();
                  if (username) {
                    window.location.href = `/users/${encodeURIComponent(username)}`;
                  }
                }
              }}
            />
          )}

          {!comment.isDeleted ? (
            <CommentReactions
              reactions={comment.reactions}
              disabled={!isAuthenticated}
              onToggle={(emoji) => void onToggleReaction(emoji)}
            />
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            {!isReply && !comment.isDeleted && isAuthenticated ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 px-2"
                onClick={() => setReplyOpen((open) => !open)}
              >
                <Reply className="mr-1 h-3.5 w-3.5" />
                Ответить
              </Button>
            ) : null}

            {(comment.canEdit || comment.canDelete || comment.canPin || isAuthenticated) &&
            !comment.isDeleted ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" size="icon" variant="ghost" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {comment.canEdit ? (
                    <DropdownMenuItem onClick={() => setEditOpen(true)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Редактировать
                    </DropdownMenuItem>
                  ) : null}
                  {comment.canPin ? (
                    <DropdownMenuItem
                      onClick={() =>
                        void (comment.isPinned ? unpinComment : pinComment)
                          .mutateAsync()
                          .then(() =>
                            toast.success(comment.isPinned ? 'Комментарий откреплён' : 'Комментарий закреплён'),
                          )
                          .catch((error) =>
                            toast.error(extractErrorMessage(error, 'Не удалось изменить закрепление')),
                          )
                      }
                    >
                      <Pin className="mr-2 h-4 w-4" />
                      {comment.isPinned ? 'Открепить' : 'Закрепить'}
                    </DropdownMenuItem>
                  ) : null}
                  {comment.canDelete ? (
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() =>
                        void deleteComment
                          .mutateAsync(undefined)
                          .then(() => toast.success('Комментарий удалён'))
                          .catch((error) =>
                            toast.error(extractErrorMessage(error, 'Не удалось удалить')),
                          )
                      }
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Удалить
                    </DropdownMenuItem>
                  ) : null}
                  {isAuthenticated && !comment.canDelete ? (
                    <DropdownMenuItem onClick={() => setReportOpen(true)}>
                      <Flag className="mr-2 h-4 w-4" />
                      Пожаловаться
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>

          {replyOpen ? (
            <CommentEditor
              placeholder="Ответить..."
              submitLabel="Ответить"
              isSubmitting={createComment.isPending}
              onCancel={() => setReplyOpen(false)}
              onSubmit={async (content) => {
                await createComment.mutateAsync({ content, parentId: comment.id });
                setReplyOpen(false);
                toast.success('Ответ отправлен');
              }}
            />
          ) : null}
        </div>
      </div>

      {comment.replies?.map((reply) => (
        <CommentCard
          key={reply.id}
          comment={reply}
          profileUsername={profileUsername}
          isReply
        />
      ))}

      <CommentReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        username={profileUsername}
        commentId={comment.id}
      />
    </div>
  );
}
