'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useOrder } from '@/hooks/store';
import { formatPrice, ORDER_STATUS_LABELS } from '@/lib/store';
import { resolveMediaUrl } from '@/lib/profile';

export default function OrderDetailPage() {
  const params = useParams<{ orderNumber: string }>();
  const orderNumber = decodeURIComponent(params.orderNumber);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const orderQuery = useOrder(orderNumber, isAuthenticated);
  const order = orderQuery.data;

  if (authLoading || orderQuery.isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-muted-foreground">Войдите, чтобы увидеть заказ</p>
        <Button asChild>
          <Link href="/login">Войти</Link>
        </Button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-muted-foreground">Заказ не найден</p>
        <Button asChild>
          <Link href="/profile/orders">К заказам</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-mono text-2xl font-semibold text-white">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(order.createdAt), 'dd MMMM yyyy, HH:mm', { locale: ru })}
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {ORDER_STATUS_LABELS[order.status] ?? order.status}
        </Badge>
      </div>

      <div className="space-y-3">
        {order.items.map((item) => {
          const img = resolveMediaUrl(item.bundle?.image ?? item.product?.image);
          const name = item.bundle?.name ?? item.product?.name ?? 'Товар';
          return (
            <div
              key={item.id}
              className="flex gap-3 rounded-xl border border-border bg-card/50 p-3"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-secondary">
                {img ? (
                  <Image src={img} alt="" fill className="object-cover" unoptimized />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white">{name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatPrice(item.unitPrice)} × {item.quantity}
                  {item.giftToUserId ? ' · подарок' : ''}
                </p>
              </div>
              <p className="font-medium">{formatPrice(item.totalPrice)}</p>
            </div>
          );
        })}
      </div>

      <div className="space-y-1 rounded-xl border border-border bg-card p-4 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Подытог</span>
          <span>{formatPrice(order.subtotal)}</span>
        </div>
        {order.discountAmount > 0 ? (
          <div className="flex justify-between text-primary">
            <span>Скидка{order.promoCode ? ` (${order.promoCode})` : ''}</span>
            <span>−{formatPrice(order.discountAmount)}</span>
          </div>
        ) : null}
        <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-white">
          <span>Итого</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild>
          <Link href="/profile/orders">Назад</Link>
        </Button>
        <Button
          variant="secondary"
          onClick={() => toast.info('Скачивание чека появится позже')}
        >
          Скачать чек
        </Button>
        {order.status === 'PENDING' ? (
          <Button asChild>
            <Link href={`/store/mock-payment?orderId=${encodeURIComponent(order.id)}`}>
              Оплатить
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
