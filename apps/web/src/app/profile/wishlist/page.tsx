'use client';

import { Heart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/EmptyState';
import { PriceDisplay } from '@/components/store/PriceDisplay';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import {
  useAddToCart,
  useRemoveFromWishlist,
  useUpdateWishlist,
  useWishlist,
} from '@/hooks/store';
import { extractErrorMessage } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/profile';
import { useStoreUiStore } from '@/stores/storeUiStore';

export default function WishlistPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const wishlist = useWishlist(isAuthenticated);
  const updateVisibility = useUpdateWishlist();
  const remove = useRemoveFromWishlist();
  const addToCart = useAddToCart();
  const openCartDrawer = useStoreUiStore((s) => s.openCartDrawer);

  if (authLoading) return <Skeleton className="h-64 w-full" />;

  if (!isAuthenticated) {
    return (
      <EmptyState
        icon={Heart}
        title="Вишлист"
        description="Войдите, чтобы увидеть вишлист"
        action={
          <Button asChild>
            <Link href="/login">Войти</Link>
          </Button>
        }
      />
    );
  }

  const items = wishlist.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Вишлист</h1>
          <p className="text-sm text-muted-foreground">Товары, которые вы хотите</p>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="wishlist-public"
            checked={wishlist.data?.isPublic ?? true}
            disabled={updateVisibility.isPending || !wishlist.data}
            onCheckedChange={async (checked) => {
              try {
                await updateVisibility.mutateAsync({ isPublic: checked });
                toast.success(checked ? 'Вишлист открыт в профиле' : 'Вишлист скрыт');
              } catch (error) {
                toast.error(extractErrorMessage(error));
              }
            }}
          />
          <Label htmlFor="wishlist-public" className="text-sm">
            Показывать в профиле
          </Label>
        </div>
      </div>

      {wishlist.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Список пуст"
          description="Добавляйте товары из магазина в вишлист"
          action={
            <Button asChild>
              <Link href="/store">В магазин</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const product = item.product;
            const variant = product.variants.find((v) => v.isActive) ?? product.variants[0];
            const img = resolveMediaUrl(product.image);
            return (
              <div
                key={item.id}
                className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card/50 p-3"
              >
                <Link
                  href={`/store/product/${product.slug}`}
                  className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-secondary"
                >
                  {img ? (
                    <Image src={img} alt="" fill className="object-cover" unoptimized />
                  ) : null}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/store/product/${product.slug}`}
                    className="font-medium text-white hover:underline"
                  >
                    {product.name}
                  </Link>
                  {variant ? (
                    <PriceDisplay
                      price={variant.price}
                      oldPrice={variant.oldPrice}
                      size="sm"
                      className="mt-1"
                    />
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={addToCart.isPending}
                    onClick={async () => {
                      try {
                        await addToCart.mutateAsync({
                          productId: product.id,
                          variantId: variant?.id,
                          quantity: 1,
                        });
                        toast.success('Добавлено в корзину');
                        openCartDrawer();
                      } catch (error) {
                        toast.error(extractErrorMessage(error));
                      }
                    }}
                  >
                    В корзину
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={remove.isPending}
                    onClick={async () => {
                      try {
                        await remove.mutateAsync(product.id);
                        toast.success('Удалено');
                      } catch (error) {
                        toast.error(extractErrorMessage(error));
                      }
                    }}
                  >
                    Удалить
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
