'use client';

import type { StoreProduct } from '@twomc/shared';
import { ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { BulkDiscountBadge } from '@/components/store/BulkDiscountBadge';
import { PriceDisplay } from '@/components/store/PriceDisplay';
import { WishlistButton } from '@/components/store/WishlistButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { useAddToCart } from '@/hooks/store';
import { extractErrorMessage } from '@/lib/api';
import { KEY_BULK_FALLBACK } from '@/lib/store';
import { resolveMediaUrl } from '@/lib/profile';
import { cn } from '@/lib/utils';
import { useStoreUiStore } from '@/stores/storeUiStore';

interface ProductCardProps {
  product: StoreProduct;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { isAuthenticated } = useAuth();
  const addToCart = useAddToCart();
  const openCartDrawer = useStoreUiStore((s) => s.openCartDrawer);

  const variant = product.variants.find((v) => v.isActive) ?? product.variants[0];
  const accent = product.position?.color;
  const imageUrl = resolveMediaUrl(product.image);

  const add = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Войдите, чтобы добавить в корзину');
      return;
    }

    try {
      await addToCart.mutateAsync({
        productId: product.id,
        variantId: variant?.id,
        quantity: 1,
      });
      toast.success('Добавлено в корзину');
      openCartDrawer();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось добавить в корзину'));
    }
  };

  return (
    <Link
      href={`/store/product/${product.slug}`}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md transition-colors hover:bg-white/10',
        className,
      )}
      style={accent ? { borderColor: `${accent}40` } : undefined}
    >
      <div className="relative aspect-square bg-secondary/50">
        {imageUrl ? (
          <Image src={imageUrl} alt={product.name} fill className="object-cover" unoptimized />
        ) : (
          <div
            className="flex h-full items-center justify-center text-3xl font-semibold text-white/30"
            style={accent ? { color: `${accent}66` } : undefined}
          >
            {product.name.slice(0, 1)}
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {product.isNew ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge className="bg-sky-500/90 hover:bg-sky-500">NEW</Badge>
              </TooltipTrigger>
              <TooltipContent>Новинка</TooltipContent>
            </Tooltip>
          ) : null}
          {product.isPopular ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge className="bg-amber-500/90 hover:bg-amber-500">HOT</Badge>
              </TooltipTrigger>
              <TooltipContent>Популярный</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
        <div className="absolute right-2 top-2">
          <WishlistButton productId={product.id} inWishlist={product.inWishlist} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div>
          <h3 className="line-clamp-1 font-medium text-white">{product.name}</h3>
          {product.description ? (
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
              {product.description}
            </p>
          ) : null}
        </div>

        {product.type === 'KEY' ? (
          <BulkDiscountBadge
            label={`от ${KEY_BULK_FALLBACK[0].minQuantity} шт −${KEY_BULK_FALLBACK[0].discountPercent}%`}
            tip="Оптовая скидка при покупке ключей"
          />
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          {variant ? (
            <PriceDisplay price={variant.price} oldPrice={variant.oldPrice} size="sm" />
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                className="h-8 w-8 shrink-0"
                disabled={addToCart.isPending}
                onClick={(e) => void add(e)}
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Добавить в корзину</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </Link>
  );
}
