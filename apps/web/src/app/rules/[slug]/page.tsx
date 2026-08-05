'use client';

import { FileText } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { TopicViewer } from '@/components/topics/TopicViewer';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTopic } from '@/hooks/useTopics';

export default function RuleTopicPage() {
  const params = useParams<{ slug: string }>();
  const topic = useTopic(params.slug);
  const status = (topic.error as { response?: { status?: number } } | null)?.response?.status;

  if (topic.isLoading) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  if (status === 403) {
    return (
      <EmptyState
        icon={FileText}
        title="Доступ ограничен"
        description="Войдите в аккаунт с нужными правами или обратитесь к администрации"
        action={
          <Button asChild>
            <Link href="/login">Войти</Link>
          </Button>
        }
      />
    );
  }

  if (topic.isError || !topic.data) {
    return (
      <EmptyState
        icon={FileText}
        title="Тема не найдена"
        description="Возможно, она была удалена или ещё не опубликована"
        action={
          <Button variant="outline" asChild>
            <Link href="/rules">К правилам</Link>
          </Button>
        }
      />
    );
  }

  return <TopicViewer topic={topic.data} />;
}
