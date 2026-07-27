import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ProductType,
  ProductVariant,
  RoleGroup,
  StoreProduct,
  StoreProductsResponse,
} from '@twomc/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedUser } from '../auth/authenticated-user';
import {
  CreateProductDto,
  CreateVariantDto,
  UpdateProductDto,
  UpdateVariantDto,
} from './dto/store.dto';
import { ProductsService } from './products.service';

@Controller('store/products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list(
    @Query('category') category?: string,
    @Query('type') type?: ProductType,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('sort') sort?: 'popular' | 'price_asc' | 'price_desc' | 'newest' | 'featured',
    @Query('search') search?: string,
    @Query('featured', new DefaultValuePipe(undefined)) featured?: string,
    @Query('isNew', new DefaultValuePipe(undefined)) isNew?: string,
    @Query('isPopular', new DefaultValuePipe(undefined)) isPopular?: string,
  ): Promise<StoreProductsResponse> {
    return this.products.list({
      category,
      type,
      page,
      limit,
      sort,
      search,
      featured: parseOptionalBool(featured),
      isNew: parseOptionalBool(isNew),
      isPopular: parseOptionalBool(isPopular),
    });
  }

  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  getBySlug(
    @Param('slug') slug: string,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<StoreProduct> {
    return this.products.getBySlug(slug, user?.id);
  }
}

@Controller('admin/store/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleGroup.ADMIN)
export class AdminProductsController {
  constructor(private readonly products: ProductsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateProductDto): Promise<StoreProduct> {
    return this.products.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto): Promise<StoreProduct> {
    return this.products.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.products.remove(id);
  }

  @Post(':id/variants')
  @HttpCode(HttpStatus.CREATED)
  createVariant(
    @Param('id') id: string,
    @Body() dto: CreateVariantDto,
  ): Promise<ProductVariant> {
    return this.products.createVariant(id, dto);
  }

  @Patch(':id/variants/:variantId')
  updateVariant(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateVariantDto,
  ): Promise<ProductVariant> {
    return this.products.updateVariant(id, variantId, dto);
  }

  @Delete(':id/variants/:variantId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeVariant(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
  ): Promise<void> {
    return this.products.removeVariant(id, variantId);
  }
}

function parseOptionalBool(value?: string): boolean | undefined {
  if (value === undefined || value === '') return undefined;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return undefined;
}
