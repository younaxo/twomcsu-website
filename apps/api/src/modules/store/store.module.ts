import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminBundlesController, BundlesController } from './bundles.controller';
import { BundlesService } from './bundles.service';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import {
  AdminCategoriesController,
  CategoriesController,
} from './categories.controller';
import { CategoriesService } from './categories.service';
import {
  AdminCurrenciesController,
  CurrenciesController,
} from './currencies.controller';
import { CurrenciesService } from './currencies.service';
import {
  AdminDiscountsController,
  DiscountsController,
} from './discounts.controller';
import { DiscountsService } from './discounts.service';
import {
  AdminOrdersController,
  OrdersController,
  StoreExtrasController,
} from './orders.controller';
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
  imports: [NotificationsModule],
  controllers: [
    CategoriesController,
    AdminCategoriesController,
    ProductsController,
    AdminProductsController,
    BundlesController,
    AdminBundlesController,
    DiscountsController,
    AdminDiscountsController,
    CurrenciesController,
    AdminCurrenciesController,
    CartController,
    PromocodesController,
    AdminPromocodesController,
    WishlistController,
    StoreExtrasController,
    OrdersController,
    AdminOrdersController,
  ],
  providers: [
    CategoriesService,
    ProductsService,
    BundlesService,
    DiscountsService,
    PricingService,
    CartService,
    PromocodesService,
    WishlistService,
    OrdersService,
    CurrenciesService,
  ],
  exports: [
    CategoriesService,
    ProductsService,
    BundlesService,
    CartService,
    OrdersService,
    PricingService,
    DiscountsService,
    CurrenciesService,
  ],
})
export class StoreModule {}
