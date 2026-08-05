'use client';

import type { ActivityDetail, ActivityItem } from '@twomc/shared';
import { RoleGroup, hasRoleGroup } from '@twomc/shared';
import { MoreHorizontal, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
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
  useHideActivity,
  usePinActivity,
  useToggleReaction,
} from '@/hooks/activity';
import { cn } from '@/lib/utils';
import { ActivityComments } from './ActivityComments';
import { ActivityContent } from './ActivityContent';
import { ActivityHeader } from './ActivityHeader';
import { ActivityReactions } from './ActivityReactions';
import { activityAccentClass } from './ActivityTypeIcon';

interface ActivityCardProps {
  activity: ActivityItem | ActivityDetail;
  showComments?: boolean;
  defaultCommentsOpen?: boolean;
}

export function ActivityCard({
  activity,
  showComments = true,
  defaultCommentsOpen = false,
}: ActivityCardProps) {
  const { user, isAuthenticated } = useAuth();
  const [commentsOpen, setCommentsOpen] = useState(defaultCommentsOpen);
  const toggleReaction = useToggleReaction();
  const hideActivity = useHideActivity();
  const pinActivity = usePinActivity();

  const isModerator =
    user && hasRoleGroup(user.roleGroup as RoleGroup, RoleGroup.MODERATOR);
  const isAdmin = user && hasRoleGroup(user.roleGroup as RoleGroup, RoleGroup.ADMIN);
  const comments = 'comments' in activity ? activity.comments : [];

  return (
    <article
      className={cn(
        'space-y-4 rounded-2xl border border-white/10 border-l-4 glass-medium p-4 sm:p-5',
        activityAccentClass(activity.type),
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <ActivityHeader
            user={activity.user}
            type={activity.type}
            createdAt={activity.createdAt}
            isPinned={activity.isPinned}
          />
        </div>
        {isModerator ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Действия">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  void hideActivity.mutateAsync({ id: activity.id }).then(
                    () => toast.success('Активность скрыта'),
                    () => toast.error('Не удалось скрыть'),
                  );
                }}
              >
                Скрыть
              </DropdownMenuItem>
              {isAdmin ? (
                <DropdownMenuItem
                  onClick={() => {
                    void pinActivity
                      .mutateAsync({ id: activity.id, pin: !activity.isPinned })
                      .then(
                        () =>
                          toast.success(
                            activity.isPinned ? 'Откреплено' : 'Закреплено',
                          ),
                        () => toast.error('Не удалось изменить'),
                      );
                  }}
                >
                  {activity.isPinned ? 'Открепить' : 'Закрепить'}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      <ActivityContent activity={activity} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ActivityReactions
          reactions={activity.reactions}
          disabled={!isAuthenticated || toggleReaction.isPending}
          onToggle={(emoji) => {
            if (!isAuthenticated) {
              toast.error('Войдите, чтобы поставить реакцию');
              return;
            }
            void toggleReaction.mutateAsync({ activityId: activity.id, emoji });
          }}
        />

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                asChild
              >
                <Link href={`/feed/${activity.id}`}>Подробнее</Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Открыть</TooltipContent>
          </Tooltip>

          {showComments ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-muted-foreground"
                  onClick={() => setCommentsOpen((v) => !v)}
                >
                  <MessageCircle className="h-4 w-4" />
                  {activity.commentsCount}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Комментарии</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      </div>

      {showComments ? (
        <ActivityComments
          activityId={activity.id}
          comments={comments}
          open={commentsOpen}
        />
      ) : null}
    </article>
  );
}
