import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProductType, StoreDiscountType } from '@twomc/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromoCodeDto, UpdatePromoCodeDto } from './dto/store.dto';
import { decimalToNumber, optionalDecimal } from './store.mapper';

export type PromoCodeAdminView = {
  id: string;
  code: string;
  description: string | null;
  discountType: StoreDiscountType;
  discountValue: number;
  maxUses: number | null;
  usedCount: number;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
  applicableToTypes: ProductType[];
  minOrderAmount: number | null;
  firstPurchaseOnly: boolean;
};

@Injectable()
export class PromocodesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<PromoCodeAdminView[]> {
    const rows = await this.prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(this.mapPromo);
  }

  async create(dto: CreatePromoCodeDto): Promise<PromoCodeAdminView> {
    try {
      const promo = await this.prisma.promoCode.create({
        data: {
          code: dto.code.trim().toUpperCase(),
          description: dto.description,
          discountType: dto.discountType,
          discountValue: dto.discountValue,
          maxUses: dto.maxUses,
          validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
          validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
          isActive: dto.isActive ?? true,
          applicableToTypes: dto.applicableToTypes ?? [],
          minOrderAmount: dto.minOrderAmount,
          firstPurchaseOnly: dto.firstPurchaseOnly ?? false,
        },
      });
      return this.mapPromo(promo);
    } catch (error) {
      this.handleUnique(error);
    }
  }

  async update(id: string, dto: UpdatePromoCodeDto): Promise<PromoCodeAdminView> {
    await this.requirePromo(id);

    try {
      const promo = await this.prisma.promoCode.update({
        where: { id },
        data: {
          code: dto.code?.trim().toUpperCase(),
          description: dto.description,
          discountType: dto.discountType,
          discountValue: dto.discountValue,
          maxUses: dto.maxUses,
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
          isActive: dto.isActive,
          applicableToTypes: dto.applicableToTypes,
          minOrderAmount: dto.minOrderAmount,
          firstPurchaseOnly: dto.firstPurchaseOnly,
        },
      });
      return this.mapPromo(promo);
    } catch (error) {
      this.handleUnique(error);
    }
  }

  async remove(id: string): Promise<void> {
    await this.requirePromo(id);
    await this.prisma.promoCode.delete({ where: { id } });
  }

  private mapPromo = (promo: {
    id: string;
    code: string;
    description: string | null;
    discountType: StoreDiscountType;
    discountValue: { toString(): string };
    maxUses: number | null;
    usedCount: number;
    validFrom: Date | null;
    validUntil: Date | null;
    isActive: boolean;
    applicableToTypes: ProductType[];
    minOrderAmount: { toString(): string } | null;
    firstPurchaseOnly: boolean;
  }): PromoCodeAdminView => ({
    id: promo.id,
    code: promo.code,
    description: promo.description,
    discountType: promo.discountType,
    discountValue: decimalToNumber(promo.discountValue),
    maxUses: promo.maxUses,
    usedCount: promo.usedCount,
    validFrom: promo.validFrom?.toISOString() ?? null,
    validUntil: promo.validUntil?.toISOString() ?? null,
    isActive: promo.isActive,
    applicableToTypes: promo.applicableToTypes,
    minOrderAmount: optionalDecimal(promo.minOrderAmount),
    firstPurchaseOnly: promo.firstPurchaseOnly,
  });

  private async requirePromo(id: string) {
    const promo = await this.prisma.promoCode.findUnique({ where: { id } });
    if (!promo) {
      throw new NotFoundException('Промокод не найден');
    }
    return promo;
  }

  private handleUnique(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('Промокод с таким кодом уже существует');
    }
    throw error;
  }
}
