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
import { CartResponse } from '@twomc/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CartService } from './cart.service';
import {
  AddCartItemDto,
  ApplyPromoDto,
  CalculateCartDto,
  UpdateCartItemDto,
} from './dto/store.dto';

@Controller('store/cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  getCart(@CurrentUser('id') userId: string): Promise<CartResponse> {
    return this.cart.getCart(userId);
  }

  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  addItem(
    @CurrentUser('id') userId: string,
    @Body() dto: AddCartItemDto,
  ): Promise<CartResponse> {
    return this.cart.addItem(userId, dto);
  }

  @Patch('items/:id')
  updateItem(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
  ): Promise<CartResponse> {
    return this.cart.updateItem(userId, id, dto);
  }

  @Delete('items/:id')
  removeItem(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<CartResponse> {
    return this.cart.removeItem(userId, id);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  clear(@CurrentUser('id') userId: string): Promise<CartResponse> {
    return this.cart.clear(userId);
  }

  @Post('apply-promo')
  applyPromo(
    @CurrentUser('id') userId: string,
    @Body() dto: ApplyPromoDto,
  ): Promise<CartResponse> {
    return this.cart.applyPromo(userId, dto.code);
  }

  @Delete('promo')
  removePromo(@CurrentUser('id') userId: string): Promise<CartResponse> {
    return this.cart.removePromo(userId);
  }

  @Post('calculate')
  calculate(
    @CurrentUser('id') userId: string,
    @Body() dto: CalculateCartDto,
  ): Promise<CartResponse> {
    return this.cart.calculate(userId, dto.promoCode);
  }
}
