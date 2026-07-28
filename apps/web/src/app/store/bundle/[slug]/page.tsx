'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { PriceDisplay } from '@/components/store/PriceDisplay';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { DisplayPrice, useAddToCart, useBundle } from '@/hooks/store';
import { extractErrorMessage } from '@/lib/api';
import { discountPercent } from '@/lib/store';
import { resolveMediaUrl } from '@/lib/profile';
import { useStoreUiStore } from '@/stores/storeUiStore';

export default function BundlePage() {
  const params = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const bundleQuery = useBundle(params.slug);
  const bundle = bundleQuery.data;
  const addToCart = useAddToCart();
  const openCartDrawer = useStoreUiStore((s) => s.openCartDrawer);

  const buy = async () => {
    if (!isAuthenticated) {
      toast.error('Войдите, чтобы купить набор');
      return;
    }
    if (!bundle) return;

    try {
      await addToCart.mutateAsync({ bundleId: bundle.id, quantity: 1 });
      toast.success('Набор добавлен в корзину');
      openCartDrawer();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось добавить набор'));
    }
  };

  if (bundleQuery.isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!bundle) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-muted-foreground">Набор не найден</p>
        <Button asChild>
          <Link href="/store">В магазин</Link>
        </Button>
      </div>
    );
  }

  const imageUrl = resolveMediaUrl(bundle.image);
  const discount = discountPercent(bundle.totalPrice, bundle.originalPrice);

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-secondary/40">
          {imageUrl ? (
            <Image src={imageUrl} alt={bundle.name} fill className="object-cover" unoptimized />
          ) : null}
          {discount ? (
            <span className="absolute right-3 top-3 rounded-md bg-primary px-2 py-1 text-sm font-semibold">
              −{discount}%
            </span>
          ) : null}
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-semibold text-white">{bundle.name}</h1>
          {bundle.description ? (
            <p className="text-muted-foreground">{bundle.description}</p>
          ) : null}
          <PriceDisplay
            price={bundle.totalPrice}
            oldPrice={bundle.originalPrice}
            size="lg"
          />
          <p className="text-sm text-muted-foreground">
            Экономия <DisplayPrice amount={bundle.originalPrice - bundle.totalPrice} />
          </p>
          <Button disabled={addToCart.isPending} onClick={() => void buy()}>
            Купить набор
          </Button>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Что входит</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {bundle.items.map((item) => (
            <Link
              key={item.id}
              href={`/store/product/${item.product.slug}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-card/50 p-3 hover:bg-accent"
            >
              <div className="relative h-12 w-12 overflow-hidden rounded-md bg-secondary">
                {resolveMediaUrl(item.product.image) ? (
                  <Image
                    src={resolveMediaUrl(item.product.image)!}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : null}
              </div>
              <div>
                <p className="font-medium text-white">{item.product.name}</p>
                <p className="text-xs text-muted-foreground">×{item.quantity}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
