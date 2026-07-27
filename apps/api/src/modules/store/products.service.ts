import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma, ProductType } from '@prisma/client';
import { ProductVariant, StoreProduct, StoreProductsResponse } from '@twomc/shared';
import { createHash } from 'crypto';
import { CACHE_TTL, cacheKeys } from '../cache/cache.keys';
import { CacheService } from '../cache/cache.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProductDto,
  CreateVariantDto,
  UpdateProductDto,
  UpdateVariantDto,
} from './dto/store.dto';
import { toProductVariant, toStoreProduct } from './store.mapper';

const productInclude = {
  variants: {
    where: { isActive: true },
    orderBy: [{ order: 'asc' as const }, { price: 'asc' as const }],
  },
  category: { select: { id: true, name: true, slug: true } },
  position: {
    select: { id: true, slug: true, name: true, color: true, backgroundColor: true },
  },
};

const TYPE_PRIORITY: ProductType[] = [
  ProductType.PRIVILEGE,
  ProductType.DECORATION,
  ProductType.KEY,
  ProductType.CURRENCY,
];

function typePriority(type: ProductType): number {
  const index = TYPE_PRIORITY.indexOf(type);
  return index === -1 ? TYPE_PRIORITY.length + 1 : index;
}

export type ProductListQuery = {
  category?: string;
  type?: ProductType;
  page?: number;
  limit?: number;
  sort?: 'popular' | 'price_asc' | 'price_desc' | 'newest' | 'featured';
  search?: string;
  featured?: boolean;
  isNew?: boolean;
  isPopular?: boolean;
};

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async list(query: ProductListQuery): Promise<StoreProductsResponse> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const sort = query.sort ?? 'popular';
    const hash = createHash('sha1')
      .update(
        JSON.stringify({
          category: query.category ?? null,
          type: query.type ?? null,
          page,
          limit,
          sort,
          search: query.search?.trim().toLowerCase() ?? null,
          featured: query.featured ?? null,
          isNew: query.isNew ?? null,
          isPopular: query.isPopular ?? null,
        }),
      )
      .digest('hex')
      .slice(0, 16);

    return this.cache.wrap(
      cacheKeys.storeProductsList(hash),
      CACHE_TTL.STORE_PRODUCTS,
      () => this.listUncached(query, page, limit, sort),
    );
  }

  async getBySlug(slug: string, userId?: string): Promise<StoreProduct> {
    const cached = await this.cache.wrap(
      cacheKeys.storeProductBySlug(slug),
      CACHE_TTL.STORE_PRODUCTS,
      async () => {
        const product = await this.prisma.product.findFirst({
          where: { slug, isActive: true },
          include: {
            ...productInclude,
            variants: {
              orderBy: [{ order: 'asc' }, { price: 'asc' }],
            },
          },
        });

        if (!product) {
          throw new NotFoundException('Товар не найден');
        }

        return toStoreProduct(product);
      },
    );

    if (!userId) {
      return cached;
    }

    const inWishlist = await this.isInWishlist(userId, cached.id);
    return { ...cached, inWishlist };
  }

  async getBoughtTogether(slugOrId: string, limit = 6): Promise<StoreProduct[]> {
    const product = await this.prisma.product.findFirst({
      where: {
        OR: [{ id: slugOrId }, { slug: slugOrId }],
        isActive: true,
      },
      select: { id: true, categoryId: true },
    });

    if (!product) {
      throw new NotFoundException('Товар не найден');
    }

    const completedItems = await this.prisma.orderItem.findMany({
      where: {
        productId: product.id,
        order: { status: OrderStatus.COMPLETED },
      },
      select: { orderId: true },
      take: 200,
    });

    const orderIds = [...new Set(completedItems.map((row) => row.orderId))];
    let relatedIds: string[] = [];

    if (orderIds.length > 0) {
      const coItems = await this.prisma.orderItem.findMany({
        where: {
          orderId: { in: orderIds },
          productId: { not: product.id },
          order: { status: OrderStatus.COMPLETED },
        },
        select: { productId: true },
      });

      const counts = new Map<string, number>();
      for (const item of coItems) {
        if (!item.productId) continue;
        counts.set(item.productId, (counts.get(item.productId) ?? 0) + 1);
      }

      relatedIds = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => id)
        .slice(0, limit);
    }

    if (relatedIds.length < limit) {
      const fallback = await this.prisma.product.findMany({
        where: {
          isActive: true,
          categoryId: product.categoryId,
          id: { notIn: [product.id, ...relatedIds] },
          type: { not: ProductType.BUNDLE },
        },
        orderBy: [{ isPopular: 'desc' }, { order: 'asc' }],
        take: limit - relatedIds.length,
        select: { id: true },
      });
      relatedIds = [...relatedIds, ...fallback.map((row) => row.id)];
    }

    if (relatedIds.length === 0) {
      return [];
    }

    const products = await this.prisma.product.findMany({
      where: { id: { in: relatedIds }, isActive: true },
      include: productInclude,
    });

    const byId = new Map(products.map((row) => [row.id, row]));
    return relatedIds
      .map((id) => byId.get(id))
      .filter((row): row is NonNullable<typeof row> => Boolean(row))
      .map((row) => toStoreProduct(row));
  }

  async listAdmin(
    page = 1,
    limit = 20,
    search?: string,
  ): Promise<StoreProductsResponse> {
    const take = Math.min(100, Math.max(1, limit));
    const currentPage = Math.max(1, page);
    const skip = (currentPage - 1) * take;
    const q = search?.trim();
    const where: Prisma.ProductWhereInput = q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { slug: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {};

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: {
          ...productInclude,
          variants: { orderBy: [{ order: 'asc' }, { price: 'asc' }] },
        },
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take,
      }),
    ]);

    return {
      items: rows.map((row) => toStoreProduct(row)),
      total,
      page: currentPage,
      limit: take,
      totalPages: Math.ceil(total / take) || 0,
    };
  }

  async create(dto: CreateProductDto): Promise<StoreProduct> {
    await this.requireCategory(dto.categoryId);
    if (dto.positionId) {
      await this.requirePosition(dto.positionId);
    }

    try {
      const product = await this.prisma.product.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          fullDescription: dto.fullDescription,
          type: dto.type,
          image: dto.image,
          images: dto.images ?? [],
          categoryId: dto.categoryId,
          positionId: dto.positionId,
          isGiftable: dto.isGiftable ?? true,
          isSelfOnly: dto.isSelfOnly ?? false,
          isUnique: dto.isUnique ?? false,
          isSeasonalOnly: dto.isSeasonalOnly ?? false,
          maxPerPurchase: dto.maxPerPurchase,
          currencyType: dto.currencyType,
          currencyAmount: dto.currencyAmount,
          isActive: dto.isActive ?? true,
          isFeatured: dto.isFeatured ?? false,
          isNew: dto.isNew ?? false,
          isPopular: dto.isPopular ?? false,
          order: dto.order ?? 0,
          gameCommands: dto.gameCommands ?? [],
          server: dto.server,
        },
        include: productInclude,
      });

      await this.invalidateCache();
      return toStoreProduct(product);
    } catch (error) {
      this.handleUnique(error);
    }
  }

  async update(id: string, dto: UpdateProductDto): Promise<StoreProduct> {
    const existing = await this.requireProduct(id);

    if (dto.categoryId) {
      await this.requireCategory(dto.categoryId);
    }
    if (dto.positionId) {
      await this.requirePosition(dto.positionId);
    }

    try {
      const product = await this.prisma.product.update({
        where: { id },
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          fullDescription: dto.fullDescription,
          type: dto.type,
          image: dto.image,
          images: dto.images,
          categoryId: dto.categoryId,
          positionId: dto.positionId,
          isGiftable: dto.isGiftable,
          isSelfOnly: dto.isSelfOnly,
          isUnique: dto.isUnique,
          isSeasonalOnly: dto.isSeasonalOnly,
          maxPerPurchase: dto.maxPerPurchase,
          currencyType: dto.currencyType,
          currencyAmount: dto.currencyAmount,
          isActive: dto.isActive,
          isFeatured: dto.isFeatured,
          isNew: dto.isNew,
          isPopular: dto.isPopular,
          order: dto.order,
          gameCommands: dto.gameCommands,
          server: dto.server,
        },
        include: productInclude,
      });

      await this.invalidateCache(existing.slug, dto.slug);
      return toStoreProduct(product);
    } catch (error) {
      this.handleUnique(error);
    }
  }

  async remove(id: string): Promise<void> {
    const product = await this.requireProduct(id);
    await this.prisma.product.delete({ where: { id } });
    await this.invalidateCache(product.slug);
  }

  async createVariant(productId: string, dto: CreateVariantDto): Promise<ProductVariant> {
    await this.requireProduct(productId);

    try {
      const variant = await this.prisma.productVariant.create({
        data: {
          productId,
          duration: dto.duration,
          price: dto.price,
          oldPrice: dto.oldPrice,
          isActive: dto.isActive ?? true,
          order: dto.order ?? 0,
        },
      });

      await this.invalidateProductCache(productId);
      return toProductVariant(variant);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Вариант с такой длительностью уже существует');
      }
      throw error;
    }
  }

  async updateVariant(
    productId: string,
    variantId: string,
    dto: UpdateVariantDto,
  ): Promise<ProductVariant> {
    await this.requireVariant(productId, variantId);

    try {
      const variant = await this.prisma.productVariant.update({
        where: { id: variantId },
        data: {
          duration: dto.duration,
          price: dto.price,
          oldPrice: dto.oldPrice,
          isActive: dto.isActive,
          order: dto.order,
        },
      });

      await this.invalidateProductCache(productId);
      return toProductVariant(variant);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Вариант с такой длительностью уже существует');
      }
      throw error;
    }
  }

  async removeVariant(productId: string, variantId: string): Promise<void> {
    await this.requireVariant(productId, variantId);
    await this.prisma.productVariant.delete({ where: { id: variantId } });
    await this.invalidateProductCache(productId);
  }

  private async listUncached(
    query: ProductListQuery,
    page: number,
    limit: number,
    sort: NonNullable<ProductListQuery['sort']>,
  ): Promise<StoreProductsResponse> {
    const where: Prisma.ProductWhereInput = { isActive: true };

    if (query.category) {
      const category = await this.prisma.category.findUnique({
        where: { slug: query.category },
        select: { id: true },
      });
      if (!category) {
        return { items: [], total: 0, page, limit, totalPages: 0 };
      }

      const childIds = await this.prisma.category.findMany({
        where: { parentId: category.id, isActive: true },
        select: { id: true },
      });
      where.categoryId = { in: [category.id, ...childIds.map((c) => c.id)] };
    }

    if (query.type) where.type = query.type;
    if (query.featured === true) where.isFeatured = true;
    if (query.isNew === true) where.isNew = true;
    if (query.isPopular === true) where.isPopular = true;

    if (query.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput[] = (() => {
      switch (sort) {
        case 'newest':
          return [{ createdAt: 'desc' }];
        case 'featured':
          return [{ isFeatured: 'desc' }, { order: 'asc' }, { name: 'asc' }];
        case 'price_asc':
        case 'price_desc':
          // Price sort applied after fetch via min variant price
          return [{ order: 'asc' }, { name: 'asc' }];
        case 'popular':
        default:
          return [{ isPopular: 'desc' }, { order: 'asc' }, { name: 'asc' }];
      }
    })();

    const skip = (page - 1) * limit;
    const useTypePriority =
      !query.type && (sort === 'featured' || sort === 'popular');

    if (sort === 'price_asc' || sort === 'price_desc' || useTypePriority) {
      const all = await this.prisma.product.findMany({
        where: {
          ...where,
          ...(useTypePriority ? { type: { not: ProductType.BUNDLE } } : {}),
        },
        include: productInclude,
      });

      const withMeta = all.map((product) => {
        const prices = product.variants.map((v) => Number(v.price));
        const minPrice = prices.length ? Math.min(...prices) : Number.POSITIVE_INFINITY;
        return { product, minPrice };
      });

      withMeta.sort((a, b) => {
        if (sort === 'price_asc') return a.minPrice - b.minPrice;
        if (sort === 'price_desc') return b.minPrice - a.minPrice;

        const typeDiff = typePriority(a.product.type) - typePriority(b.product.type);
        if (typeDiff !== 0) return typeDiff;

        if (sort === 'featured') {
          if (a.product.isFeatured !== b.product.isFeatured) {
            return Number(b.product.isFeatured) - Number(a.product.isFeatured);
          }
        } else if (a.product.isPopular !== b.product.isPopular) {
          return Number(b.product.isPopular) - Number(a.product.isPopular);
        }

        if (a.product.order !== b.product.order) {
          return a.product.order - b.product.order;
        }
        return a.product.name.localeCompare(b.product.name, 'ru');
      });

      const total = withMeta.length;
      const slice = withMeta.slice(skip, skip + limit).map((row) => toStoreProduct(row.product));

      return {
        items: slice,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 0,
      };
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: productInclude,
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    return {
      items: rows.map((row) => toStoreProduct(row)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }

  private async isInWishlist(userId: string, productId: string): Promise<boolean> {
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!wishlist) return false;

    const item = await this.prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: { wishlistId: wishlist.id, productId },
      },
      select: { id: true },
    });
    return Boolean(item);
  }

  private async requireProduct(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Товар не найден');
    }
    return product;
  }

  private async requireVariant(productId: string, variantId: string) {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, productId },
    });
    if (!variant) {
      throw new NotFoundException('Вариант не найден');
    }
    return variant;
  }

  private async requireCategory(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException('Категория не найдена');
    }
  }

  private async requirePosition(id: string) {
    const position = await this.prisma.position.findUnique({ where: { id } });
    if (!position) {
      throw new NotFoundException('Должность не найдена');
    }
  }

  private async invalidateProductCache(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { slug: true },
    });
    await this.invalidateCache(product?.slug);
  }

  private async invalidateCache(...slugs: Array<string | undefined>) {
    const keys = slugs.filter(Boolean).map((slug) => cacheKeys.storeProductBySlug(slug!));
    if (keys.length) {
      await this.cache.del(keys);
    }
    await this.cache.delPattern(cacheKeys.storeProductsListPattern());
  }

  private handleUnique(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('Товар с таким slug уже существует');
    }
    throw error;
  }
}
