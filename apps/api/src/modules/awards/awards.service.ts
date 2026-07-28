import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Award as AwardRow, Prisma } from '@prisma/client';
import { Award } from '@twomc/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAwardDto } from './dto/create-award.dto';
import { UpdateAwardDto } from './dto/update-award.dto';

@Injectable()
export class AwardsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic(): Promise<Award[]> {
    const rows = await this.prisma.award.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return rows.map(toAward);
  }

  async listAdmin(): Promise<Award[]> {
    const rows = await this.prisma.award.findMany({ orderBy: { name: 'asc' } });

    return rows.map(toAward);
  }

  async create(dto: CreateAwardDto): Promise<Award> {
    try {
      const row = await this.prisma.award.create({
        data: {
          name: dto.name.trim(),
          slug: dto.slug.trim(),
          description: dto.description?.trim() || null,
          iconUrl: dto.iconUrl.trim(),
          color: dto.color ?? null,
          rarity: dto.rarity ?? null,
          isActive: dto.isActive ?? true,
        },
      });

      return toAward(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Награда с таким slug уже существует');
      }

      throw error;
    }
  }

  async update(id: string, dto: UpdateAwardDto): Promise<Award> {
    await this.requireAward(id);

    try {
      const row = await this.prisma.award.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.slug !== undefined ? { slug: dto.slug.trim() } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description.trim() || null }
            : {}),
          ...(dto.iconUrl !== undefined ? { iconUrl: dto.iconUrl.trim() } : {}),
          ...(dto.color !== undefined ? { color: dto.color || null } : {}),
          ...(dto.rarity !== undefined ? { rarity: dto.rarity || null } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
      });

      return toAward(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Награда с таким slug уже существует');
      }

      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.requireAward(id);
    await this.prisma.award.delete({ where: { id } });
  }

  async assign(userId: string, awardId: string, grantedBy: string): Promise<void> {
    await this.requireUser(userId);
    await this.requireAward(awardId);

    try {
      await this.prisma.userAward.create({
        data: { userId, awardId, grantedBy },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('У пользователя уже есть эта награда');
      }

      throw error;
    }
  }

  async revoke(userId: string, awardId: string): Promise<void> {
    const row = await this.prisma.userAward.findUnique({
      where: { userId_awardId: { userId, awardId } },
    });

    if (!row) {
      throw new NotFoundException('Награда у пользователя не найдена');
    }

    await this.prisma.userAward.delete({ where: { id: row.id } });
  }

  private async requireAward(id: string): Promise<AwardRow> {
    const row = await this.prisma.award.findUnique({ where: { id } });

    if (!row) {
      throw new NotFoundException('Награда не найдена');
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

function toAward(row: AwardRow): Award {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    iconUrl: row.iconUrl,
    color: row.color,
    rarity: row.rarity,
    isActive: row.isActive,
  };
}
