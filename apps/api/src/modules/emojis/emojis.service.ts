import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CustomEmoji as PrismaCustomEmoji } from '@prisma/client';
import { CustomEmoji } from '@twomc/shared';
import { randomBytes } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { CACHE_TTL, cacheKeys } from '../cache/cache.keys';
import { CacheService } from '../cache/cache.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  UPLOADS_ROUTE,
} from '../uploads/upload.constants';
import { UploadsService } from '../uploads/uploads.service';
import { CreateEmojiDto } from './dto/create-emoji.dto';
import { UpdateEmojiDto } from './dto/update-emoji.dto';

const EMOJI_MAX_BYTES = 2 * 1024 * 1024;
const EMOJI_MIME = ['image/png', 'image/gif', 'image/webp'] as const;

@Injectable()
export class EmojisService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly uploads: UploadsService,
  ) {}

  async listActive(): Promise<CustomEmoji[]> {
    return this.cache.wrap(cacheKeys.customEmojis(), CACHE_TTL.CUSTOM_EMOJIS, async () => {
      const rows = await this.prisma.customEmoji.findMany({
        where: { isActive: true },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      });
      return rows.map(toCustomEmoji);
    });
  }

  async search(query: string): Promise<CustomEmoji[]> {
    const q = query.trim().toLowerCase();
    if (!q) {
      return this.listActive();
    }

    return this.cache.wrap(
      cacheKeys.customEmojisSearch(q),
      CACHE_TTL.MENTION_SEARCH,
      async () => {
        const rows = await this.prisma.customEmoji.findMany({
          where: {
            isActive: true,
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { category: { contains: q, mode: 'insensitive' } },
            ],
          },
          orderBy: { name: 'asc' },
          take: 24,
        });
        return rows.map(toCustomEmoji);
      },
    );
  }

  async listAll(): Promise<CustomEmoji[]> {
    const rows = await this.prisma.customEmoji.findMany({
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
    return rows.map(toCustomEmoji);
  }

  async create(
    dto: CreateEmojiDto,
    file: Express.Multer.File,
    actorId: string,
  ): Promise<CustomEmoji> {
    this.assertEmojiFile(file);

    const existing = await this.prisma.customEmoji.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('Эмодзи с таким именем уже существует');
    }

    const imageUrl = await this.storeEmojiFile(file, dto.name);
    const isAnimated =
      dto.isAnimated ?? (file.mimetype === 'image/gif');

    try {
      const row = await this.prisma.customEmoji.create({
        data: {
          name: dto.name,
          imageUrl,
          category: dto.category?.trim() || 'TWOMC',
          isAnimated,
          isPremium: dto.isPremium ?? false,
          createdBy: actorId,
        },
      });
      await this.invalidateCache();
      return toCustomEmoji(row);
    } catch (error) {
      await this.safeUnlink(imageUrl);
      throw error;
    }
  }

  async update(
    id: string,
    dto: UpdateEmojiDto,
    file?: Express.Multer.File,
  ): Promise<CustomEmoji> {
    const existing = await this.requireEmoji(id);

    if (dto.name && dto.name !== existing.name) {
      const conflict = await this.prisma.customEmoji.findUnique({
        where: { name: dto.name },
      });
      if (conflict) {
        throw new ConflictException('Эмодзи с таким именем уже существует');
      }
    }

    let imageUrl = existing.imageUrl;
    if (file) {
      this.assertEmojiFile(file);
      imageUrl = await this.storeEmojiFile(file, dto.name ?? existing.name);
    }

    try {
      const row = await this.prisma.customEmoji.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.category !== undefined ? { category: dto.category } : {}),
          ...(dto.isAnimated !== undefined ? { isAnimated: dto.isAnimated } : {}),
          ...(dto.isPremium !== undefined ? { isPremium: dto.isPremium } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
          ...(file ? { imageUrl } : {}),
        },
      });

      if (file && existing.imageUrl.startsWith(`${UPLOADS_ROUTE}/emojis/`)) {
        await this.safeUnlink(existing.imageUrl);
      }

      await this.invalidateCache();
      return toCustomEmoji(row);
    } catch (error) {
      if (file && imageUrl !== existing.imageUrl) {
        await this.safeUnlink(imageUrl);
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const existing = await this.requireEmoji(id);
    await this.prisma.customEmoji.delete({ where: { id } });

    if (existing.imageUrl.startsWith(`${UPLOADS_ROUTE}/emojis/`)) {
      await this.safeUnlink(existing.imageUrl);
    }

    await this.invalidateCache();
  }

  private async requireEmoji(id: string): Promise<PrismaCustomEmoji> {
    const row = await this.prisma.customEmoji.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException('Эмодзи не найден');
    }
    return row;
  }

  private assertEmojiFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Файл не выбран');
    }
    if (!EMOJI_MIME.includes(file.mimetype as (typeof EMOJI_MIME)[number])) {
      throw new BadRequestException('Поддерживаются только PNG, GIF и WEBP');
    }
    if (
      !ALLOWED_IMAGE_MIME_TYPES.includes(
        file.mimetype as (typeof ALLOWED_IMAGE_MIME_TYPES)[number],
      )
    ) {
      throw new BadRequestException('Недопустимый тип файла');
    }
    if (file.size > EMOJI_MAX_BYTES) {
      throw new BadRequestException('Файл больше 2 МБ');
    }
  }

  private async storeEmojiFile(file: Express.Multer.File, name: string): Promise<string> {
    const directory = join(this.uploads.rootDir, 'emojis');
    await mkdir(directory, { recursive: true });

    const ext =
      file.mimetype === 'image/gif'
        ? 'gif'
        : file.mimetype === 'image/webp'
          ? 'webp'
          : 'png';
    const filename = `${name}-${randomBytes(6).toString('hex')}.${ext}`;
    await writeFile(join(directory, filename), file.buffer);
    return `${UPLOADS_ROUTE}/emojis/${filename}`;
  }

  private async safeUnlink(imageUrl: string) {
    const relative = imageUrl.replace(`${UPLOADS_ROUTE}/`, '');
    const absolute = join(this.uploads.rootDir, relative);
    try {
      await unlink(absolute);
    } catch {
      // ignore missing files
    }
  }

  private async invalidateCache() {
    await this.cache.del(cacheKeys.customEmojis());
    await this.cache.delPattern('emojis:custom:search:*');
  }
}

function toCustomEmoji(row: PrismaCustomEmoji): CustomEmoji {
  return {
    id: row.id,
    name: row.name,
    imageUrl: row.imageUrl,
    category: row.category,
    isAnimated: row.isAnimated,
    isPremium: row.isPremium,
    isActive: row.isActive,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
