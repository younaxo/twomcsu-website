'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { CartDrawer } from '@/components/store/CartDrawer';
import { PaymentPendingModal } from '@/components/store/PaymentPendingModal';
import { PromoCodeInput } from '@/components/store/PromoCodeInput';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useCart, useCreateOrder } from '@/hooks/store';
import { extractErrorMessage } from '@/lib/api';
import { formatPrice } from '@/lib/store';

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const cart = useCart(isAuthenticated);
  const createOrder = useCreateOrder();
  const [agree, setAgree] = useState(false);
  const [pendingOpen, setPendingOpen] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  if (authLoading) return <Skeleton className="h-64 w-full" />;

  if (!isAuthenticated) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-muted-foreground">Войдите для оформления заказа</p>
        <Button asChild>
          <Link href="/login">Войти</Link>
        </Button>
      </div>
    );
  }

  const items = cart.data?.items ?? [];
  const totals = cart.data?.totals;

  const pay = async () => {
    if (!agree) {
      toast.error('Подтвердите согласие с офертой');
      return;
    }
    if (items.length === 0) {
      toast.error('Корзина пуста');
      return;
    }

    try {
      const order = await createOrder.mutateAsync({
        promoCode: cart.data?.promoCode ?? undefined,
      });
      setPaymentUrl(order.paymentUrl);
      setPendingOpen(true);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось создать заказ'));
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <CartDrawer />

      <div>
        <h1 className="text-2xl font-semibold text-white">Оформление заказа</h1>
        <p className="text-sm text-muted-foreground">Проверьте данные перед оплатой</p>
      </div>

      {cart.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center">
          <p className="mb-4 text-muted-foreground">Корзина пуста</p>
          <Button asChild>
            <Link href="/store">В магазин</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground">Покупатель</p>
            <p className="font-medium text-white">{user?.username}</p>
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">Товары ({items.length})</p>
            <ul className="space-y-1 text-sm">
              {items.map((item) => (
                <li key={item.id} className="flex justify-between gap-2">
                  <span className="truncate">
                    {item.bundle?.name ?? item.product?.name} ×{item.quantity}
                  </span>
                  <span>{formatPrice(item.lineTotal)}</span>
                </li>
              ))}
            </ul>
          </div>

          <PromoCodeInput appliedCode={cart.data?.promoCode} />

          <div className="space-y-2 border-t border-border pt-4">
            <p className="text-sm font-medium">Способ оплаты</p>
            <div className="rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
              UnitPay — скоро
            </div>
          </div>

          {totals ? (
            <div className="flex justify-between text-lg font-semibold text-white">
              <span>К оплате</span>
              <span>{formatPrice(totals.total)}</span>
            </div>
          ) : null}

          <div className="flex items-start gap-2">
            <Checkbox
              id="offer"
              checked={agree}
              onCheckedChange={(v) => setAgree(v === true)}
            />
            <Label htmlFor="offer" className="text-sm font-normal leading-snug text-muted-foreground">
              Согласен с условиями оферты и правилами магазина
            </Label>
          </div>

          <Button
            className="w-full"
            disabled={createOrder.isPending || !agree}
            onClick={() => void pay()}
          >
            Оплатить
          </Button>
        </div>
      )}

      <PaymentPendingModal
        open={pendingOpen}
        onOpenChange={setPendingOpen}
        onContinue={() => {
          if (paymentUrl) {
            router.push(paymentUrl);
          } else {
            router.push('/profile/orders');
          }
        }}
      />
    </div>
  );
}
