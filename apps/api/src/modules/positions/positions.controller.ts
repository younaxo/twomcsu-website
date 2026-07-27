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
  Query,
  UseGuards,
} from '@nestjs/common';
import { PositionDetails, PositionSummary, RoleGroup } from '@twomc/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AssignPositionDto } from './dto/assign-position.dto';
import { CreatePositionDto } from './dto/create-position.dto';
import { ListPositionsDto } from './dto/list-positions.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { PositionsService } from './positions.service';

@Controller('positions')
export class PositionsController {
  constructor(private readonly positions: PositionsService) {}

  @Get()
  list(@Query() query: ListPositionsDto): Promise<PositionSummary[]> {
    return this.positions.findAll(query.group);
  }

  /** Same list plus hidden positions, feeds the admin panel */
  @Get('manage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.ADMIN)
  listAll(@Query() query: ListPositionsDto): Promise<PositionSummary[]> {
    return this.positions.findAll(query.group, true);
  }

  @Get(':slug')
  find(@Param('slug') slug: string): Promise<PositionDetails> {
    return this.positions.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.OWNER)
  create(@Body() dto: CreatePositionDto): Promise<PositionSummary> {
    return this.positions.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.OWNER)
  update(@Param('id') id: string, @Body() dto: UpdatePositionDto): Promise<PositionSummary> {
    return this.positions.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.positions.remove(id);
  }

  @Post(':id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  assign(
    @Param('id') id: string,
    @Body() dto: AssignPositionDto,
    @CurrentUser('roleGroup') actorRole: RoleGroup,
  ): Promise<void> {
    return this.positions.assign(id, dto.userId, actorRole);
  }
}
