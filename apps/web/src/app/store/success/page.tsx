'use client';

import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

function SuccessContent() {
  const params = useSearchParams();
  const orderId = params.get('orderId');
  const orderNumber = params.get('orderNumber');
  const mock = params.get('mock') === 'true';

  return (
    <div className="mx-auto max-w-md space-y-6 text-center">
      <div className="flex justify-center">
        <CheckCircle2 className="h-16 w-16 text-primary" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-white">Спасибо за покупку!</h1>
        <p className="text-muted-foreground">
          {mock
            ? 'Заказ создан. Оплата пока в тестовом режиме.'
            : 'Заказ принят. Товары будут выданы после оплаты.'}
        </p>
        {orderNumber || orderId ? (
          <p className="text-sm text-muted-foreground">
            Номер: <span className="font-mono text-white">{orderNumber ?? orderId}</span>
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link href="/profile/orders">Мои заказы</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/store">В магазин</Link>
        </Button>
        {orderId && mock ? (
          <Button variant="outline" asChild>
            <Link href={`/store/mock-payment?orderId=${encodeURIComponent(orderId)}`}>
              Тестовая оплата
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default function StoreSuccessPage() {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-48 max-w-md" />}>
      <SuccessContent />
    </Suspense>
  );
}
