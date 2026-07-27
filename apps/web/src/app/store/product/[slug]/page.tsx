'use client';

import type { ProductType } from '@twomc/shared';
import { Gift, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { ProductCard } from '@/components/store/ProductCard';
import { GiftDialog } from '@/components/store/GiftDialog';
import { PriceDisplay } from '@/components/store/PriceDisplay';
import { ProductVariantSelector } from '@/components/store/ProductVariantSelector';
import { QuantitySelector } from '@/components/store/QuantitySelector';
import { WishlistButton } from '@/components/store/WishlistButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useAddToCart, useBoughtTogether, useProduct, useQuickBuy } from '@/hooks/store';
import { extractErrorMessage } from '@/lib/api';
import { PRODUCT_TYPE_LABELS } from '@/lib/store';
import { resolveMediaUrl } from '@/lib/profile';
import { useStoreUiStore } from '@/stores/storeUiStore';

const NO_QUICK_BUY: ProductType[] = [
  'DECORATION',
  'SUBSCRIPTION',
  'BADGE',
  'UNMUTE',
  'UNBAN',
  'BATTLE_PASS_BOOSTER',
];

function hideQty(type: ProductType, maxPerPurchase: number | null): boolean {
  if (maxPerPurchase === 1) return true;
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

export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { isAuthenticated } = useAuth();
  const productQuery = useProduct(slug);
  const product = productQuery.data;
  const addToCart = useAddToCart();
  const quickBuy = useQuickBuy();
  const openCartDrawer = useStoreUiStore((s) => s.openCartDrawer);
  const boughtTogether = useBoughtTogether(product?.id, Boolean(product?.id));

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
  const [nick, setNick] = useState('');

  const images = product
    ? [product.image, ...product.images].filter(Boolean).map((src) => resolveMediaUrl(src)!)
    : [];
  const mainImage = images[imageIdx] ?? images[0];
  const allowQuickBuy = product ? !NO_QUICK_BUY.includes(product.type) && product.type !== 'CURRENCY' : false;

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

  const doQuickBuy = async () => {
    if (!product || !nick.trim()) {
      toast.error('Укажите Minecraft ник');
      return;
    }
    try {
      const result = await quickBuy.mutateAsync({
        productId: product.id,
        variantId: selected?.id,
        quantity: qty,
        minecraftNick: nick.trim(),
      });
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
        return;
      }
      toast.success(result.message ?? 'Заказ создан');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось оформить быструю покупку'));
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
              hideControls={hideQty(product.type, product.maxPerPurchase)}
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

          {allowQuickBuy ? (
            <div className="space-y-3 rounded-xl border border-border bg-card/50 p-4">
              <p className="text-sm font-medium text-white">Быстрая покупка</p>
              <p className="text-xs text-muted-foreground">
                Укажите Minecraft ник — без регистрации на сайте
              </p>
              <div className="space-y-2">
                <Label htmlFor="quick-nick">Minecraft ник</Label>
                <Input
                  id="quick-nick"
                  value={nick}
                  onChange={(e) => setNick(e.target.value)}
                  placeholder="Steve"
                  maxLength={16}
                />
              </div>
              <Button
                variant="outline"
                disabled={quickBuy.isPending || !nick.trim()}
                onClick={() => void doQuickBuy()}
              >
                Купить по нику
              </Button>
            </div>
          ) : null}

          {product.fullDescription ? (
            <div className="prose prose-invert max-w-none rounded-xl border border-border bg-card/50 p-4 text-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{product.fullDescription}</ReactMarkdown>
            </div>
          ) : null}
        </div>
      </div>

      {(boughtTogether.data?.length ?? 0) > 0 ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">С этим покупают</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {boughtTogether.data!.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
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
