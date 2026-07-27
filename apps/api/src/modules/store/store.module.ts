import { Module } from '@nestjs/common';
import { AdminBundlesController, BundlesController } from './bundles.controller';
import { BundlesService } from './bundles.service';
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

@Module({
  controllers: [
    CategoriesController,
    AdminCategoriesController,
    ProductsController,
    AdminProductsController,
    BundlesController,
    AdminBundlesController,
  ],
  providers: [CategoriesService, ProductsService, BundlesService],
  exports: [CategoriesService, ProductsService, BundlesService],
})
export class StoreModule {}
