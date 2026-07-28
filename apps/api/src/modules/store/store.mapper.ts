import {
  Bundle as BundleRow,
  BundleItem as BundleItemRow,
  CartItem as CartItemRow,
  Category as CategoryRow,
  Order as OrderRow,
  OrderItem as OrderItemRow,
  Position as PositionRow,
  Product as ProductRow,
  ProductVariant as VariantRow,
  PromoCode as PromoCodeRow,
} from '@prisma/client';
import {
  BundleItem,
  CartItem,
  OrderItem,
  ProductVariant,
  StoreBundle,
  StoreCategory,
  StoreOrder,
  StorePositionRef,
  StoreProduct,
} from '@twomc/shared';

export function decimalToNumber(value: { toString(): string } | number | null | undefined): number {
  if (value == null) return 0;
  return typeof value === 'number' ? value : Number(value);
}

export function optionalDecimal(value: { toString(): string } | number | null | undefined): number | null {
  if (value == null) return null;
  return decimalToNumber(value);
}

type CategoryNode = CategoryRow & { subcategories?: CategoryNode[] };

export function toStoreCategory(category: CategoryNode): StoreCategory {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    icon: category.icon,
    image: category.image,
    order: category.order,
    parentId: category.parentId,
    subcategories: (category.subcategories ?? []).map(toStoreCategory),
  };
}

type PositionLike = Pick<PositionRow, 'id' | 'slug' | 'name' | 'color' | 'backgroundColor'>;

export function toStorePositionRef(position: PositionLike | null | undefined): StorePositionRef | null {
  if (!position) return null;
  return {
    id: position.id,
    slug: position.slug,
    name: position.name,
    color: position.color,
    backgroundColor: position.backgroundColor,
  };
}

export function toProductVariant(variant: VariantRow): ProductVariant {
  return {
    id: variant.id,
    duration: variant.duration,
    price: decimalToNumber(variant.price),
    oldPrice: optionalDecimal(variant.oldPrice),
    isActive: variant.isActive,
    order: variant.order,
  };
}

type ProductLike = ProductRow & {
  variants?: VariantRow[];
  category?: Pick<CategoryRow, 'id' | 'name' | 'slug'> | null;
  position?: PositionLike | null;
};

export function toStoreProduct(product: ProductLike, inWishlist?: boolean): StoreProduct {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    fullDescription: product.fullDescription,
    type: product.type,
    image: product.image,
    images: product.images,
    categoryId: product.categoryId,
    category: product.category
      ? { id: product.category.id, name: product.category.name, slug: product.category.slug }
      : undefined,
    position: toStorePositionRef(product.position),
    isGiftable: product.isGiftable,
    isSelfOnly: product.isSelfOnly,
    isUnique: product.isUnique,
    isSeasonalOnly: product.isSeasonalOnly,
    maxPerPurchase: product.maxPerPurchase,
    currencyType: product.currencyType,
    currencyAmount: product.currencyAmount,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    isNew: product.isNew,
    isPopular: product.isPopular,
    order: product.order,
    variants: (product.variants ?? []).map(toProductVariant),
    ...(inWishlist !== undefined ? { inWishlist } : {}),
  };
}

type BundleItemLike = BundleItemRow & {
  product: Pick<ProductRow, 'id' | 'name' | 'slug' | 'image' | 'type'>;
  variant?: VariantRow | null;
};

type BundleLike = BundleRow & {
  items?: BundleItemLike[];
};

export function toBundleItem(item: BundleItemLike): BundleItem {
  return {
    id: item.id,
    quantity: item.quantity,
    product: {
      id: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      image: item.product.image,
      type: item.product.type,
    },
    variant: item.variant ? toProductVariant(item.variant) : null,
  };
}

export function toStoreBundle(bundle: BundleLike): StoreBundle {
  return {
    id: bundle.id,
    name: bundle.name,
    slug: bundle.slug,
    description: bundle.description,
    image: bundle.image,
    totalPrice: decimalToNumber(bundle.totalPrice),
    originalPrice: decimalToNumber(bundle.originalPrice),
    isActive: bundle.isActive,
    isFeatured: bundle.isFeatured,
    items: (bundle.items ?? []).map(toBundleItem),
  };
}

type CartItemLike = CartItemRow & {
  product?: ProductLike | null;
  variant?: VariantRow | null;
  bundle?: BundleLike | null;
  giftToUser?: { username: string } | null;
};

export function toCartItem(
  item: CartItemLike,
  unitPrice: number,
  lineTotal: number,
): CartItem {
  return {
    id: item.id,
    quantity: item.quantity,
    giftToUserId: item.giftToUserId,
    giftMessage: item.giftMessage,
    giftToUsername: item.giftToUser?.username ?? null,
    product: item.product ? toStoreProduct(item.product) : null,
    variant: item.variant ? toProductVariant(item.variant) : null,
    bundle: item.bundle ? toStoreBundle(item.bundle) : null,
    unitPrice,
    lineTotal,
  };
}

type OrderItemLike = OrderItemRow & {
  product?: Pick<ProductRow, 'id' | 'name' | 'slug' | 'image' | 'type'> | null;
  variant?: VariantRow | null;
  bundle?: Pick<BundleRow, 'id' | 'name' | 'slug' | 'image'> | null;
};

export function toOrderItem(item: OrderItemLike): OrderItem {
  return {
    id: item.id,
    quantity: item.quantity,
    unitPrice: decimalToNumber(item.unitPrice),
    totalPrice: decimalToNumber(item.totalPrice),
    giftToUserId: item.giftToUserId,
    giftMessage: item.giftMessage,
    isDelivered: item.isDelivered,
    product: item.product
      ? {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          image: item.product.image,
          type: item.product.type,
        }
      : null,
    variant: item.variant ? toProductVariant(item.variant) : null,
    bundle: item.bundle
      ? {
          id: item.bundle.id,
          name: item.bundle.name,
          slug: item.bundle.slug,
          image: item.bundle.image,
        }
      : null,
  };
}

type OrderLike = OrderRow & {
  items?: OrderItemLike[];
  promoCode?: Pick<PromoCodeRow, 'code'> | null;
};

export function toStoreOrder(order: OrderLike): StoreOrder {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    subtotal: decimalToNumber(order.subtotal),
    discountAmount: decimalToNumber(order.discountAmount),
    total: decimalToNumber(order.total),
    promoCode: order.promoCode?.code ?? null,
    paymentMethod: order.paymentMethod,
    paidAt: order.paidAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
    items: (order.items ?? []).map(toOrderItem),
  };
}
