'use client';

import type { StoreBundle } from '@twomc/shared';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { PriceDisplay } from '@/components/store/PriceDisplay';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useAddToCart } from '@/hooks/store';
import { extractErrorMessage } from '@/lib/api';
import { discountPercent } from '@/lib/store';
import { resolveMediaUrl } from '@/lib/profile';
import { cn } from '@/lib/utils';
import { useStoreUiStore } from '@/stores/storeUiStore';

interface BundleCardProps {
  bundle: StoreBundle;
  className?: string;
}

export function BundleCard({ bundle, className }: BundleCardProps) {
  const { isAuthenticated } = useAuth();
  const addToCart = useAddToCart();
  const openCartDrawer = useStoreUiStore((s) => s.openCartDrawer);
  const imageUrl = resolveMediaUrl(bundle.image);
  const discount = discountPercent(bundle.totalPrice, bundle.originalPrice);

  const buy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Войдите, чтобы купить набор');
      return;
    }

    try {
      await addToCart.mutateAsync({ bundleId: bundle.id, quantity: 1 });
      toast.success('Набор добавлен в корзину');
      openCartDrawer();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось добавить набор'));
    }
  };

  return (
    <Link
      href={`/store/bundle/${bundle.slug}`}
      className={cn(
        'flex flex-col overflow-hidden rounded-xl glass-medium transition-colors duration-200 hover:bg-white/10',
        className,
      )}
    >
      <div className="relative aspect-video bg-secondary/50">
        {imageUrl ? (
          <Image src={imageUrl} alt={bundle.name} fill className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Набор
          </div>
        )}
        {discount ? (
          <span className="absolute right-2 top-2 rounded-md bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
            −{discount}%
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-medium text-white">{bundle.name}</h3>
        {bundle.description ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{bundle.description}</p>
        ) : null}
        <p className="text-xs text-muted-foreground">{bundle.items.length} товаров в наборе</p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <PriceDisplay
            price={bundle.totalPrice}
            oldPrice={bundle.originalPrice}
            size="sm"
          />
          <Button
            type="button"
            size="sm"
            disabled={addToCart.isPending}
            onClick={(e) => void buy(e)}
          >
            В корзину
          </Button>
        </div>
      </div>
    </Link>
  );
}
