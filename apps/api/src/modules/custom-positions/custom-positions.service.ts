import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CustomPosition as CustomPositionRow, Prisma } from '@prisma/client';
import { CustomPosition } from '@twomc/shared';
import { PrismaService } from '../prisma/prisma.service';
import { toCustomPosition } from './custom-position.mapper';
import { CreateCustomPositionDto } from './dto/create-custom-position.dto';
import { UpdateCustomPositionDto } from './dto/update-custom-position.dto';

@Injectable()
export class CustomPositionsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic(): Promise<CustomPosition[]> {
    const rows = await this.prisma.customPosition.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return rows.map(toCustomPosition);
  }

  async listAdmin(): Promise<CustomPosition[]> {
    const rows = await this.prisma.customPosition.findMany({ orderBy: { name: 'asc' } });

    return rows.map(toCustomPosition);
  }

  async create(dto: CreateCustomPositionDto, createdBy: string): Promise<CustomPosition> {
    try {
      const row = await this.prisma.customPosition.create({
        data: {
          name: dto.name.trim(),
          slug: dto.slug.trim(),
          description: dto.description?.trim() || null,
          color: dto.color ?? null,
          icon: dto.icon?.trim() || null,
          isActive: dto.isActive ?? true,
          createdBy,
        },
      });

      return toCustomPosition(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Кастомная должность с таким slug уже существует');
      }

      throw error;
    }
  }

  async update(id: string, dto: UpdateCustomPositionDto): Promise<CustomPosition> {
    await this.requireCustomPosition(id);

    try {
      const row = await this.prisma.customPosition.update({
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
        },
      });

      return toCustomPosition(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Кастомная должность с таким slug уже существует');
      }

      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.requireCustomPosition(id);
    await this.prisma.customPosition.delete({ where: { id } });
  }

  async assign(userId: string, customPositionId: string, assignedBy: string): Promise<void> {
    await this.requireUser(userId);
    await this.requireCustomPosition(customPositionId);

    await this.prisma.userCustomPosition.upsert({
      where: { userId },
      create: { userId, customPositionId, assignedBy },
      update: { customPositionId, assignedBy, assignedAt: new Date() },
    });
  }

  async unassign(userId: string): Promise<void> {
    await this.requireUser(userId);

    const row = await this.prisma.userCustomPosition.findUnique({ where: { userId } });

    if (!row) {
      throw new NotFoundException('Кастомная должность не найдена');
    }

    await this.prisma.userCustomPosition.delete({ where: { userId } });
  }

  private async requireCustomPosition(id: string): Promise<CustomPositionRow> {
    const row = await this.prisma.customPosition.findUnique({ where: { id } });

    if (!row) {
      throw new NotFoundException('Кастомная должность не найдена');
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
