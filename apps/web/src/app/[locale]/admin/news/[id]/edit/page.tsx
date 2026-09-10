'use client';

import { NewsEditor } from '@/components/news/NewsEditor';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminNewsItem } from '@/hooks/news';
import { use } from 'react';

export default function AdminNewsEditPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolved = use(Promise.resolve(params));
  const item = useAdminNewsItem(resolved.id);

  if (item.isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!item.data) {
    return <p className="text-sm text-muted-foreground">Новость не найдена</p>;
  }

  return <NewsEditor initial={item.data} />;
}
