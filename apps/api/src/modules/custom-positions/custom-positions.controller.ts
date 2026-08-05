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
import { CustomPosition, RoleGroup } from '@twomc/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CustomPositionsService } from './custom-positions.service';
import { AssignCustomPositionDto } from './dto/assign-custom-position.dto';
import { CreateCustomPositionDto } from './dto/create-custom-position.dto';
import { UpdateCustomPositionDto } from './dto/update-custom-position.dto';

@Controller()
export class CustomPositionsController {
  constructor(private readonly customPositions: CustomPositionsService) {}

  @Get('custom-positions')
  listPublic(): Promise<CustomPosition[]> {
    return this.customPositions.listPublic();
  }

  @Get('admin/custom-positions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.OWNER)
  listAdmin(): Promise<CustomPosition[]> {
    return this.customPositions.listAdmin();
  }

  @Post('admin/custom-positions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.OWNER)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateCustomPositionDto,
    @CurrentUser('id') actorId: string,
  ): Promise<CustomPosition> {
    return this.customPositions.create(dto, actorId);
  }

  @Patch('admin/custom-positions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.OWNER)
  update(@Param('id') id: string, @Body() dto: UpdateCustomPositionDto): Promise<CustomPosition> {
    return this.customPositions.update(id, dto);
  }

  @Delete('admin/custom-positions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.customPositions.remove(id);
  }

  @Post('admin/users/:userId/custom-position')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  assign(
    @Param('userId') userId: string,
    @Body() dto: AssignCustomPositionDto,
    @CurrentUser('id') actorId: string,
  ): Promise<void> {
    return this.customPositions.assign(userId, dto.customPositionId, actorId);
  }

  @Delete('admin/users/:userId/custom-position')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  unassign(@Param('userId') userId: string): Promise<void> {
    return this.customPositions.unassign(userId);
  }
}
