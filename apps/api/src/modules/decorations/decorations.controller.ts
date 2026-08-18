import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { RoleGroup } from '@twomc/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { DecorationsService } from './decorations.service';
import { GrantDecorationDto, SelectDecorationDto, UpdateDecorationDto } from './dto/decorations.dto';

@Controller('decorations')
export class DecorationsController {
  constructor(private readonly decorations: DecorationsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  catalog(@CurrentUser('id') userId?: string) {
    return this.decorations.catalog(userId);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  mine(@CurrentUser('id') userId: string) {
    return this.decorations.owned(userId);
  }

  @Patch('selected')
  @UseGuards(JwtAuthGuard)
  select(@CurrentUser('id') userId: string, @Body() dto: SelectDecorationDto) {
    return this.decorations.select(userId, dto.decorationId);
  }
}

@Controller('admin/decorations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleGroup.ADMIN)
export class AdminDecorationsController {
  constructor(private readonly decorations: DecorationsService) {}

  @Get()
  catalog() { return this.decorations.adminCatalog(); }

  @Get('ownerships')
  ownerships(@Query('user') user: string) { return this.decorations.userOwnerships(user); }

  @Post('grant')
  grant(@Body() dto: GrantDecorationDto, @CurrentUser('id') actorId: string) {
    return this.decorations.grant(dto.user, dto.decorationId, actorId);
  }

  @Delete(':decorationId/users/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  revoke(@Param('decorationId') decorationId: string, @Param('userId') userId: string) {
    return this.decorations.revoke(userId, decorationId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDecorationDto) {
    return this.decorations.update(id, dto);
  }
}
