import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CurrencyExchangeRequest,
  CurrencyExchangeResponse,
  CurrencyRate,
  GameCurrencyRates,
} from '@twomc/shared';
import { CACHE_TTL, cacheKeys } from '../cache/cache.keys';
import { CacheService } from '../cache/cache.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCurrencyRateDto, UpdateCurrencyRateDto } from './dto/store.dto';
import { decimalToNumber } from './store.mapper';

const DEFAULT_BULK_DISCOUNTS = [
  { minAmount: 500, bonusPercent: 5 },
  { minAmount: 1000, bonusPercent: 10 },
  { minAmount: 3000, bonusPercent: 15 },
  { minAmount: 5000, bonusPercent: 20 },
] as const;

const DEFAULT_EXCHANGE = {
  rubies_to_coins: 3,
  rubies_to_bp_xp: 15,
} as const;

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

  async getGameCurrencyRates(): Promise<GameCurrencyRates> {
    return this.cache.wrap(
      cacheKeys.storeCurrencyRates(),
      CACHE_TTL.STORE_DISCOUNTS,
      async () => {
        const products = await this.prisma.product.findMany({
          where: {
            type: 'CURRENCY',
            isActive: true,
            currencyType: { in: ['RUBIES', 'COINS'] },
          },
          select: {
            currencyType: true,
            currencyAmount: true,
          },
        });

        const rubies = products.find((p) => p.currencyType === 'RUBIES');
        const coins = products.find((p) => p.currencyType === 'COINS');

        return {
          purchase: {
            rubies: {
              rate: rubies?.currencyAmount ?? 2,
              symbol: '💎',
            },
            coins: {
              rate: coins?.currencyAmount ?? 8,
              symbol: '🪙',
            },
          },
          exchange: { ...DEFAULT_EXCHANGE },
          bulkDiscounts: DEFAULT_BULK_DISCOUNTS.map((t) => ({ ...t })),
        };
      },
    );
  }

  /**
   * Mock exchange — no player balances yet.
   * TODO: wire to real currency balances in economy stage.
   */
  async exchange(
    _userId: string,
    dto: CurrencyExchangeRequest,
  ): Promise<CurrencyExchangeResponse> {
    if (dto.fromCurrency === dto.toCurrency) {
      return {
        success: false,
        fromCurrency: dto.fromCurrency,
        toCurrency: dto.toCurrency,
        amount: dto.amount,
        resultAmount: 0,
        rate: 0,
        message: 'Выберите разные валюты',
      };
    }

    const rates = await this.getGameCurrencyRates();
    let rate = 0;

    if (dto.fromCurrency === 'RUBIES' && dto.toCurrency === 'COINS') {
      rate = rates.exchange.rubies_to_coins;
    } else if (dto.fromCurrency === 'RUBIES' && dto.toCurrency === 'BP_XP') {
      rate = rates.exchange.rubies_to_bp_xp;
    } else if (dto.fromCurrency === 'COINS' && dto.toCurrency === 'RUBIES') {
      rate = 1 / rates.exchange.rubies_to_coins;
    } else if (dto.fromCurrency === 'BP_XP' && dto.toCurrency === 'RUBIES') {
      rate = 1 / rates.exchange.rubies_to_bp_xp;
    } else {
      return {
        success: false,
        fromCurrency: dto.fromCurrency,
        toCurrency: dto.toCurrency,
        amount: dto.amount,
        resultAmount: 0,
        rate: 0,
        message: 'Такой обмен пока недоступен',
      };
    }

    const resultAmount = Math.floor(dto.amount * rate);

    return {
      success: true,
      fromCurrency: dto.fromCurrency,
      toCurrency: dto.toCurrency,
      amount: dto.amount,
      resultAmount,
      rate,
      message: 'Обмен выполнен (мок). Балансы появятся на этапе экономики.',
    };
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
    await this.cache.del(cacheKeys.storeCurrencyRates());
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
