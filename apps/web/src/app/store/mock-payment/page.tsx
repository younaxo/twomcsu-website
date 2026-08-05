'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useSimulatePayment } from '@/hooks/store';
import { extractErrorMessage } from '@/lib/api';

function MockPaymentContent() {
  const params = useSearchParams();
  const orderId = params.get('orderId');
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const simulate = useSimulatePayment();

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  if (!isAuthenticated) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-muted-foreground">Войдите для тестовой оплаты</p>
        <Button asChild>
          <Link href="/login">Войти</Link>
        </Button>
      </div>
    );
  }

  const complete = async () => {
    if (!orderId) {
      toast.error('Не указан заказ');
      return;
    }

    try {
      const order = await simulate.mutateAsync(orderId);
      toast.success('Оплата симулирована');
      router.push(`/profile/orders/${encodeURIComponent(order.orderNumber)}`);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось симулировать оплату'));
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 text-center">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-widest text-primary">Dev</p>
        <h1 className="text-2xl font-semibold text-white">Оплата в разработке</h1>
        <p className="text-sm text-muted-foreground">
          Скоро подключим UnitPay, СБП и другие способы. Пока можно симулировать успешную оплату
          для теста выдачи.
        </p>
        {orderId ? (
          <p className="font-mono text-xs text-muted-foreground">{orderId}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Button disabled={!orderId || simulate.isPending} onClick={() => void complete()}>
          Симулировать успешную оплату
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/profile/orders">К заказам</Link>
        </Button>
      </div>
    </div>
  );
}

export default function MockPaymentPage() {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-64 max-w-md" />}>
      <MockPaymentContent />
    </Suspense>
  );
}
