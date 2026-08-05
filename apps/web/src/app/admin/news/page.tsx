'use client';

import {
  NEWS_CATEGORY_LABELS,
  NEWS_STATUS_LABELS,
  NewsCategory,
  NewsStatus,
} from '@twomc/shared';
import { Pin, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAdminNews,
  useDeleteNews,
  useFeatureNews,
  usePinNews,
} from '@/hooks/news';
import { NewsCategoryBadge } from '@/components/news/NewsCategoryBadge';

export default function AdminNewsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<NewsStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<NewsCategory | 'ALL'>('ALL');

  const list = useAdminNews({
    page,
    limit: 20,
    ...(status !== 'ALL' ? { status } : {}),
    ...(category !== 'ALL' ? { category } : {}),
    ...(search ? { search } : {}),
  });

  const remove = useDeleteNews();
  const pin = usePinNews();
  const feature = useFeatureNews();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-white">Новости</h1>
        <div className="flex gap-2">
          <Button asChild variant="secondary">
            <Link href="/admin/news/stats">Статистика</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/news/new">Создать новость</Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['ALL', ...Object.keys(NEWS_STATUS_LABELS)] as const).map((value) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={status === value ? 'default' : 'secondary'}
            onClick={() => {
              setStatus(value as NewsStatus | 'ALL');
              setPage(1);
            }}
          >
            {value === 'ALL' ? 'Все' : NEWS_STATUS_LABELS[value as NewsStatus]}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Поиск..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        <select
          className="rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value as NewsCategory | 'ALL');
            setPage(1);
          }}
        >
          <option value="ALL">Все категории</option>
          {Object.entries(NEWS_CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl glass-medium">
        {list.isLoading ? (
          <div className="p-4">
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="p-3">Обложка</th>
                <th className="p-3">Заголовок</th>
                <th className="p-3">Автор</th>
                <th className="p-3">Категория</th>
                <th className="p-3">Статус</th>
                <th className="p-3">Статистика</th>
                <th className="p-3">Действия</th>
              </tr>
            </thead>
            <tbody>
              {list.data?.data.map((item) => (
                <tr key={item.id} className="border-b border-border/50">
                  <td className="p-3">
                    {item.coverImage ? (
                      <Image
                        src={item.coverImage}
                        alt=""
                        width={60}
                        height={40}
                        className="rounded object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1 font-medium text-white">
                      {item.isPinned ? <Pin className="h-3.5 w-3.5 text-primary" /> : null}
                      {item.isFeatured ? <Star className="h-3.5 w-3.5 text-primary" /> : null}
                      {item.title}
                    </div>
                    <div className="text-xs text-muted-foreground">/{item.slug}</div>
                  </td>
                  <td className="p-3">{item.author.username}</td>
                  <td className="p-3">
                    <NewsCategoryBadge category={item.category} />
                  </td>
                  <td className="p-3">{NEWS_STATUS_LABELS[item.status]}</td>
                  <td className="p-3 text-xs text-muted-foreground">
                    👁 {item.viewsCount} · ❤ {item.likesCount} · 💬 {item.commentsCount}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/admin/news/${item.id}/edit`}>Редактировать</Link>
                      </Button>
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/news/${item.slug}`} target="_blank">
                          Просмотр
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          pin.mutate(
                            { id: item.id, pinned: !item.isPinned },
                            {
                              onSuccess: () =>
                                toast.success(item.isPinned ? 'Откреплено' : 'Закреплено'),
                            },
                          )
                        }
                      >
                        {item.isPinned ? 'Открепить' : 'Закрепить'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          feature.mutate(
                            { id: item.id, featured: !item.isFeatured },
                            {
                              onSuccess: () =>
                                toast.success(
                                  item.isFeatured ? 'Убрано из топа' : 'Добавлено в топ',
                                ),
                            },
                          )
                        }
                      >
                        Featured
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          remove.mutate(item.id, {
                            onSuccess: () => toast.success('Новость в архиве'),
                          })
                        }
                      >
                        В архив
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {list.data && list.data.pagination.totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            disabled={!list.data.pagination.hasPrev}
            onClick={() => setPage((p) => p - 1)}
          >
            Назад
          </Button>
          <span className="text-sm text-muted-foreground">
            {list.data.pagination.page} / {list.data.pagination.totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={!list.data.pagination.hasNext}
            onClick={() => setPage((p) => p + 1)}
          >
            Далее
          </Button>
        </div>
      ) : null}
    </div>
  );
}
