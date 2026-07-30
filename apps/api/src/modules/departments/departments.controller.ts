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
import { Department, RoleGroup } from '@twomc/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { DepartmentsService } from './departments.service';
import { AssignDepartmentDto } from './dto/assign-department.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { ReorderDepartmentsDto } from './dto/reorder-departments.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Controller()
export class DepartmentsController {
  constructor(private readonly departments: DepartmentsService) {}

  @Get('departments')
  listPublic(): Promise<Department[]> {
    return this.departments.listPublic();
  }

  @Get('admin/departments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.OWNER)
  listAdmin(): Promise<Department[]> {
    return this.departments.listAdmin();
  }

  @Post('admin/departments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.OWNER)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateDepartmentDto,
    @CurrentUser('id') actorId: string,
  ): Promise<Department> {
    return this.departments.create(dto, actorId);
  }

  @Patch('admin/departments/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.OWNER)
  update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto): Promise<Department> {
    return this.departments.update(id, dto);
  }

  @Delete('admin/departments/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.departments.remove(id);
  }

  @Post('admin/users/:userId/departments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  assign(
    @Param('userId') userId: string,
    @Body() dto: AssignDepartmentDto,
    @CurrentUser('id') actorId: string,
  ): Promise<void> {
    return this.departments.assign(userId, dto.departmentId, actorId);
  }

  @Delete('admin/users/:userId/departments/:departmentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  unassign(
    @Param('userId') userId: string,
    @Param('departmentId') departmentId: string,
  ): Promise<void> {
    return this.departments.unassign(userId, departmentId);
  }

  @Patch('admin/users/:userId/departments/order')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  reorder(@Param('userId') userId: string, @Body() dto: ReorderDepartmentsDto): Promise<void> {
    return this.departments.reorder(userId, dto);
  }
}
