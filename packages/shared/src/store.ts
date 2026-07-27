export const ProductType = {
  PRIVILEGE: 'PRIVILEGE',
  KEY: 'KEY',
  SUBSCRIPTION: 'SUBSCRIPTION',
  BADGE: 'BADGE',
  BATTLE_PASS: 'BATTLE_PASS',
  BATTLE_PASS_BOOSTER: 'BATTLE_PASS_BOOSTER',
  UNMUTE: 'UNMUTE',
  UNBAN: 'UNBAN',
  CURRENCY: 'CURRENCY',
  DECORATION: 'DECORATION',
  BUNDLE: 'BUNDLE',
} as const;

export type ProductType = (typeof ProductType)[keyof typeof ProductType];

export const ProductDuration = {
  FOREVER: 'FOREVER',
  MONTHS_3: 'MONTHS_3',
  MONTH_1: 'MONTH_1',
  WEEK_1: 'WEEK_1',
  SEASON: 'SEASON',
  ONE_TIME: 'ONE_TIME',
} as const;

export type ProductDuration = (typeof ProductDuration)[keyof typeof ProductDuration];

export const CurrencyType = {
  RUBIES: 'RUBIES',
  COINS: 'COINS',
} as const;

export type CurrencyType = (typeof CurrencyType)[keyof typeof CurrencyType];

export const OrderStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const StoreDiscountType = {
  PERCENT: 'PERCENT',
  FIXED: 'FIXED',
  BONUS: 'BONUS',
} as const;

export type StoreDiscountType = (typeof StoreDiscountType)[keyof typeof StoreDiscountType];

export const DURATION_LABELS: Record<ProductDuration, string> = {
  FOREVER: 'Навсегда',
  MONTHS_3: '3 месяца',
  MONTH_1: '1 месяц',
  WEEK_1: '1 неделя',
  SEASON: 'Сезон',
  ONE_TIME: 'Разово',
};

export interface StoreCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image: string | null;
  order: number;
  parentId: string | null;
  subcategories: StoreCategory[];
}

export interface StorePositionRef {
  id: string;
  slug: string;
  name: string;
  color: string;
  backgroundColor: string | null;
}

export interface ProductVariant {
  id: string;
  duration: ProductDuration;
  price: number;
  oldPrice: number | null;
  isActive: boolean;
  order: number;
}

export interface StoreProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  fullDescription: string | null;
  type: ProductType;
  image: string | null;
  images: string[];
  categoryId: string;
  category?: Pick<StoreCategory, 'id' | 'name' | 'slug'>;
  position: StorePositionRef | null;
  isGiftable: boolean;
  isSelfOnly: boolean;
  isUnique: boolean;
  isSeasonalOnly: boolean;
  maxPerPurchase: number | null;
  currencyType: CurrencyType | null;
  currencyAmount: number | null;
  isActive: boolean;
  isFeatured: boolean;
  isNew: boolean;
  isPopular: boolean;
  order: number;
  variants: ProductVariant[];
  inWishlist?: boolean;
}

export interface StoreProductsResponse {
  items: StoreProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BundleItem {
  id: string;
  quantity: number;
  product: Pick<StoreProduct, 'id' | 'name' | 'slug' | 'image' | 'type'>;
  variant: ProductVariant | null;
}

export interface StoreBundle {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  totalPrice: number;
  originalPrice: number;
  isActive: boolean;
  isFeatured: boolean;
  items: BundleItem[];
}

export interface CartItem {
  id: string;
  quantity: number;
  giftToUserId: string | null;
  giftMessage: string | null;
  giftToUsername?: string | null;
  product: StoreProduct | null;
  variant: ProductVariant | null;
  bundle: StoreBundle | null;
  lineTotal: number;
  unitPrice: number;
}

export interface PriceDiscount {
  type: 'bulk' | 'promo' | 'loyalty';
  label: string;
  amount: number;
}

export interface CartTotals {
  subtotal: number;
  discounts: PriceDiscount[];
  discountAmount: number;
  total: number;
  currencyBonusPercent?: number;
}

export interface CartResponse {
  id: string;
  items: CartItem[];
  promoCode: string | null;
  totals: CartTotals;
}

export interface WishlistItem {
  id: string;
  addedAt: string;
  product: StoreProduct;
}

export interface WishlistResponse {
  id: string;
  isPublic: boolean;
  items: WishlistItem[];
}

export interface PublicWishlistResponse {
  username: string;
  isPublic: boolean;
  items: WishlistItem[];
}

export interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  giftToUserId: string | null;
  giftMessage: string | null;
  isDelivered: boolean;
  product: Pick<StoreProduct, 'id' | 'name' | 'slug' | 'image' | 'type'> | null;
  variant: ProductVariant | null;
  bundle: Pick<StoreBundle, 'id' | 'name' | 'slug' | 'image'> | null;
}

export interface StoreOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  discountAmount: number;
  total: number;
  promoCode: string | null;
  paymentMethod: string | null;
  paidAt: string | null;
  createdAt: string;
  items: OrderItem[];
}

export interface OrdersResponse {
  items: StoreOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateOrderResponse {
  orderId: string;
  orderNumber: string;
  paymentUrl: string;
}

export interface PromoValidationResult {
  valid: boolean;
  code?: string;
  discountType?: StoreDiscountType;
  discountValue?: number;
  message?: string;
  applicableTypes?: ProductType[];
}

export interface BulkDiscount {
  id: string;
  productType: ProductType | null;
  minQuantity: number;
  minAmount: number | null;
  discountType: StoreDiscountType;
  discountValue: number;
}

export interface LoyaltyDiscount {
  id: string;
  minPurchases: number;
  discountPercent: number;
  name: string;
  description: string | null;
}

export interface CurrencyRate {
  id: string;
  currency: string;
  rate: number;
  symbol: string;
  flag: string;
  isActive: boolean;
  updatedAt: string;
}

export interface RecentPurchaseItem {
  id: string;
  productName: string;
  productSlug: string | null;
  productImage: string | null;
  username: string | null;
  createdAt: string;
}

export interface QuickBuyRequest {
  productId: string;
  variantId?: string;
  quantity?: number;
  minecraftNick: string;
}

export interface QuickBuyResponse {
  orderId?: string;
  orderNumber?: string;
  paymentUrl?: string;
  success?: boolean;
  message?: string;
}

export interface AdminStoreStatsOverview {
  revenue: number;
  ordersCount: number;
  averageOrder: number;
  productsSold: number;
  pending: number;
  completed: number;
  cancelled: number;
  refunded: number;
}

export interface AdminStoreStatsPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface AdminStoreStatsBreakdown {
  name: string;
  value: number;
}

export interface AdminStoreStatsResponse {
  overview: AdminStoreStatsOverview;
  revenueOverTime: AdminStoreStatsPoint[];
  byCategory: AdminStoreStatsBreakdown[];
  byProductType: AdminStoreStatsBreakdown[];
  topProducts: AdminStoreStatsBreakdown[];
}
