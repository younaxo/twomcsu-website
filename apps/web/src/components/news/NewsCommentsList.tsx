'use client';

import { NewsCommentSort } from '@twomc/shared';
import { NewsCommentCard } from './NewsCommentCard';
import { NewsCommentForm } from './NewsCommentForm';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNewsComments } from '@/hooks/news';
import { useState } from 'react';

interface NewsCommentsListProps {
  slug: string;
  total: number;
  allowComments: boolean;
}

export function NewsCommentsList({ slug, total, allowComments }: NewsCommentsListProps) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<typeof NewsCommentSort[keyof typeof NewsCommentSort]>(
    NewsCommentSort.NEWEST,
  );
  const comments = useNewsComments(slug, { page, sort, limit: 20 });

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-white">Комментарии ({total})</h2>
        <div className="flex gap-1">
          {(
            [
              [NewsCommentSort.NEWEST, 'Новые'],
              [NewsCommentSort.OLDEST, 'Старые'],
              [NewsCommentSort.MOST_LIKED, 'Популярные'],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={sort === value ? 'default' : 'secondary'}
              onClick={() => {
                setSort(value);
                setPage(1);
              }}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {allowComments ? <NewsCommentForm slug={slug} /> : (
        <p className="text-sm text-muted-foreground">Комментарии отключены.</p>
      )}

      {comments.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : comments.data?.data.length ? (
        <div className="space-y-4">
          {comments.data.data.map((comment) => (
            <NewsCommentCard key={comment.id} comment={comment} slug={slug} />
          ))}
        </div>
      ) : (
        <p className="rounded-xl glass-light p-6 text-center text-sm text-muted-foreground">
          Пока нет комментариев
        </p>
      )}

      {comments.data && comments.data.pagination.totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={!comments.data.pagination.hasPrev}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Назад
          </Button>
          <span className="text-sm text-muted-foreground">
            {comments.data.pagination.page} / {comments.data.pagination.totalPages}
          </span>
          <Button
            type="button"
            variant="secondary"
            disabled={!comments.data.pagination.hasNext}
            onClick={() => setPage((p) => p + 1)}
          >
            Далее
          </Button>
        </div>
      ) : null}
    </section>
  );
}
