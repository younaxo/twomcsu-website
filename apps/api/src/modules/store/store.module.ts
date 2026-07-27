import { Module } from '@nestjs/common';
import { AdminBundlesController, BundlesController } from './bundles.controller';
import { BundlesService } from './bundles.service';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import {
  AdminCategoriesController,
  CategoriesController,
} from './categories.controller';
import { CategoriesService } from './categories.service';
import { AdminOrdersController, OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PricingService } from './pricing.service';
import {
  AdminProductsController,
  ProductsController,
} from './products.controller';
import { ProductsService } from './products.service';
import {
  AdminPromocodesController,
  PromocodesController,
} from './promocodes.controller';
import { PromocodesService } from './promocodes.service';
import { WishlistController } from './wishlist.controller';
import { WishlistService } from './wishlist.service';

@Module({
  controllers: [
    CategoriesController,
    AdminCategoriesController,
    ProductsController,
    AdminProductsController,
    BundlesController,
    AdminBundlesController,
    CartController,
    PromocodesController,
    AdminPromocodesController,
    WishlistController,
    OrdersController,
    AdminOrdersController,
  ],
  providers: [
    CategoriesService,
    ProductsService,
    BundlesService,
    PricingService,
    CartService,
    PromocodesService,
    WishlistService,
    OrdersService,
  ],
  exports: [
    CategoriesService,
    ProductsService,
    BundlesService,
    CartService,
    OrdersService,
    PricingService,
  ],
})
export class StoreModule {}
