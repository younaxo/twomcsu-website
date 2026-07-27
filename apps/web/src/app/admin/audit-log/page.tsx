'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ScrollText } from 'lucide-react';
import { AdminEmptyState, AdminFilters, AdminPageHeader, AdminTable } from '@/components/admin';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';

type AuditItem = {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  createdAt: string;
  actor: { id: string; username: string };
};

export default function AdminAuditLogPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const list = useQuery({
    queryKey: ['admin', 'audit-log', search, page],
    queryFn: async () => {
      const { data } = await api.get<{
        items: AuditItem[];
        totalPages: number;
      }>('/admin/audit-log', {
        params: { page, limit: 50, q: search || undefined },
      });
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Audit log" description="История действий администрации" />
      <AdminFilters
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Поиск по действию, цели, нику…"
        onReset={() => {
          setSearch('');
          setPage(1);
        }}
      />
      {list.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <AdminTable
          columns={[
            {
              id: 'time',
              header: 'Время',
              cell: (row) =>
                format(new Date(row.createdAt), 'd MMM yyyy, HH:mm', { locale: ru }),
            },
            { id: 'actor', header: 'Кто', cell: (row) => row.actor.username },
            { id: 'action', header: 'Действие', cell: (row) => row.action },
            {
              id: 'target',
              header: 'Объект',
              cell: (row) =>
                row.targetType ? `${row.targetType}${row.targetId ? `:${row.targetId.slice(0, 8)}` : ''}` : '—',
            },
          ]}
          data={list.data?.items ?? []}
          rowKey={(r) => r.id}
          empty={
            <AdminEmptyState
              icon={ScrollText}
              title="Записей пока нет"
              description="Действия администраторов появятся здесь"
            />
          }
          page={page}
          totalPages={list.data?.totalPages ?? 1}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
