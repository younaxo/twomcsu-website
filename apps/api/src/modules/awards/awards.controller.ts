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
import { Award, RoleGroup } from '@twomc/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AwardsService } from './awards.service';
import { CreateAwardDto } from './dto/create-award.dto';
import { UpdateAwardDto } from './dto/update-award.dto';

@Controller()
export class AwardsController {
  constructor(private readonly awards: AwardsService) {}

  @Get('awards')
  listPublic(): Promise<Award[]> {
    return this.awards.listPublic();
  }

  @Get('admin/awards')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.ADMIN)
  listAdmin(): Promise<Award[]> {
    return this.awards.listAdmin();
  }

  @Post('admin/awards')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.OWNER)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateAwardDto): Promise<Award> {
    return this.awards.create(dto);
  }

  @Patch('admin/awards/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.OWNER)
  update(@Param('id') id: string, @Body() dto: UpdateAwardDto): Promise<Award> {
    return this.awards.update(id, dto);
  }

  @Delete('admin/awards/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.awards.remove(id);
  }

  @Post('admin/users/:userId/awards/:awardId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  assign(
    @Param('userId') userId: string,
    @Param('awardId') awardId: string,
    @CurrentUser('id') actorId: string,
  ): Promise<void> {
    return this.awards.assign(userId, awardId, actorId);
  }

  @Delete('admin/users/:userId/awards/:awardId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  revoke(
    @Param('userId') userId: string,
    @Param('awardId') awardId: string,
  ): Promise<void> {
    return this.awards.revoke(userId, awardId);
  }
}
