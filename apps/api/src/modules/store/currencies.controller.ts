import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  CurrencyExchangeResponse,
  CurrencyRate,
  GameCurrencyRates,
  RoleGroup,
} from '@twomc/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrenciesService } from './currencies.service';
import {
  CreateCurrencyRateDto,
  CurrencyExchangeDto,
  UpdateCurrencyRateDto,
} from './dto/store.dto';

@Controller('store')
export class GameCurrencyController {
  constructor(private readonly currencies: CurrenciesService) {}

  @Get('currency-rates')
  getGameRates(): Promise<GameCurrencyRates> {
    return this.currencies.getGameCurrencyRates();
  }

  @Post('exchange')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  exchange(
    @CurrentUser('id') userId: string,
    @Body() dto: CurrencyExchangeDto,
  ): Promise<CurrencyExchangeResponse> {
    return this.currencies.exchange(userId, dto);
  }
}

@Controller('store/currencies')
export class CurrenciesController {
  constructor(private readonly currencies: CurrenciesService) {}

  @Get()
  listActive(): Promise<CurrencyRate[]> {
    return this.currencies.listActive();
  }
}

@Controller('admin/store/currencies')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleGroup.ADMIN)
export class AdminCurrenciesController {
  constructor(private readonly currencies: CurrenciesService) {}

  @Get()
  listAdmin(): Promise<CurrencyRate[]> {
    return this.currencies.listAdmin();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCurrencyRateDto): Promise<CurrencyRate> {
    return this.currencies.create(dto);
  }

  @Patch(':currency')
  update(
    @Param('currency') currency: string,
    @Body() dto: UpdateCurrencyRateDto,
  ): Promise<CurrencyRate> {
    return this.currencies.update(currency, dto);
  }
}
