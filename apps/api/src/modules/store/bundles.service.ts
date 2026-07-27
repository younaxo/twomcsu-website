import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { StoreBundle } from '@twomc/shared';
import { CACHE_TTL, cacheKeys } from '../cache/cache.keys';
import { CacheService } from '../cache/cache.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBundleDto, UpdateBundleDto } from './dto/store.dto';
import { toStoreBundle } from './store.mapper';

@Injectable()
export class BundlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async list(): Promise<StoreBundle[]> {
    return this.cache.wrap(cacheKeys.storeBundlesList(), CACHE_TTL.STORE_BUNDLES, async () => {
      const bundles = await this.prisma.bundle.findMany({
        where: {
          isActive: true,
          OR: [{ validFrom: null }, { validFrom: { lte: new Date() } }],
          AND: [
            { OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }] },
          ],
        },
        orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
        include: this.bundleInclude(),
      });

      return this.mapBundlesWithVariants(bundles);
    });
  }

  async getBySlug(slug: string): Promise<StoreBundle> {
    return this.cache.wrap(cacheKeys.storeBundleBySlug(slug), CACHE_TTL.STORE_BUNDLES, async () => {
      const bundle = await this.prisma.bundle.findFirst({
        where: { slug, isActive: true },
        include: this.bundleInclude(),
      });

      if (!bundle) {
        throw new NotFoundException('Набор не найден');
      }

      const [mapped] = await this.mapBundlesWithVariants([bundle]);
      return mapped;
    });
  }

  async create(dto: CreateBundleDto): Promise<StoreBundle> {
    await this.validateItems(dto.items);

    try {
      const bundle = await this.prisma.bundle.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          image: dto.image,
          totalPrice: dto.totalPrice,
          originalPrice: dto.originalPrice,
          isActive: dto.isActive ?? true,
          isFeatured: dto.isFeatured ?? false,
          validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
          validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
          items: {
            create: dto.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity ?? 1,
            })),
          },
        },
        include: this.bundleInclude(),
      });

      await this.invalidateCache();
      const [mapped] = await this.mapBundlesWithVariants([bundle]);
      return mapped;
    } catch (error) {
      this.handleUnique(error);
    }
  }

  async update(id: string, dto: UpdateBundleDto): Promise<StoreBundle> {
    const existing = await this.requireBundle(id);

    if (dto.items) {
      await this.validateItems(dto.items);
    }

    try {
      const bundle = await this.prisma.$transaction(async (tx) => {
        if (dto.items) {
          await tx.bundleItem.deleteMany({ where: { bundleId: id } });
          await tx.bundleItem.createMany({
            data: dto.items.map((item) => ({
              bundleId: id,
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity ?? 1,
            })),
          });
        }

        return tx.bundle.update({
          where: { id },
          data: {
            name: dto.name,
            slug: dto.slug,
            description: dto.description,
            image: dto.image,
            totalPrice: dto.totalPrice,
            originalPrice: dto.originalPrice,
            isActive: dto.isActive,
            isFeatured: dto.isFeatured,
            validFrom:
              dto.validFrom === undefined
                ? undefined
                : dto.validFrom
                  ? new Date(dto.validFrom)
                  : null,
            validUntil:
              dto.validUntil === undefined
                ? undefined
                : dto.validUntil
                  ? new Date(dto.validUntil)
                  : null,
          },
          include: this.bundleInclude(),
        });
      });

      await this.invalidateCache(existing.slug, dto.slug);
      const [mapped] = await this.mapBundlesWithVariants([bundle]);
      return mapped;
    } catch (error) {
      this.handleUnique(error);
    }
  }

  async remove(id: string): Promise<void> {
    const bundle = await this.requireBundle(id);
    await this.prisma.bundle.delete({ where: { id } });
    await this.invalidateCache(bundle.slug);
  }

  private bundleInclude() {
    return {
      items: {
        include: {
          product: {
            select: { id: true, name: true, slug: true, image: true, type: true },
          },
        },
      },
    } as const;
  }

  private async mapBundlesWithVariants(
    bundles: Array<
      Prisma.BundleGetPayload<{ include: ReturnType<BundlesService['bundleInclude']> }>
    >,
  ): Promise<StoreBundle[]> {
    const variantIds = [
      ...new Set(
        bundles.flatMap((b) => b.items.map((i) => i.variantId).filter((id): id is string => !!id)),
      ),
    ];

    const variants =
      variantIds.length > 0
        ? await this.prisma.productVariant.findMany({ where: { id: { in: variantIds } } })
        : [];
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    return bundles.map((bundle) =>
      toStoreBundle({
        ...bundle,
        items: bundle.items.map((item) => ({
          ...item,
          variant: item.variantId ? variantMap.get(item.variantId) ?? null : null,
        })),
      }),
    );
  }

  private async validateItems(items: CreateBundleDto['items']) {
    for (const item of items) {
      const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        throw new NotFoundException('Товар в наборе не найден');
      }
      if (item.variantId) {
        const variant = await this.prisma.productVariant.findFirst({
          where: { id: item.variantId, productId: item.productId },
        });
        if (!variant) {
          throw new NotFoundException('Вариант товара в наборе не найден');
        }
      }
    }
  }

  private async requireBundle(id: string) {
    const bundle = await this.prisma.bundle.findUnique({ where: { id } });
    if (!bundle) {
      throw new NotFoundException('Набор не найден');
    }
    return bundle;
  }

  private async invalidateCache(...slugs: Array<string | undefined>) {
    await this.cache.del(cacheKeys.storeBundlesList());
    const keys = slugs.filter(Boolean).map((slug) => cacheKeys.storeBundleBySlug(slug!));
    if (keys.length) {
      await this.cache.del(keys);
    }
  }

  private handleUnique(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('Набор с таким slug уже существует');
    }
    throw error;
  }
}
