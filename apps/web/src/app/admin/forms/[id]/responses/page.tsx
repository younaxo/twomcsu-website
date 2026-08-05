'use client';

import { Download } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ExportDialog } from '@/components/forms/ExportDialog';
import { ResponsesTable } from '@/components/forms/ResponsesTable';
import { extractErrorMessage } from '@/lib/api';
import { useAdminForm, useDeleteResponse, useFormResponses } from '@/hooks/forms';

export default function AdminFormResponsesPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const [page, setPage] = useState(1);
  const [exportOpen, setExportOpen] = useState(false);

  const form = useAdminForm(id);
  const list = useFormResponses(id, { page, limit: 20 });
  const remove = useDeleteResponse(id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            Ответы {form.data ? `— ${form.data.title}` : ''}
          </h1>
          <Link
            href={`/admin/forms/${id}/edit`}
            className="text-xs text-primary underline-offset-2 hover:underline"
          >
            К редактору формы
          </Link>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary">
            <Link href={`/admin/forms/${id}/stats`}>Статистика</Link>
          </Button>
          <Button onClick={() => setExportOpen(true)}>
            <Download className="mr-1 h-4 w-4" /> Экспорт
          </Button>
        </div>
      </div>

      {list.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <ResponsesTable
          formId={id}
          responses={list.data?.data ?? []}
          deleting={remove.isPending}
          onDelete={async (responseId) => {
            try {
              await remove.mutateAsync(responseId);
              toast.success('Ответ удалён');
            } catch (error) {
              toast.error(extractErrorMessage(error, 'Не удалось удалить'));
            }
          }}
        />
      )}

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

      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} formId={id} />
    </div>
  );
}
