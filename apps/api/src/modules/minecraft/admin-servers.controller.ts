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
import { RoleGroup } from '@twomc/shared';
import type { GameServer, ServerStatusLogRow } from '@twomc/shared';
import { AuditService } from '../admin/audit.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateServerDto, UpdateServerDto } from './dto/server.dto';
import { ServersService } from './servers.service';

@Controller('admin/servers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleGroup.ADMIN)
export class AdminServersController {
  constructor(
    private readonly servers: ServersService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  list(): Promise<GameServer[]> {
    return this.servers.listAllAdmin();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser('id') actorId: string,
    @Body() dto: CreateServerDto,
  ): Promise<GameServer> {
    const row = await this.servers.create(dto);
    await this.audit.log({
      actorId,
      action: 'server.create',
      targetType: 'Server',
      targetId: row.id,
      changes: { after: JSON.parse(JSON.stringify(row)) },
    });
    return row;
  }

  @Patch(':id')
  async update(
    @CurrentUser('id') actorId: string,
    @Param('id') id: string,
    @Body() dto: UpdateServerDto,
  ): Promise<GameServer> {
    const row = await this.servers.update(id, dto);
    await this.audit.log({
      actorId,
      action: 'server.update',
      targetType: 'Server',
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
    await this.servers.remove(id);
    await this.audit.log({
      actorId,
      action: 'server.delete',
      targetType: 'Server',
      targetId: id,
    });
  }

  @Get(':id/logs')
  logs(
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<{ items: ServerStatusLogRow[]; total: number; page: number; limit: number }> {
    return this.servers.getLogs(id, {
      page,
      limit,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }
}
