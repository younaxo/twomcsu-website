'use client';

import { TopicCategory } from '@twomc/shared';
import { FileText, Search } from 'lucide-react';
import { useState } from 'react';
import { TopicCard } from '@/components/topics/TopicCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useTopics } from '@/hooks/useTopics';

interface TopicsListPageProps {
  title: string;
  description: string;
  category: TopicCategory;
  hrefPrefix: string;
}

export function TopicsListPage({ title, description, category, hrefPrefix }: TopicsListPageProps) {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const topics = useTopics({ category, search: query, page: 1, limit: 50 });

  const submitSearch = () => setQuery(search.trim());

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-white">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitSearch();
          }}
          placeholder="Поиск..."
          className="pl-9"
        />
      </div>

      {topics.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
        </div>
      ) : topics.isError ? (
        <EmptyState
          icon={FileText}
          title="Не удалось загрузить"
          description="Попробуйте обновить страницу"
        />
      ) : !topics.data?.data.length ? (
        <EmptyState
          icon={FileText}
          title="Раздел пока пуст"
          description="Материалы появятся позже"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {topics.data.data.map((topic) => (
            <TopicCard key={topic.id} topic={topic} hrefPrefix={hrefPrefix} />
          ))}
        </div>
      )}
    </div>
  );
}
