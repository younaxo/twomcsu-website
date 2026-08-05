'use client';

import type { TopicSummary } from '@twomc/shared';
import { RoleGroup, TopicVisibility, hasRoleGroup } from '@twomc/shared';
import { Lock } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { AdminEmptyState } from '@/components/admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useAdminTopics } from '@/hooks/useTopics';
import { TOPIC_CATEGORY_LABELS, TOPIC_VISIBILITY_LABELS } from '@/lib/topic';

const INTERNAL_VISIBILITIES: TopicVisibility[] = [
  TopicVisibility.AUTHENTICATED,
  TopicVisibility.HELPER_ONLY,
  TopicVisibility.MODERATOR_ONLY,
  TopicVisibility.ADMIN_ONLY,
  TopicVisibility.OWNER_ONLY,
];

export default function AdminTopicsInternalPage() {
  const { user } = useAuth();
  const isOwner = user ? hasRoleGroup(user.roleGroup, RoleGroup.OWNER) : false;
  const topics = useAdminTopics(isOwner);

  const grouped = useMemo(() => {
    const rows = (topics.data ?? []).filter(
      (row) => row.visibility !== TopicVisibility.PUBLIC,
    );

    const map = new Map<TopicVisibility, TopicSummary[]>();

    for (const visibility of INTERNAL_VISIBILITIES) {
      map.set(
        visibility,
        rows.filter((row) => row.visibility === visibility),
      );
    }

    return map;
  }, [topics.data]);

  if (!isOwner) {
    return (
      <p className="text-sm text-muted-foreground">
        Внутренние материалы доступны только владельцу.
      </p>
    );
  }

  const hasAny = INTERNAL_VISIBILITIES.some((key) => (grouped.get(key)?.length ?? 0) > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Внутренние темы</h1>
          <p className="text-sm text-muted-foreground">
            Материалы с ограниченной видимостью для команды
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/topics">Все темы</Link>
        </Button>
      </div>

      {!hasAny ? (
        <AdminEmptyState
          icon={Lock}
          title="Нет внутренних тем"
          description="Создайте тему с видимостью выше «Публично»"
        />
      ) : (
        INTERNAL_VISIBILITIES.map((visibility) => {
          const items = grouped.get(visibility) ?? [];
          if (!items.length) return null;

          return (
            <Card key={visibility} className="glass-medium border-white/5">
              <CardHeader>
                <CardTitle className="text-base">{TOPIC_VISIBILITY_LABELS[visibility]}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2"
                  >
                    <div>
                      <Link
                        href={`/admin/topics/${item.id}/edit`}
                        className="font-medium hover:underline"
                      >
                        {item.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">{item.slug}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        {TOPIC_CATEGORY_LABELS[item.category]}
                      </Badge>
                      {!item.isActive ? <Badge variant="outline">скрыта</Badge> : null}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
