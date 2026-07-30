'use client';

import { Archive, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/EmptyState';
import { ReportCard } from '@/components/reports/ReportCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useArchivedReports, useUnarchiveReport } from '@/hooks/reports/useReports';
import { extractErrorMessage } from '@/lib/api';
import { RoleGroup, hasRoleGroup } from '@twomc/shared';

export default function ArchivedReportsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const list = useArchivedReports(
    { page, limit: 20, search: search.trim() || undefined },
    isAuthenticated && Boolean(user && hasRoleGroup(user.roleGroup, RoleGroup.ADMIN)),
  );
  const unarchive = useUnarchiveReport();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (!authLoading && user && !hasRoleGroup(user.roleGroup, RoleGroup.ADMIN)) {
      router.replace('/');
    }
  }, [authLoading, isAuthenticated, user, router]);

  if (authLoading || !user) {
    return <Skeleton className="mx-auto h-96 max-w-5xl rounded-2xl" />;
  }

  const items = list.data?.items ?? [];
  const totalPages = list.data?.totalPages ?? 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Архив обращений</h1>
          <p className="text-sm text-muted-foreground">Только для администраторов</p>
        </div>
        <Button variant="secondary" asChild>
          <Link href="/moderation/reports">К очереди</Link>
        </Button>
      </header>

      <Input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        placeholder="Поиск по номеру..."
      />

      {list.isLoading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Archive}
          title="Архив пуст"
          description="Архивированные обращения появятся здесь"
          className="glass-medium border-white/10"
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="space-y-2">
              <ReportCard report={item} href={`/report/${item.reportNumber}`} />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={unarchive.isPending}
                  onClick={() =>
                    void unarchive
                      .mutateAsync(item.reportNumber)
                      .then(() => toast.success('Обращение восстановлено'))
                      .catch((error) => toast.error(extractErrorMessage(error)))
                  }
                >
                  Разархивировать
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Назад
          </Button>
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            {list.isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {page} / {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Далее
          </Button>
        </div>
      ) : null}
    </div>
  );
}
