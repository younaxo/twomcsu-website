import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { StoreCategory } from '@twomc/shared';
import { CACHE_TTL, cacheKeys } from '../cache/cache.keys';
import { CacheService } from '../cache/cache.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/store.dto';
import { toStoreCategory } from './store.mapper';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async listTree(): Promise<StoreCategory[]> {
    return this.cache.wrap(cacheKeys.storeCategories(), CACHE_TTL.STORE_CATEGORIES, async () => {
      const categories = await this.prisma.category.findMany({
        where: { isActive: true, parentId: null },
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
        include: {
          subcategories: {
            where: { isActive: true },
            orderBy: [{ order: 'asc' }, { name: 'asc' }],
            include: {
              subcategories: {
                where: { isActive: true },
                orderBy: [{ order: 'asc' }, { name: 'asc' }],
              },
            },
          },
        },
      });

      return categories.map(toStoreCategory);
    });
  }

  async listAdmin(search?: string): Promise<StoreCategory[]> {
    const q = search?.trim();
    const categories = await this.prisma.category.findMany({
      where: {
        parentId: null,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { slug: { contains: q, mode: 'insensitive' } },
                {
                  subcategories: {
                    some: {
                      OR: [
                        { name: { contains: q, mode: 'insensitive' } },
                        { slug: { contains: q, mode: 'insensitive' } },
                      ],
                    },
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      include: {
        subcategories: {
          orderBy: [{ order: 'asc' }, { name: 'asc' }],
          include: {
            subcategories: {
              orderBy: [{ order: 'asc' }, { name: 'asc' }],
            },
          },
        },
      },
    });

    return categories.map(toStoreCategory);
  }

  async create(dto: CreateCategoryDto): Promise<StoreCategory> {
    if (dto.parentId) {
      await this.requireCategory(dto.parentId);
    }

    try {
      const category = await this.prisma.category.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          icon: dto.icon,
          image: dto.image,
          order: dto.order ?? 0,
          isActive: dto.isActive ?? true,
          parentId: dto.parentId,
        },
        include: { subcategories: true },
      });

      await this.invalidateCache();
      return toStoreCategory(category);
    } catch (error) {
      this.handleUnique(error);
    }
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<StoreCategory> {
    await this.requireCategory(id);

    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException('Категория не может быть родителем самой себя');
      }
      await this.requireCategory(dto.parentId);
    }

    try {
      const category = await this.prisma.category.update({
        where: { id },
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          icon: dto.icon,
          image: dto.image,
          order: dto.order,
          isActive: dto.isActive,
          parentId: dto.parentId,
        },
        include: {
          subcategories: {
            orderBy: [{ order: 'asc' }, { name: 'asc' }],
          },
        },
      });

      await this.invalidateCache();
      return toStoreCategory(category);
    } catch (error) {
      this.handleUnique(error);
    }
  }

  async remove(id: string): Promise<void> {
    await this.requireCategory(id);

    const [childCount, productCount] = await this.prisma.$transaction([
      this.prisma.category.count({ where: { parentId: id } }),
      this.prisma.product.count({ where: { categoryId: id } }),
    ]);

    if (childCount > 0) {
      throw new BadRequestException('Сначала удалите или переместите подкатегории');
    }

    if (productCount > 0) {
      throw new BadRequestException('В категории есть товары');
    }

    await this.prisma.category.delete({ where: { id } });
    await this.invalidateCache();
  }

  private async requireCategory(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException('Категория не найдена');
    }
    return category;
  }

  private async invalidateCache() {
    await this.cache.del(cacheKeys.storeCategories());
    await this.cache.delPattern(cacheKeys.storeProductsListPattern());
  }

  private handleUnique(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('Категория с таким slug уже существует');
    }
    throw error;
  }
}
