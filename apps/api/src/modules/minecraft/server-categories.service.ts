import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateServerCategoryPayload,
  ServerCategory,
  UpdateServerCategoryPayload,
} from '@twomc/shared';
import { CACHE_TTL, cacheKeys } from '../cache/cache.keys';
import { CacheService } from '../cache/cache.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServerCategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async listActive(): Promise<ServerCategory[]> {
    return this.cache.wrap(
      cacheKeys.serverCategories(),
      CACHE_TTL.SERVER_CATEGORIES,
      async () => {
        const rows = await this.prisma.serverCategory.findMany({
          where: { isActive: true },
          orderBy: [{ order: 'asc' }, { name: 'asc' }],
        });
        return rows.map(this.mapCategory);
      },
    );
  }

  async listAllAdmin(): Promise<ServerCategory[]> {
    const rows = await this.prisma.serverCategory.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
    return rows.map(this.mapCategory);
  }

  async create(dto: CreateServerCategoryPayload): Promise<ServerCategory> {
    const existing = await this.prisma.serverCategory.findUnique({
      where: { slug: dto.slug.trim().toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Категория с таким slug уже существует');
    }

    const row = await this.prisma.serverCategory.create({
      data: {
        name: dto.name.trim(),
        slug: dto.slug.trim().toLowerCase(),
        description: dto.description?.trim() || null,
        icon: dto.icon?.trim() || null,
        color: dto.color?.trim() || null,
        order: dto.order ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
    await this.cache.del(cacheKeys.serverCategories());
    return this.mapCategory(row);
  }

  async update(id: string, dto: UpdateServerCategoryPayload): Promise<ServerCategory> {
    const existing = await this.prisma.serverCategory.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Категория не найдена');

    if (dto.slug) {
      const clash = await this.prisma.serverCategory.findFirst({
        where: { slug: dto.slug.trim().toLowerCase(), NOT: { id } },
        select: { id: true },
      });
      if (clash) {
        throw new ConflictException('Категория с таким slug уже существует');
      }
    }

    const row = await this.prisma.serverCategory.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        slug: dto.slug?.trim().toLowerCase(),
        description:
          dto.description === undefined ? undefined : dto.description?.trim() || null,
        icon: dto.icon === undefined ? undefined : dto.icon?.trim() || null,
        color: dto.color === undefined ? undefined : dto.color?.trim() || null,
        order: dto.order,
        isActive: dto.isActive,
      },
    });
    await this.cache.del(cacheKeys.serverCategories());
    await this.cache.del(cacheKeys.serversList());
    return this.mapCategory(row);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.serverCategory.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Категория не найдена');
    await this.prisma.serverCategory.delete({ where: { id } });
    await this.cache.del(cacheKeys.serverCategories());
    await this.cache.del(cacheKeys.serversList());
  }

  private mapCategory(row: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    color: string | null;
    order: number;
    isActive: boolean;
  }): ServerCategory {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      icon: row.icon,
      color: row.color,
      order: row.order,
      isActive: row.isActive,
    };
  }
}
