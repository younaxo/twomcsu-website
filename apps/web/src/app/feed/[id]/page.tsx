'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ActivityCard } from '@/components/activity/ActivityCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { useActivityById, useActivityRealtime } from '@/hooks/activity';
import { useAuth } from '@/hooks/useAuth';

export default function ActivityDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { isAuthenticated } = useAuth();
  useActivityRealtime(isAuthenticated);

  const { data, isLoading, isError } = useActivityById(id);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="gap-2 px-0 text-muted-foreground">
        <Link href="/feed">
          <ArrowLeft className="h-4 w-4" />
          К ленте
        </Link>
      </Button>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : isError || !data ? (
        <EmptyState title="Активность не найдена" description="Возможно, она скрыта или удалена" />
      ) : (
        <ActivityCard activity={data} defaultCommentsOpen showComments />
      )}
    </div>
  );
}
