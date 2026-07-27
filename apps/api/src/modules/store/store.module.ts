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
import {
  AdminProductsController,
  ProductsController,
} from './products.controller';
import { ProductsService } from './products.service';
import { PricingService } from './pricing.service';
import {
  AdminPromocodesController,
  PromocodesController,
} from './promocodes.controller';
import { PromocodesService } from './promocodes.service';

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
  ],
  providers: [
    CategoriesService,
    ProductsService,
    BundlesService,
    PricingService,
    CartService,
    PromocodesService,
  ],
  exports: [
    CategoriesService,
    ProductsService,
    BundlesService,
    CartService,
    PricingService,
  ],
})
export class StoreModule {}
