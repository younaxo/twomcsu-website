import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  BulkDiscount,
  LoyaltyDiscount,
  RoleGroup,
} from '@twomc/shared';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { DiscountsService } from './discounts.service';
import {
  CreateBulkDiscountDto,
  CreateLoyaltyDiscountDto,
  UpdateBulkDiscountDto,
  UpdateLoyaltyDiscountDto,
} from './dto/store.dto';

@Controller('store/discounts')
export class DiscountsController {
  constructor(private readonly discounts: DiscountsService) {}

  @Get('bulk')
  listBulk(): Promise<BulkDiscount[]> {
    return this.discounts.listBulk();
  }

  @Get('loyalty')
  listLoyalty(): Promise<LoyaltyDiscount[]> {
    return this.discounts.listLoyalty();
  }
}

@Controller('admin/store/discounts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleGroup.ADMIN)
export class AdminDiscountsController {
  constructor(private readonly discounts: DiscountsService) {}

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  createBulk(@Body() dto: CreateBulkDiscountDto): Promise<BulkDiscount> {
    return this.discounts.createBulk(dto);
  }

  @Patch('bulk/:id')
  updateBulk(
    @Param('id') id: string,
    @Body() dto: UpdateBulkDiscountDto,
  ): Promise<BulkDiscount> {
    return this.discounts.updateBulk(id, dto);
  }

  @Delete('bulk/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeBulk(@Param('id') id: string): Promise<void> {
    return this.discounts.removeBulk(id);
  }

  @Post('loyalty')
  @HttpCode(HttpStatus.CREATED)
  createLoyalty(@Body() dto: CreateLoyaltyDiscountDto): Promise<LoyaltyDiscount> {
    return this.discounts.createLoyalty(dto);
  }

  @Patch('loyalty/:id')
  updateLoyalty(
    @Param('id') id: string,
    @Body() dto: UpdateLoyaltyDiscountDto,
  ): Promise<LoyaltyDiscount> {
    return this.discounts.updateLoyalty(id, dto);
  }

  @Delete('loyalty/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeLoyalty(@Param('id') id: string): Promise<void> {
    return this.discounts.removeLoyalty(id);
  }
}
