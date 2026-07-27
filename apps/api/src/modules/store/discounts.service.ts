import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BulkDiscount as SharedBulkDiscount,
  LoyaltyDiscount as SharedLoyaltyDiscount,
} from '@twomc/shared';
import { CACHE_TTL, cacheKeys } from '../cache/cache.keys';
import { CacheService } from '../cache/cache.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBulkDiscountDto,
  CreateLoyaltyDiscountDto,
  UpdateBulkDiscountDto,
  UpdateLoyaltyDiscountDto,
} from './dto/store.dto';
import { decimalToNumber, optionalDecimal } from './store.mapper';

@Injectable()
export class DiscountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async listBulk(): Promise<SharedBulkDiscount[]> {
    return this.cache.wrap(
      cacheKeys.storeBulkDiscounts(),
      CACHE_TTL.STORE_DISCOUNTS,
      async () => {
        const rows = await this.prisma.bulkDiscount.findMany({
          where: { isActive: true },
          orderBy: [{ productType: 'asc' }, { minQuantity: 'asc' }],
        });
        return rows.map((row) => ({
          id: row.id,
          productType: row.productType,
          minQuantity: row.minQuantity,
          minAmount: optionalDecimal(row.minAmount),
          discountType: row.discountType,
          discountValue: decimalToNumber(row.discountValue),
        }));
      },
    );
  }

  async listLoyalty(): Promise<SharedLoyaltyDiscount[]> {
    return this.cache.wrap(
      cacheKeys.storeLoyaltyDiscounts(),
      CACHE_TTL.STORE_DISCOUNTS,
      async () => {
        const rows = await this.prisma.loyaltyDiscount.findMany({
          where: { isActive: true },
          orderBy: { minPurchases: 'asc' },
        });
        return rows.map((row) => ({
          id: row.id,
          minPurchases: row.minPurchases,
          discountPercent: decimalToNumber(row.discountPercent),
          name: row.name,
          description: row.description,
        }));
      },
    );
  }

  async createBulk(dto: CreateBulkDiscountDto): Promise<SharedBulkDiscount> {
    if (dto.productId) {
      const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
      if (!product) {
        throw new NotFoundException('Товар не найден');
      }
    }

    const row = await this.prisma.bulkDiscount.create({
      data: {
        productId: dto.productId,
        productType: dto.productType,
        minQuantity: dto.minQuantity ?? 0,
        minAmount: dto.minAmount,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        isActive: dto.isActive ?? true,
      },
    });

    await this.invalidate();
    return {
      id: row.id,
      productType: row.productType,
      minQuantity: row.minQuantity,
      minAmount: optionalDecimal(row.minAmount),
      discountType: row.discountType,
      discountValue: decimalToNumber(row.discountValue),
    };
  }

  async updateBulk(id: string, dto: UpdateBulkDiscountDto): Promise<SharedBulkDiscount> {
    await this.requireBulk(id);

    const row = await this.prisma.bulkDiscount.update({
      where: { id },
      data: {
        productId: dto.productId,
        productType: dto.productType,
        minQuantity: dto.minQuantity,
        minAmount: dto.minAmount,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        isActive: dto.isActive,
      },
    });

    await this.invalidate();
    return {
      id: row.id,
      productType: row.productType,
      minQuantity: row.minQuantity,
      minAmount: optionalDecimal(row.minAmount),
      discountType: row.discountType,
      discountValue: decimalToNumber(row.discountValue),
    };
  }

  async removeBulk(id: string): Promise<void> {
    await this.requireBulk(id);
    await this.prisma.bulkDiscount.delete({ where: { id } });
    await this.invalidate();
  }

  async createLoyalty(dto: CreateLoyaltyDiscountDto): Promise<SharedLoyaltyDiscount> {
    const row = await this.prisma.loyaltyDiscount.create({
      data: {
        minPurchases: dto.minPurchases,
        discountPercent: dto.discountPercent,
        name: dto.name,
        description: dto.description,
        isActive: dto.isActive ?? true,
      },
    });

    await this.invalidate();
    return {
      id: row.id,
      minPurchases: row.minPurchases,
      discountPercent: decimalToNumber(row.discountPercent),
      name: row.name,
      description: row.description,
    };
  }

  async updateLoyalty(id: string, dto: UpdateLoyaltyDiscountDto): Promise<SharedLoyaltyDiscount> {
    await this.requireLoyalty(id);

    const row = await this.prisma.loyaltyDiscount.update({
      where: { id },
      data: {
        minPurchases: dto.minPurchases,
        discountPercent: dto.discountPercent,
        name: dto.name,
        description: dto.description,
        isActive: dto.isActive,
      },
    });

    await this.invalidate();
    return {
      id: row.id,
      minPurchases: row.minPurchases,
      discountPercent: decimalToNumber(row.discountPercent),
      name: row.name,
      description: row.description,
    };
  }

  async removeLoyalty(id: string): Promise<void> {
    await this.requireLoyalty(id);
    await this.prisma.loyaltyDiscount.delete({ where: { id } });
    await this.invalidate();
  }

  private async requireBulk(id: string) {
    const row = await this.prisma.bulkDiscount.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException('Оптовая скидка не найдена');
    }
    return row;
  }

  private async requireLoyalty(id: string) {
    const row = await this.prisma.loyaltyDiscount.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException('Скидка лояльности не найдена');
    }
    return row;
  }

  private async invalidate() {
    await this.cache.del([
      cacheKeys.storeBulkDiscounts(),
      cacheKeys.storeLoyaltyDiscounts(),
    ]);
  }
}
