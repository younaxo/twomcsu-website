'use client';

import type { CartItem } from '@twomc/shared';
import { Gift, ShoppingBag, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/EmptyState';
import { GiftDialog } from '@/components/store/GiftDialog';
import { PriceDisplay } from '@/components/store/PriceDisplay';
import { PromoCodeInput } from '@/components/store/PromoCodeInput';
import { QuantitySelector } from '@/components/store/QuantitySelector';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAddToCart,
  useCart,
  useClearCart,
  useRemoveFromCart,
  useUpdateCartItem,
} from '@/hooks/store';
import { extractErrorMessage } from '@/lib/api';
import { formatPrice } from '@/lib/store';
import { resolveMediaUrl } from '@/lib/profile';
import { useStoreUiStore } from '@/stores/storeUiStore';

function itemTitle(item: CartItem): string {
  if (item.bundle) return item.bundle.name;
  return item.product?.name ?? 'Товар';
}

function itemImage(item: CartItem): string | undefined {
  return resolveMediaUrl(item.bundle?.image ?? item.product?.image);
}

function hideQtyControls(item: CartItem): boolean {
  if (item.bundle) return false;
  const max = item.product?.maxPerPurchase;
  if (max === 1) return true;
  const type = item.product?.type;
  if (!type) return false;
  return [
    'PRIVILEGE',
    'DECORATION',
    'SUBSCRIPTION',
    'BADGE',
    'UNMUTE',
    'UNBAN',
    'BATTLE_PASS',
    'BATTLE_PASS_BOOSTER',
  ].includes(type);
}

export function CartDrawer() {
  const open = useStoreUiStore((s) => s.cartDrawerOpen);
  const setOpen = useStoreUiStore((s) => s.setCartDrawerOpen);
  const cart = useCart(open);
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveFromCart();
  const addItem = useAddToCart();
  const clearCart = useClearCart();
  const [giftItemId, setGiftItemId] = useState<string | null>(null);

  const items = cart.data?.items ?? [];
  const totals = cart.data?.totals;

  const changeQty = async (id: string, quantity: number) => {
    try {
      await updateItem.mutateAsync({ id, quantity });
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось изменить количество'));
    }
  };

  const remove = async (id: string) => {
    try {
      await removeItem.mutateAsync(id);
      toast.success('Удалено из корзины');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось удалить'));
    }
  };

  const clear = async () => {
    try {
      await clearCart.mutateAsync();
      toast.success('Корзина очищена');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось очистить корзину'));
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Корзина</DialogTitle>
          </DialogHeader>

          <div className="flex-1 space-y-4 overflow-y-auto py-4">
            {cart.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title="Ваша корзина пуста"
                description="Время за покупками!"
                action={
                  <Button asChild onClick={() => setOpen(false)}>
                    <Link href="/store">В магазин</Link>
                  </Button>
                }
                className="border-0 bg-transparent py-10"
              />
            ) : (
              items.map((item) => {
                const img = itemImage(item);
                return (
                  <div
                    key={item.id}
                    className="flex gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-secondary">
                      {img ? (
                        <Image
                          src={img}
                          alt=""
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">
                            {itemTitle(item)}
                          </p>
                          {item.giftToUsername ? (
                            <p className="text-xs text-primary">
                              Подарок → {item.giftToUsername}
                            </p>
                          ) : null}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => void remove(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <QuantitySelector
                          value={item.quantity}
                          max={item.product?.maxPerPurchase}
                          hideControls={hideQtyControls(item)}
                          onChange={(q) => void changeQty(item.id, q)}
                        />
                        <PriceDisplay price={item.lineTotal} size="sm" />
                      </div>
                      {item.product?.isGiftable !== false && !item.bundle ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => setGiftItemId(item.id)}
                        >
                          <Gift className="mr-1 h-3.5 w-3.5" />
                          Подарить
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {items.length > 0 ? (
            <DialogFooter className="flex-col gap-3 border-t border-border pt-4 sm:flex-col">
              <PromoCodeInput appliedCode={cart.data?.promoCode} />

              {totals ? (
                <div className="w-full space-y-1 text-sm">
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
                  <div className="flex justify-between text-base font-semibold text-white">
                    <span>Итого</span>
                    <span>{formatPrice(totals.total)}</span>
                  </div>
                </div>
              ) : null}

              <div className="flex w-full gap-2">
                <Button variant="outline" className="flex-1" onClick={() => void clear()}>
                  Очистить
                </Button>
                <Button className="flex-1" asChild onClick={() => setOpen(false)}>
                  <Link href="/store/checkout">Оформить</Link>
                </Button>
              </div>
              <Button variant="link" asChild className="h-auto p-0" onClick={() => setOpen(false)}>
                <Link href="/store/cart">Открыть корзину</Link>
              </Button>
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>

      <GiftDialog
        open={Boolean(giftItemId)}
        onOpenChange={(next) => {
          if (!next) setGiftItemId(null);
        }}
        onConfirm={async ({ giftToUserId, giftMessage }) => {
          const current = items.find((item) => item.id === giftItemId);
          if (!current?.product) return;

          await removeItem.mutateAsync(current.id);
          await addItem.mutateAsync({
            productId: current.product.id,
            variantId: current.variant?.id,
            quantity: current.quantity,
            giftToUserId,
            giftMessage: giftMessage || undefined,
          });
          toast.success('Подарок настроен');
          setGiftItemId(null);
        }}
      />
    </>
  );
}
