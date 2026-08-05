import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  NewsCategoryCount,
  NewsComment,
  NewsDetails,
  NewsSummary,
  NewsTagCount,
  PaginatedResponse,
} from '@twomc/shared';
import type { Request } from 'express';
import { AuthenticatedUser } from '../auth/authenticated-user';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import {
  CreateNewsCommentDto,
  LatestNewsQueryDto,
  ListNewsCommentsQueryDto,
  ListNewsQueryDto,
  NewsCommentReactionDto,
  TagsQueryDto,
  UpdateNewsCommentDto,
} from './dto/news.dto';
import { NewsCommentsService } from './news-comments.service';
import { NewsService } from './news.service';

@Controller()
export class NewsController {
  constructor(
    private readonly news: NewsService,
    private readonly comments: NewsCommentsService,
  ) {}

  @Get('news')
  @UseGuards(OptionalJwtAuthGuard)
  list(
    @Query() query: ListNewsQueryDto,
    @CurrentUser() viewer: AuthenticatedUser | undefined,
  ): Promise<PaginatedResponse<NewsSummary>> {
    return this.news.listPublic(query, viewer?.id ?? null);
  }

  @Get('news/featured')
  @UseGuards(OptionalJwtAuthGuard)
  featured(
    @CurrentUser() viewer: AuthenticatedUser | undefined,
  ): Promise<NewsSummary[]> {
    return this.news.featured(5, viewer?.id ?? null);
  }

  @Get('news/latest')
  @UseGuards(OptionalJwtAuthGuard)
  latest(
    @Query() query: LatestNewsQueryDto,
    @CurrentUser() viewer: AuthenticatedUser | undefined,
  ): Promise<NewsSummary[]> {
    return this.news.latest(query.limit ?? 5, viewer?.id ?? null);
  }

  @Get('news/popular')
  @UseGuards(OptionalJwtAuthGuard)
  popular(
    @CurrentUser() viewer: AuthenticatedUser | undefined,
  ): Promise<NewsSummary[]> {
    return this.news.popular(viewer?.id ?? null);
  }

  @Get('news/categories')
  categories(): Promise<NewsCategoryCount[]> {
    return this.news.categories();
  }

  @Get('news/tags')
  tags(@Query() query: TagsQueryDto): Promise<NewsTagCount[]> {
    return this.news.tags(query.limit ?? 20);
  }

  @Get('rss/news')
  @Header('Content-Type', 'application/rss+xml; charset=utf-8')
  async rss(): Promise<string> {
    const siteUrl = process.env.PUBLIC_SITE_URL ?? 'https://twomc.su';
    return this.news.buildRssFeed(siteUrl);
  }

  @Get('news/:slug')
  @UseGuards(OptionalJwtAuthGuard)
  getBySlug(
    @Param('slug') slug: string,
    @CurrentUser() viewer: AuthenticatedUser | undefined,
    @Req() req: Request,
  ): Promise<NewsDetails> {
    const forwarded = req.headers['x-forwarded-for'];
    const ip =
      (typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : undefined) ||
      req.ip ||
      null;
    const ua = req.headers['user-agent'] ?? null;
    return this.news.getBySlug(slug, viewer?.id ?? null, ip, ua);
  }

  @Post('news/:id/like')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  like(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<{ liked: boolean; likesCount: number }> {
    return this.news.toggleLike(id, userId);
  }

  @Get('news/:slug/comments')
  @UseGuards(OptionalJwtAuthGuard)
  listComments(
    @Param('slug') slug: string,
    @Query() query: ListNewsCommentsQueryDto,
    @CurrentUser() viewer: AuthenticatedUser | undefined,
  ): Promise<PaginatedResponse<NewsComment>> {
    return this.comments.list(slug, query, viewer?.id ?? null, viewer?.roleGroup ?? null);
  }

  @Post('news/:slug/comments')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  createComment(
    @Param('slug') slug: string,
    @Body() dto: CreateNewsCommentDto,
    @CurrentUser('id') userId: string,
  ): Promise<NewsComment> {
    return this.comments.create(slug, dto, userId);
  }

  @Patch('news/:slug/comments/:commentId')
  @UseGuards(JwtAuthGuard)
  updateComment(
    @Param('slug') slug: string,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateNewsCommentDto,
    @CurrentUser('id') userId: string,
  ): Promise<NewsComment> {
    return this.comments.update(slug, commentId, dto, userId);
  }

  @Delete('news/:slug/comments/:commentId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteComment(
    @Param('slug') slug: string,
    @Param('commentId') commentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.comments.remove(slug, commentId, user.id, user.roleGroup);
  }

  @Post('news/:slug/comments/:commentId/reactions')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  react(
    @Param('slug') slug: string,
    @Param('commentId') commentId: string,
    @Body() dto: NewsCommentReactionDto,
    @CurrentUser('id') userId: string,
  ): Promise<NewsComment> {
    return this.comments.toggleReaction(slug, commentId, userId, dto.emoji);
  }
}
