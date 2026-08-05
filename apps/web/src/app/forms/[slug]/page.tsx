'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FormRenderer } from '@/components/forms/FormRenderer';
import { useForm } from '@/hooks/forms';

export default function FormFillPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? '';
  const { data, isLoading, isError } = useForm(slug);

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl glass-strong p-8 text-center">
        <h1 className="text-xl font-semibold text-white">Форма не найдена</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Возможно, она была удалена или у вас нет доступа.
        </p>
        <div className="mt-6">
          <Button asChild variant="secondary">
            <Link href="/forms">К списку форм</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <FormRenderer form={data} />;
}
