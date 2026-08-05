import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Department as DepartmentRow, Prisma } from '@prisma/client';
import { Department, MAX_USER_DEPARTMENTS } from '@twomc/shared';
import { PrismaService } from '../prisma/prisma.service';
import { toDepartment } from './department.mapper';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { ReorderDepartmentsDto } from './dto/reorder-departments.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic(): Promise<Department[]> {
    const rows = await this.prisma.department.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    return rows.map(toDepartment);
  }

  async listAdmin(): Promise<Department[]> {
    const rows = await this.prisma.department.findMany({ orderBy: { order: 'asc' } });

    return rows.map(toDepartment);
  }

  async create(dto: CreateDepartmentDto, createdBy: string): Promise<Department> {
    try {
      const row = await this.prisma.department.create({
        data: {
          name: dto.name.trim(),
          slug: dto.slug.trim(),
          description: dto.description?.trim() || null,
          color: dto.color ?? null,
          icon: dto.icon?.trim() || null,
          isActive: dto.isActive ?? true,
          order: dto.order ?? 0,
          createdBy,
        },
      });

      return toDepartment(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Отдел с таким slug уже существует');
      }

      throw error;
    }
  }

  async update(id: string, dto: UpdateDepartmentDto): Promise<Department> {
    await this.requireDepartment(id);

    try {
      const row = await this.prisma.department.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.slug !== undefined ? { slug: dto.slug.trim() } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description.trim() || null }
            : {}),
          ...(dto.color !== undefined ? { color: dto.color || null } : {}),
          ...(dto.icon !== undefined ? { icon: dto.icon.trim() || null } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
          ...(dto.order !== undefined ? { order: dto.order } : {}),
        },
      });

      return toDepartment(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Отдел с таким slug уже существует');
      }

      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.requireDepartment(id);
    await this.prisma.department.delete({ where: { id } });
  }

  async assign(userId: string, departmentId: string, assignedBy: string): Promise<void> {
    await this.requireUser(userId);
    await this.requireDepartment(departmentId);

    const count = await this.prisma.userDepartment.count({ where: { userId } });

    if (count >= MAX_USER_DEPARTMENTS) {
      throw new BadRequestException('Максимум 3 отдела на игрока');
    }

    const existing = await this.prisma.userDepartment.findUnique({
      where: { userId_departmentId: { userId, departmentId } },
    });

    if (existing) {
      throw new ConflictException('Отдел уже назначен');
    }

    const maxOrder = await this.prisma.userDepartment.aggregate({
      where: { userId },
      _max: { order: true },
    });

    await this.prisma.userDepartment.create({
      data: {
        userId,
        departmentId,
        assignedBy,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });
  }

  async unassign(userId: string, departmentId: string): Promise<void> {
    await this.requireUser(userId);

    const row = await this.prisma.userDepartment.findUnique({
      where: { userId_departmentId: { userId, departmentId } },
    });

    if (!row) {
      throw new NotFoundException('Отдел не найден у игрока');
    }

    await this.prisma.userDepartment.delete({
      where: { userId_departmentId: { userId, departmentId } },
    });
  }

  async reorder(userId: string, dto: ReorderDepartmentsDto): Promise<void> {
    await this.requireUser(userId);

    const rows = await this.prisma.userDepartment.findMany({
      where: { userId },
      select: { departmentId: true },
    });

    const existingIds = new Set(rows.map((r) => r.departmentId));
    const requestedIds = dto.orders.map((o) => o.departmentId);

    if (
      requestedIds.length !== existingIds.size ||
      requestedIds.some((id) => !existingIds.has(id))
    ) {
      throw new BadRequestException('Список отделов не совпадает с назначенными');
    }

    await this.prisma.$transaction(
      dto.orders.map((item) =>
        this.prisma.userDepartment.update({
          where: { userId_departmentId: { userId, departmentId: item.departmentId } },
          data: { order: item.order },
        }),
      ),
    );
  }

  private async requireDepartment(id: string): Promise<DepartmentRow> {
    const row = await this.prisma.department.findUnique({ where: { id } });

    if (!row) {
      throw new NotFoundException('Отдел не найден');
    }

    return row;
  }

  private async requireUser(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
  }
}
