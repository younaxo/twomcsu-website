import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TopicCategory, TopicVisibility } from '@prisma/client';
import { RoleGroup, TopicDetails, TopicSummary } from '@twomc/shared';
import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import {
  assertSearchLength,
  buildPaginatedResult,
  normalizePagination,
  PaginatedResult,
} from '../../common/pagination';
import { MarkdownService } from '../comments/markdown.service';
import { PrismaService } from '../prisma/prisma.service';
import { UPLOADS_ROUTE } from '../uploads/upload.constants';
import { UploadsService } from '../uploads/uploads.service';
import { CreateTopicDto, ListTopicsQueryDto, UpdateTopicDto } from './dto/topics.dto';
import { toTopicDetails, toTopicSummary } from './topic.mapper';
import { allowedVisibilities, canViewTopic } from './topic-visibility.util';

const topicInclude = {
  attachments: { orderBy: { createdAt: 'asc' as const } },
};

@Injectable()
export class TopicsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly markdown: MarkdownService,
    private readonly uploads: UploadsService,
  ) {}

  async listPublic(
    query: ListTopicsQueryDto,
    viewerRole: RoleGroup | null,
  ): Promise<PaginatedResult<TopicSummary>> {
    const { page, limit, skip } = normalizePagination(query);
    const search = assertSearchLength(query.search);
    const visibilities = allowedVisibilities(viewerRole);

    const where: Prisma.TopicWhereInput = {
      isActive: true,
      visibility: { in: visibilities },
      ...(query.category ? { category: query.category as TopicCategory } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.topic.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, { order: 'asc' }, { title: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.topic.count({ where }),
    ]);

    return buildPaginatedResult(rows.map(toTopicSummary), total, page, limit);
  }

  async getBySlug(
    slug: string,
    viewerId: string | null,
    viewerRole: RoleGroup | null,
  ): Promise<TopicDetails> {
    const row = await this.prisma.topic.findUnique({
      where: { slug },
      include: topicInclude,
    });

    if (!row || !row.isActive) {
      throw new NotFoundException('Тема не найдена');
    }

    if (!canViewTopic(row.visibility, viewerRole)) {
      throw new ForbiddenException('Недостаточно прав для просмотра');
    }

    if (viewerId !== row.createdBy) {
      await this.prisma.topic.update({
        where: { id: row.id },
        data: { views: { increment: 1 } },
      });
      row.views += 1;
    }

    return toTopicDetails(row);
  }

  async listAdmin(): Promise<TopicSummary[]> {
    const rows = await this.prisma.topic.findMany({
      orderBy: [{ category: 'asc' }, { isPinned: 'desc' }, { order: 'asc' }, { title: 'asc' }],
    });

    return rows.map(toTopicSummary);
  }

  async getAdminById(id: string): Promise<TopicDetails> {
    const row = await this.prisma.topic.findUnique({
      where: { id },
      include: topicInclude,
    });

    if (!row) {
      throw new NotFoundException('Тема не найдена');
    }

    return toTopicDetails(row);
  }

  async create(dto: CreateTopicDto, createdBy: string): Promise<TopicDetails> {
    const contentHtml = this.markdown.render(dto.content);

    try {
      const row = await this.prisma.topic.create({
        data: {
          title: dto.title.trim(),
          slug: dto.slug.trim(),
          category: dto.category,
          visibility: dto.visibility ?? TopicVisibility.PUBLIC,
          icon: dto.icon?.trim() || null,
          color: dto.color ?? null,
          description: dto.description?.trim() || null,
          content: dto.content,
          contentHtml,
          order: dto.order ?? 0,
          isActive: dto.isActive ?? true,
          isPinned: dto.isPinned ?? false,
          createdBy,
        },
        include: topicInclude,
      });

      return toTopicDetails(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Тема с таким slug уже существует');
      }

      throw error;
    }
  }

  async update(id: string, dto: UpdateTopicDto, updatedBy: string): Promise<TopicDetails> {
    await this.requireTopic(id);

    const contentHtml =
      dto.content !== undefined ? this.markdown.render(dto.content) : undefined;

    try {
      const row = await this.prisma.topic.update({
        where: { id },
        data: {
          ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
          ...(dto.slug !== undefined ? { slug: dto.slug.trim() } : {}),
          ...(dto.category !== undefined ? { category: dto.category } : {}),
          ...(dto.visibility !== undefined ? { visibility: dto.visibility } : {}),
          ...(dto.icon !== undefined ? { icon: dto.icon.trim() || null } : {}),
          ...(dto.color !== undefined ? { color: dto.color || null } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description.trim() || null }
            : {}),
          ...(dto.content !== undefined ? { content: dto.content, contentHtml } : {}),
          ...(dto.order !== undefined ? { order: dto.order } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
          ...(dto.isPinned !== undefined ? { isPinned: dto.isPinned } : {}),
          updatedBy,
        },
        include: topicInclude,
      });

      return toTopicDetails(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Тема с таким slug уже существует');
      }

      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const row = await this.prisma.topic.findUnique({
      where: { id },
      include: { attachments: true },
    });

    if (!row) {
      throw new NotFoundException('Тема не найдена');
    }

    await Promise.all(row.attachments.map((attachment) => this.uploads.remove(attachment.fileUrl)));
    await this.prisma.topic.delete({ where: { id } });
  }

  async reorder(orders: { id: string; order: number }[]): Promise<void> {
    await this.prisma.$transaction(
      orders.map(({ id, order }) =>
        this.prisma.topic.update({ where: { id }, data: { order } }),
      ),
    );
  }

  async pin(id: string, updatedBy: string): Promise<TopicSummary> {
    const row = await this.prisma.topic.update({
      where: { id },
      data: { isPinned: true, updatedBy },
    });

    return toTopicSummary(row);
  }

  async unpin(id: string, updatedBy: string): Promise<TopicSummary> {
    const row = await this.prisma.topic.update({
      where: { id },
      data: { isPinned: false, updatedBy },
    });

    return toTopicSummary(row);
  }

  async addAttachment(
    topicId: string,
    file: Express.Multer.File,
    uploadedBy: string,
  ): Promise<TopicDetails> {
    await this.requireTopic(topicId);

    const directory = join(this.uploads.rootDir, 'topics');
    await mkdir(directory, { recursive: true });

    const ext = extname(file.originalname) || '';
    const storedName = `${topicId}-${randomBytes(8).toString('hex')}${ext}`;
    await writeFile(join(directory, storedName), file.buffer);

    const fileUrl = `${UPLOADS_ROUTE}/topics/${storedName}`;

    await this.prisma.topicAttachment.create({
      data: {
        topicId,
        fileName: file.originalname,
        fileUrl,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedBy,
      },
    });

    return this.getAdminById(topicId);
  }

  async removeAttachment(topicId: string, attachmentId: string): Promise<TopicDetails> {
    const attachment = await this.prisma.topicAttachment.findFirst({
      where: { id: attachmentId, topicId },
    });

    if (!attachment) {
      throw new NotFoundException('Вложение не найдено');
    }

    await this.uploads.remove(attachment.fileUrl);
    await this.prisma.topicAttachment.delete({ where: { id: attachmentId } });

    return this.getAdminById(topicId);
  }

  private async requireTopic(id: string): Promise<void> {
    const row = await this.prisma.topic.findUnique({ where: { id }, select: { id: true } });

    if (!row) {
      throw new NotFoundException('Тема не найдена');
    }
  }
}
