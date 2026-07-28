'use client';

import { RoleGroup } from '@twomc/shared';
import { Skeleton } from '@/components/ui/skeleton';
import { RolePanelLayout } from '@/components/admin/RolePanelLayout';
import { useRoleGuard } from '@/components/admin/useRoleGuard';

const moderationLinks = [
  { href: '/moderation/tickets', label: 'Обращения' },
  { href: '/moderation/profile-reports', label: 'Жалобы на профили' },
  { href: '/moderation/comment-reports', label: 'Жалобы на комментарии' },
  { href: '/moderation/media-requests', label: 'Медиа заявки' },
  { href: '/moderation/chat/channels', label: 'Чат: каналы' },
  { href: '/moderation/chat/mutes', label: 'Чат: муты' },
  { href: '/moderation/chat/bans', label: 'Чат: баны' },
  { href: '/moderation/chat/search', label: 'Чат: поиск' },
  { href: '/moderation/chat/settings', label: 'Чат: настройки' },
];

export default function ModerationLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, allowed } = useRoleGuard(RoleGroup.HELPER);

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!allowed) return null;

  return (
    <RolePanelLayout title="Модерация" links={moderationLinks}>
      {children}
    </RolePanelLayout>
  );
}
