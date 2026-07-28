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
import { RoleGroup, StoreBundle } from '@twomc/shared';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BundlesService } from './bundles.service';
import { CreateBundleDto, UpdateBundleDto } from './dto/store.dto';

@Controller('store/bundles')
export class BundlesController {
  constructor(private readonly bundles: BundlesService) {}

  @Get()
  list(): Promise<StoreBundle[]> {
    return this.bundles.list();
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string): Promise<StoreBundle> {
    return this.bundles.getBySlug(slug);
  }
}

@Controller('admin/store/bundles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleGroup.ADMIN)
export class AdminBundlesController {
  constructor(private readonly bundles: BundlesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateBundleDto): Promise<StoreBundle> {
    return this.bundles.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBundleDto): Promise<StoreBundle> {
    return this.bundles.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.bundles.remove(id);
  }
}
