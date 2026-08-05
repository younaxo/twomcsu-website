'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FormRenderer } from '@/components/forms/FormRenderer';
import { useFormInvite } from '@/hooks/forms';

export default function FormByInvitePage() {
  const params = useParams<{ code: string }>();
  const code = params?.code ?? '';
  const { data, isLoading, isError } = useFormInvite(code);

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl glass-strong p-8 text-center">
        <h1 className="text-xl font-semibold text-white">Приглашение недействительно</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Код мог быть отозван или срок его действия истёк.
        </p>
        <div className="mt-6">
          <Button asChild variant="secondary">
            <Link href="/forms">К списку форм</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <FormRenderer form={data} inviteCode={code} />;
}
