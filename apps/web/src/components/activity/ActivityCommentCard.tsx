'use client';

import type { ActivityCommentItem } from '@twomc/shared';
import { RoleGroup, hasRoleGroup } from '@twomc/shared';
import { Trash2 } from 'lucide-react';
import Link from 'next/link';
import { AvatarWithSkin } from '@/components/shared/AvatarWithSkin';
import { ColoredUsername } from '@/components/shared/ColoredUsername';
import { MarkdownContent } from '@/components/shared/MarkdownContent';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { formatActivityTime } from './format-activity-time';

interface ActivityCommentCardProps {
  comment: ActivityCommentItem;
  onDelete?: (id: string) => void;
}

export function ActivityCommentCard({ comment, onDelete }: ActivityCommentCardProps) {
  const { user } = useAuth();
  const canDelete =
    user &&
    (user.id === comment.author.id ||
      hasRoleGroup(user.roleGroup as RoleGroup, RoleGroup.MODERATOR));

  return (
    <div className="flex gap-3 py-2">
      <Link href={`/users/${comment.author.username}`} className="shrink-0">
        <AvatarWithSkin
          user={{ username: comment.author.username, avatar: comment.author.avatar }}
          size="sm"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {comment.author.position ? (
            <ColoredUsername
              user={{
                username: comment.author.username,
                position: comment.author.position,
              }}
              badges={comment.author.badges}
              size="sm"
            />
          ) : (
            <span className="text-sm font-medium text-white">{comment.author.username}</span>
          )}
          <span className="text-xs text-muted-foreground">
            {formatActivityTime(comment.createdAt)}
          </span>
        </div>
        <MarkdownContent
          content={comment.content}
          html={comment.contentHtml ?? undefined}
          className="mt-1 prose-sm text-muted-foreground"
        />
      </div>
      {canDelete && onDelete ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => onDelete(comment.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Удалить</TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
}
