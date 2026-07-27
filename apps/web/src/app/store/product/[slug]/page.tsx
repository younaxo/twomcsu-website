'use client';

import { Gift, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { GiftDialog } from '@/components/store/GiftDialog';
import { PriceDisplay } from '@/components/store/PriceDisplay';
import { ProductVariantSelector } from '@/components/store/ProductVariantSelector';
import { QuantitySelector } from '@/components/store/QuantitySelector';
import { WishlistButton } from '@/components/store/WishlistButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useAddToCart, useProduct, useProducts } from '@/hooks/store';
import { extractErrorMessage } from '@/lib/api';
import { PRODUCT_TYPE_LABELS } from '@/lib/store';
import { resolveMediaUrl } from '@/lib/profile';
import { useStoreUiStore } from '@/stores/storeUiStore';

export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { isAuthenticated } = useAuth();
  const productQuery = useProduct(slug);
  const product = productQuery.data;
  const addToCart = useAddToCart();
  const openCartDrawer = useStoreUiStore((s) => s.openCartDrawer);

  const variants = useMemo(
    () => (product?.variants ?? []).filter((v) => v.isActive).sort((a, b) => a.order - b.order),
    [product],
  );
  const [variantId, setVariantId] = useState<string>('');
  const selectedVariantId = variantId || variants[0]?.id || '';
  const selected = variants.find((v) => v.id === selectedVariantId) ?? variants[0];
  const [qty, setQty] = useState(1);
  const [giftOpen, setGiftOpen] = useState(false);
  const [imageIdx, setImageIdx] = useState(0);

  const related = useProducts({
    category: product?.category?.slug,
    limit: 4,
    enabled: Boolean(product?.category?.slug),
  });

  const images = product
    ? [product.image, ...product.images].filter(Boolean).map((src) => resolveMediaUrl(src)!)
    : [];
  const mainImage = images[imageIdx] ?? images[0];

  const add = async (gift?: { giftToUserId: string; giftMessage: string }) => {
    if (!isAuthenticated) {
      toast.error('Войдите, чтобы добавить в корзину');
      return;
    }
    if (!product) return;

    try {
      await addToCart.mutateAsync({
        productId: product.id,
        variantId: selected?.id,
        quantity: qty,
        giftToUserId: gift?.giftToUserId,
        giftMessage: gift?.giftMessage,
      });
      toast.success(gift ? 'Подарок добавлен в корзину' : 'Добавлено в корзину');
      openCartDrawer();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось добавить в корзину'));
    }
  };

  if (productQuery.isLoading) {
    return <Skeleton className="h-[32rem] w-full" />;
  }

  if (!product) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-muted-foreground">Товар не найден</p>
        <Button asChild>
          <Link href="/store">В магазин</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-secondary/40">
            {mainImage ? (
              <Image src={mainImage} alt={product.name} fill className="object-cover" unoptimized />
            ) : (
              <div
                className="flex h-full items-center justify-center text-6xl font-semibold text-white/20"
                style={product.position ? { color: `${product.position.color}55` } : undefined}
              >
                {product.name.slice(0, 1)}
              </div>
            )}
          </div>
          {images.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border ${
                    i === imageIdx ? 'border-primary' : 'border-border'
                  }`}
                  onClick={() => setImageIdx(i)}
                >
                  <Image src={src} alt="" fill className="object-cover" unoptimized />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{PRODUCT_TYPE_LABELS[product.type]}</Badge>
              {product.isNew ? <Badge>Новинка</Badge> : null}
              {product.isPopular ? <Badge variant="outline">Популярный</Badge> : null}
            </div>
            <h1 className="text-3xl font-semibold text-white">{product.name}</h1>
            {product.description ? (
              <p className="text-muted-foreground">{product.description}</p>
            ) : null}
          </div>

          {variants.length > 1 ? (
            <ProductVariantSelector
              variants={variants}
              value={selectedVariantId}
              onChange={setVariantId}
            />
          ) : null}

          {selected ? (
            <PriceDisplay price={selected.price} oldPrice={selected.oldPrice} size="lg" />
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <QuantitySelector
              value={qty}
              max={product.maxPerPurchase}
              onChange={setQty}
            />
            <Button disabled={addToCart.isPending} onClick={() => void add()}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              В корзину
            </Button>
            <WishlistButton productId={product.id} inWishlist={product.inWishlist} size="default" />
            {product.isGiftable && !product.isSelfOnly ? (
              <Button variant="secondary" onClick={() => setGiftOpen(true)}>
                <Gift className="mr-2 h-4 w-4" />
                Подарить
              </Button>
            ) : null}
          </div>

          {product.fullDescription ? (
            <div className="prose prose-invert max-w-none rounded-xl border border-border bg-card/50 p-4 text-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{product.fullDescription}</ReactMarkdown>
            </div>
          ) : null}
        </div>
      </div>

      {(related.data?.items.filter((p) => p.id !== product.id).length ?? 0) > 0 ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Похожие товары</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {related.data!.items
              .filter((p) => p.id !== product.id)
              .slice(0, 4)
              .map((p) => (
                <Link
                  key={p.id}
                  href={`/store/product/${p.slug}`}
                  className="rounded-xl border border-border bg-card/50 p-3 text-sm hover:bg-accent"
                >
                  {p.name}
                </Link>
              ))}
          </div>
        </section>
      ) : null}

      <GiftDialog
        open={giftOpen}
        onOpenChange={setGiftOpen}
        onConfirm={async (payload) => {
          await add(payload);
        }}
      />
    </div>
  );
}
