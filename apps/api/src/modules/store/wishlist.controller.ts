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
  CartResponse,
  PublicWishlistResponse,
  WishlistResponse,
} from '@twomc/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GiftWishlistItemDto, UpdateWishlistDto } from './dto/store.dto';
import { WishlistService } from './wishlist.service';

@Controller('store/wishlist')
export class WishlistController {
  constructor(private readonly wishlist: WishlistService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getWishlist(@CurrentUser('id') userId: string): Promise<WishlistResponse> {
    return this.wishlist.getWishlist(userId);
  }

  @Post('items/:productId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  addItem(
    @CurrentUser('id') userId: string,
    @Param('productId') productId: string,
  ): Promise<WishlistResponse> {
    return this.wishlist.addItem(userId, productId);
  }

  @Delete('items/:productId')
  @UseGuards(JwtAuthGuard)
  removeItem(
    @CurrentUser('id') userId: string,
    @Param('productId') productId: string,
  ): Promise<WishlistResponse> {
    return this.wishlist.removeItem(userId, productId);
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  updateVisibility(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateWishlistDto,
  ): Promise<WishlistResponse> {
    return this.wishlist.updateVisibility(userId, dto.isPublic);
  }

  @Post('items/:productId/gift')
  @UseGuards(JwtAuthGuard)
  giftItem(
    @CurrentUser('id') userId: string,
    @Param('productId') productId: string,
    @Body() dto: GiftWishlistItemDto,
  ): Promise<{ cart: CartResponse }> {
    return this.wishlist.giftFromWishlist(userId, productId, dto.giftToUsername);
  }

  @Get(':username')
  getPublic(@Param('username') username: string): Promise<PublicWishlistResponse> {
    return this.wishlist.getPublicByUsername(username);
  }
}
