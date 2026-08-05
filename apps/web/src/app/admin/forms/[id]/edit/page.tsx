'use client';

import { useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { FormBuilder } from '@/components/forms/FormBuilder';
import { useAdminForm } from '@/hooks/forms';

export default function AdminFormEditPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const { data, isLoading } = useAdminForm(id);

  if (isLoading || !data) {
    return <Skeleton className="h-96 w-full" />;
  }

  return <FormBuilder initial={data} />;
}
