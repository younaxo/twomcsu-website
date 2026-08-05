'use client';

import { RoleGroup, hasRoleGroup } from '@twomc/shared';
import { TopicEditor } from '@/components/topics/TopicEditor';
import { useAuth } from '@/hooks/useAuth';

export default function AdminNewTopicPage() {
  const { user } = useAuth();
  const isOwner = user ? hasRoleGroup(user.roleGroup, RoleGroup.OWNER) : false;

  if (!isOwner) {
    return (
      <p className="text-sm text-muted-foreground">
        Создание тем доступно только владельцу.
      </p>
    );
  }

  return <TopicEditor />;
}
