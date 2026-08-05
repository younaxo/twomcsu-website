'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponseDetail } from '@/components/forms/ResponseDetail';
import { useFormResponse } from '@/hooks/forms';

export default function AdminFormResponsePage() {
  const params = useParams<{ id: string; responseId: string }>();
  const id = params?.id ?? '';
  const responseId = params?.responseId ?? '';
  const { data, isLoading, isError } = useFormResponse(id, responseId);

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl glass-strong p-8 text-center text-muted-foreground">
        Ответ не найден
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Ответ</h1>
        <Button asChild variant="secondary">
          <Link href={`/admin/forms/${id}/responses`}>Назад</Link>
        </Button>
      </div>
      <ResponseDetail response={data} />
    </div>
  );
}
