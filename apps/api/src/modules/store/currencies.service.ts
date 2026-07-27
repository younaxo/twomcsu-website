import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CurrencyRate } from '@twomc/shared';
import { CACHE_TTL, cacheKeys } from '../cache/cache.keys';
import { CacheService } from '../cache/cache.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCurrencyRateDto, UpdateCurrencyRateDto } from './dto/store.dto';
import { decimalToNumber } from './store.mapper';

@Injectable()
export class CurrenciesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async listActive(): Promise<CurrencyRate[]> {
    return this.cache.wrap(
      cacheKeys.storeCurrencies(),
      CACHE_TTL.STORE_DISCOUNTS,
      async () => {
        const rows = await this.prisma.currencyRate.findMany({
          where: { isActive: true },
          orderBy: { currency: 'asc' },
        });
        return rows.map(this.mapRate);
      },
    );
  }

  async listAdmin(): Promise<CurrencyRate[]> {
    const rows = await this.prisma.currencyRate.findMany({
      orderBy: { currency: 'asc' },
    });
    return rows.map(this.mapRate);
  }

  async create(dto: CreateCurrencyRateDto): Promise<CurrencyRate> {
    try {
      const row = await this.prisma.currencyRate.create({
        data: {
          currency: dto.currency.trim().toUpperCase(),
          rate: dto.rate,
          symbol: dto.symbol,
          flag: dto.flag ?? '',
          isActive: dto.isActive ?? true,
        },
      });
      await this.invalidateCache();
      return this.mapRate(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Валюта с таким кодом уже существует');
      }
      throw error;
    }
  }

  async update(idOrCurrency: string, dto: UpdateCurrencyRateDto): Promise<CurrencyRate> {
    const existing = await this.requireRate(idOrCurrency);

    try {
      const row = await this.prisma.currencyRate.update({
        where: { id: existing.id },
        data: {
          rate: dto.rate,
          symbol: dto.symbol,
          flag: dto.flag,
          isActive: dto.isActive,
          ...(dto.currency
            ? { currency: dto.currency.trim().toUpperCase() }
            : {}),
        },
      });
      await this.invalidateCache();
      return this.mapRate(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Валюта с таким кодом уже существует');
      }
      throw error;
    }
  }

  private async requireRate(idOrCurrency: string) {
    const row = await this.prisma.currencyRate.findFirst({
      where: {
        OR: [
          { id: idOrCurrency },
          { currency: idOrCurrency.trim().toUpperCase() },
        ],
      },
    });

    if (!row) {
      throw new NotFoundException('Валюта не найдена');
    }

    return row;
  }

  private async invalidateCache() {
    await this.cache.del(cacheKeys.storeCurrencies());
  }

  private mapRate(row: {
    id: string;
    currency: string;
    rate: { toString(): string } | number;
    symbol: string;
    flag: string;
    isActive: boolean;
    updatedAt: Date;
  }): CurrencyRate {
    return {
      id: row.id,
      currency: row.currency,
      rate: decimalToNumber(row.rate),
      symbol: row.symbol,
      flag: row.flag,
      isActive: row.isActive,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
