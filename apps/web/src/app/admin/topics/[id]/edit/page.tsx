'use client';

import { RoleGroup, hasRoleGroup } from '@twomc/shared';
import { useParams } from 'next/navigation';
import { TopicEditor } from '@/components/topics/TopicEditor';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useAdminTopic } from '@/hooks/useTopics';

export default function AdminEditTopicPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const isOwner = user ? hasRoleGroup(user.roleGroup, RoleGroup.OWNER) : false;
  const topic = useAdminTopic(params.id, isOwner);

  if (!isOwner) {
    return (
      <p className="text-sm text-muted-foreground">
        Редактирование тем доступно только владельцу.
      </p>
    );
  }

  if (topic.isLoading) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  if (!topic.data) {
    return <p className="text-sm text-muted-foreground">Тема не найдена</p>;
  }

  return <TopicEditor topicId={params.id} initial={topic.data} />;
}
