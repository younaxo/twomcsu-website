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
import { CurrencyRate, RoleGroup } from '@twomc/shared';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrenciesService } from './currencies.service';
import { CreateCurrencyRateDto, UpdateCurrencyRateDto } from './dto/store.dto';

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
