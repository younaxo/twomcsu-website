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
import { RoleGroup } from '@twomc/shared';
import type { ServerCategory } from '@twomc/shared';
import { AuditService } from '../admin/audit.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  CreateServerCategoryDto,
  UpdateServerCategoryDto,
} from './dto/server.dto';
import { ServerCategoriesService } from './server-categories.service';

@Controller()
export class ServerCategoriesController {
  constructor(private readonly categories: ServerCategoriesService) {}

  @Get('server-categories')
  list(): Promise<ServerCategory[]> {
    return this.categories.listActive();
  }
}

@Controller('admin/server-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleGroup.ADMIN)
export class AdminServerCategoriesController {
  constructor(
    private readonly categories: ServerCategoriesService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  listAdmin(): Promise<ServerCategory[]> {
    return this.categories.listAllAdmin();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser('id') actorId: string,
    @Body() dto: CreateServerCategoryDto,
  ): Promise<ServerCategory> {
    const row = await this.categories.create(dto);
    await this.audit.log({
      actorId,
      action: 'server_category.create',
      targetType: 'ServerCategory',
      targetId: row.id,
      changes: { after: JSON.parse(JSON.stringify(row)) },
    });
    return row;
  }

  @Patch(':id')
  async update(
    @CurrentUser('id') actorId: string,
    @Param('id') id: string,
    @Body() dto: UpdateServerCategoryDto,
  ): Promise<ServerCategory> {
    const row = await this.categories.update(id, dto);
    await this.audit.log({
      actorId,
      action: 'server_category.update',
      targetType: 'ServerCategory',
      targetId: id,
      changes: { after: JSON.parse(JSON.stringify(row)) },
    });
    return row;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser('id') actorId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.categories.remove(id);
    await this.audit.log({
      actorId,
      action: 'server_category.delete',
      targetType: 'ServerCategory',
      targetId: id,
    });
  }
}
