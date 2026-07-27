'use client';

import type { CartItem } from '@twomc/shared';
import { Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CartDrawer } from '@/components/store/CartDrawer';
import { PriceDisplay } from '@/components/store/PriceDisplay';
import { PromoCodeInput } from '@/components/store/PromoCodeInput';
import { QuantitySelector } from '@/components/store/QuantitySelector';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import {
  useCart,
  useClearCart,
  useRemoveFromCart,
  useUpdateCartItem,
} from '@/hooks/store';
import { extractErrorMessage } from '@/lib/api';
import { formatPrice } from '@/lib/store';
import { resolveMediaUrl } from '@/lib/profile';

function title(item: CartItem) {
  return item.bundle?.name ?? item.product?.name ?? 'Товар';
}

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const cart = useCart(isAuthenticated);
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveFromCart();
  const clearCart = useClearCart();

  if (authLoading) return <Skeleton className="h-64 w-full" />;

  if (!isAuthenticated) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-muted-foreground">Войдите, чтобы увидеть корзину</p>
        <Button asChild>
          <Link href="/login">Войти</Link>
        </Button>
      </div>
    );
  }

  const items = cart.data?.items ?? [];
  const totals = cart.data?.totals;

  return (
    <div className="space-y-6">
      <CartDrawer />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Корзина</h1>
          <p className="text-sm text-muted-foreground">{items.length} позиций</p>
        </div>
        {items.length > 0 ? (
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await clearCart.mutateAsync();
                toast.success('Корзина очищена');
              } catch (error) {
                toast.error(extractErrorMessage(error));
              }
            }}
          >
            Очистить
          </Button>
        ) : null}
      </div>

      {cart.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <p className="mb-4 text-muted-foreground">Корзина пуста</p>
          <Button asChild>
            <Link href="/store">В магазин</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-3">
            {items.map((item) => {
              const img = resolveMediaUrl(item.bundle?.image ?? item.product?.image);
              return (
                <div
                  key={item.id}
                  className="flex gap-4 rounded-xl border border-border bg-card/50 p-4"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-secondary">
                    {img ? (
                      <Image src={img} alt="" fill className="object-cover" unoptimized />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-white">{title(item)}</p>
                        {item.giftToUsername ? (
                          <p className="text-xs text-primary">Подарок → {item.giftToUsername}</p>
                        ) : null}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                          try {
                            await removeItem.mutateAsync(item.id);
                          } catch (error) {
                            toast.error(extractErrorMessage(error));
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <QuantitySelector
                        value={item.quantity}
                        max={item.product?.maxPerPurchase}
                        onChange={async (q) => {
                          try {
                            await updateItem.mutateAsync({ id: item.id, quantity: q });
                          } catch (error) {
                            toast.error(extractErrorMessage(error));
                          }
                        }}
                      />
                      <PriceDisplay price={item.lineTotal} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <aside className="h-fit space-y-4 rounded-xl border border-border bg-card p-4">
            <PromoCodeInput appliedCode={cart.data?.promoCode} />
            {totals ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Подытог</span>
                  <span>{formatPrice(totals.subtotal)}</span>
                </div>
                {totals.discounts.map((d) => (
                  <div key={d.label} className="flex justify-between text-primary">
                    <span>{d.label}</span>
                    <span>−{formatPrice(d.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-white">
                  <span>Итого</span>
                  <span>{formatPrice(totals.total)}</span>
                </div>
              </div>
            ) : null}
            <Button className="w-full" onClick={() => router.push('/store/checkout')}>
              Оформить заказ
            </Button>
          </aside>
        </div>
      )}
    </div>
  );
}
