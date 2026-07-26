import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PositionDetails, PositionSummary, RoleGroup, hasRoleGroup } from '@twomc/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';

const summarySelect = {
  id: true,
  name: true,
  slug: true,
  displayName: true,
  group: true,
  color: true,
  backgroundColor: true,
  icon: true,
  priority: true,
  description: true,
  isVisible: true,
  isDefault: true,
  _count: { select: { users: true } },
} satisfies Prisma.PositionSelect;

const detailsSelect = {
  ...summarySelect,
  createdAt: true,
  updatedAt: true,
  users: {
    select: { id: true, username: true, avatar: true },
    orderBy: { username: 'asc' },
    take: 100,
  },
} satisfies Prisma.PositionSelect;

type SummaryRow = Prisma.PositionGetPayload<{ select: typeof summarySelect }>;
type DetailsRow = Prisma.PositionGetPayload<{ select: typeof detailsSelect }>;

/** OWNER first, then the most senior title inside the group */
const listOrder: Prisma.PositionOrderByWithRelationInput[] = [
  { group: 'desc' },
  { priority: 'desc' },
  { name: 'asc' },
];

@Injectable()
export class PositionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(group?: RoleGroup, includeHidden = false): Promise<PositionSummary[]> {
    const positions = await this.prisma.position.findMany({
      where: { group, ...(includeHidden ? {} : { isVisible: true }) },
      orderBy: listOrder,
      select: summarySelect,
    });

    return positions.map((position) => this.toSummary(position));
  }

  async findBySlug(slug: string): Promise<PositionDetails> {
    const position = await this.prisma.position.findUnique({
      where: { slug },
      select: detailsSelect,
    });

    if (!position) {
      throw new NotFoundException('Позиция не найдена');
    }

    return this.toDetails(position);
  }

  async create(dto: CreatePositionDto): Promise<PositionSummary> {
    const data = {
      name: dto.name,
      slug: dto.slug,
      displayName: dto.displayName ?? dto.name,
      group: dto.group,
      color: dto.color,
      backgroundColor: dto.backgroundColor ?? null,
      icon: dto.icon ?? null,
      priority: dto.priority ?? 0,
      description: dto.description ?? null,
      isVisible: dto.isVisible ?? true,
      isDefault: dto.isDefault ?? false,
    };

    const position = await this.prisma
      .$transaction(async (tx) => {
        if (data.isDefault) {
          await tx.position.updateMany({
            where: { group: data.group, isDefault: true },
            data: { isDefault: false },
          });
        }

        return tx.position.create({ data, select: summarySelect });
      })
      .catch((error: unknown) => {
        throw this.mapUniqueViolation(error);
      });

    return this.toSummary(position);
  }

  async update(id: string, dto: UpdatePositionDto): Promise<PositionSummary> {
    const current = await this.prisma.position.findUnique({ where: { id } });

    if (!current) {
      throw new NotFoundException('Позиция не найдена');
    }

    const group = dto.group ?? current.group;
    const isDefault = dto.isDefault ?? current.isDefault;

    if (current.isDefault && isDefault === false) {
      throw new BadRequestException(
        'Нельзя снять флаг по умолчанию, назначьте его другой позиции группы',
      );
    }

    const position = await this.prisma
      .$transaction(async (tx) => {
        if (isDefault) {
          await tx.position.updateMany({
            where: { group, isDefault: true, id: { not: id } },
            data: { isDefault: false },
          });
        }

        // permissions come from roleGroup, so members follow the position to its new group
        if (group !== current.group) {
          await tx.user.updateMany({ where: { positionId: id }, data: { roleGroup: group } });
        }

        return tx.position.update({
          where: { id },
          data: { ...dto, group, isDefault },
          select: summarySelect,
        });
      })
      .catch((error: unknown) => {
        throw this.mapUniqueViolation(error);
      });

    return this.toSummary(position);
  }

  async remove(id: string): Promise<void> {
    const position = await this.prisma.position.findUnique({
      where: { id },
      select: { isDefault: true, _count: { select: { users: true } } },
    });

    if (!position) {
      throw new NotFoundException('Позиция не найдена');
    }

    if (position.isDefault) {
      throw new BadRequestException('Нельзя удалить позицию по умолчанию');
    }

    if (position._count.users > 0) {
      throw new ConflictException(
        `Позиция занята: ${position._count.users} польз., сначала переведите их`,
      );
    }

    await this.prisma.position.delete({ where: { id } });
  }

  async assign(positionId: string, userId: string, actorRole: RoleGroup): Promise<void> {
    const position = await this.prisma.position.findUnique({
      where: { id: positionId },
      select: { id: true, group: true },
    });

    if (!position) {
      throw new NotFoundException('Позиция не найдена');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, roleGroup: true },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // nobody hands out a rank above their own, and nobody demotes someone senior
    if (!hasRoleGroup(actorRole, position.group) || !hasRoleGroup(actorRole, user.roleGroup)) {
      throw new ForbiddenException('Недостаточно прав для этого назначения');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { positionId: position.id, roleGroup: position.group },
    });
  }

  /** Position every new account starts with */
  async getDefaultId(group: RoleGroup): Promise<string> {
    const position = await this.prisma.position.findFirst({
      where: { group, isDefault: true },
      select: { id: true },
    });

    if (!position) {
      throw new Error(`No default position for group ${group}, run the seed`);
    }

    return position.id;
  }

  private mapUniqueViolation(error: unknown): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = String(error.meta?.target ?? '');

      return new ConflictException(
        target.includes('slug') ? 'Такой slug уже занят' : 'Такое название уже занято',
      );
    }

    return error;
  }

  private toSummary(row: SummaryRow): PositionSummary {
    const { _count, ...position } = row;

    return { ...position, usersCount: _count.users };
  }

  private toDetails(row: DetailsRow): PositionDetails {
    const { createdAt, updatedAt, users, _count, ...position } = row;

    return {
      ...position,
      usersCount: _count.users,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      users,
    };
  }
}
