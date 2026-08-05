'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FormStats } from '@/components/forms/FormStats';
import { useAdminForm, useFormStats } from '@/hooks/forms';

export default function AdminFormStatsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const form = useAdminForm(id);
  const stats = useFormStats(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            Статистика {form.data ? `— ${form.data.title}` : ''}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary">
            <Link href={`/admin/forms/${id}/responses`}>Ответы</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href={`/admin/forms/${id}/edit`}>Редактировать</Link>
          </Button>
        </div>
      </div>

      {stats.isLoading || !stats.data ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <FormStats stats={stats.data} />
      )}
    </div>
  );
}
