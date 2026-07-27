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
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateServerDto, UpdateServerDto } from './dto/server.dto';
import { ServersService } from './servers.service';

@Controller('admin/servers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleGroup.ADMIN)
export class AdminServersController {
  constructor(private readonly servers: ServersService) {}

  @Get()
  list(): Promise<GameServer[]> {
    return this.servers.listAllAdmin();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateServerDto): Promise<GameServer> {
    return this.servers.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateServerDto): Promise<GameServer> {
    return this.servers.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.servers.remove(id);
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
