'use client';

import { ACTIVITY_TYPE_LABELS, ActivityType } from '@twomc/shared';
import { useState } from 'react';
import { toast } from 'sonner';
import { AdminEmptyState, AdminPageHeader } from '@/components/admin';
import { ActivityCardCompact } from '@/components/activity/ActivityCardCompact';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAdminActivityList,
  useHideActivity,
} from '@/hooks/activity';

export default function AdminActivityManagePage() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState<string>('all');
  const [username, setUsername] = useState('');
  const [hidden, setHidden] = useState<string>('visible');

  const filters = {
    page,
    limit: 20,
    ...(type !== 'all' ? { type } : {}),
    ...(username.trim() ? { username: username.trim() } : {}),
    ...(hidden === 'hidden' ? { isHidden: true } : hidden === 'visible' ? { isHidden: false } : {}),
  };

  const list = useAdminActivityList(filters);
  const hide = useHideActivity();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Модерация активности"
        description="Скрытие и просмотр событий ленты"
      />

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Ник игрока"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        <Select
          value={type}
          onValueChange={(v) => {
            setType(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Тип" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все типы</SelectItem>
            {Object.values(ActivityType).map((t) => (
              <SelectItem key={t} value={t}>
                {ACTIVITY_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={hidden}
          onValueChange={(v) => {
            setHidden(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="visible">Видимые</SelectItem>
            <SelectItem value="hidden">Скрытые</SelectItem>
            <SelectItem value="all">Все</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {list.isLoading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : !list.data?.data.length ? (
        <AdminEmptyState title="Нет активностей" description="Попробуйте изменить фильтры" />
      ) : (
        <div className="space-y-3">
          {list.data.data.map((item) => (
            <div key={item.id} className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <ActivityCardCompact activity={item} />
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  void hide.mutateAsync({ id: item.id, reason: 'Модерация' }).then(
                    () => toast.success('Скрыто'),
                    () => toast.error('Ошибка'),
                  );
                }}
              >
                Скрыть
              </Button>
            </div>
          ))}
        </div>
      )}

      {list.data && list.data.pagination.totalPages > 1 ? (
        <div className="flex justify-center gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Назад
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={page >= list.data.pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Далее
          </Button>
        </div>
      ) : null}
    </div>
  );
}
