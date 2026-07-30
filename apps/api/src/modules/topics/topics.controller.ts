import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  PaginatedResponse,
  RoleGroup,
  TopicDetails,
  TopicSummary,
} from '@twomc/shared';
import { AuthenticatedUser } from '../auth/authenticated-user';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { memoryStorage } from 'multer';
import {
  CreateTopicDto,
  ListTopicsQueryDto,
  ReorderTopicsDto,
  UpdateTopicDto,
} from './dto/topics.dto';
import { TopicsService } from './topics.service';

@Controller()
export class TopicsController {
  constructor(private readonly topics: TopicsService) {}

  @Get('topics')
  @UseGuards(OptionalJwtAuthGuard)
  list(
    @Query() query: ListTopicsQueryDto,
    @CurrentUser() viewer: AuthenticatedUser | undefined,
  ): Promise<PaginatedResponse<TopicSummary>> {
    return this.topics.listPublic(query, viewer?.roleGroup ?? null);
  }

  @Get('topics/:slug')
  @UseGuards(OptionalJwtAuthGuard)
  getBySlug(
    @Param('slug') slug: string,
    @CurrentUser() viewer: AuthenticatedUser | undefined,
  ): Promise<TopicDetails> {
    return this.topics.getBySlug(slug, viewer?.id ?? null, viewer?.roleGroup ?? null);
  }

  @Get('admin/topics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.OWNER)
  listAdmin(): Promise<TopicSummary[]> {
    return this.topics.listAdmin();
  }

  @Get('admin/topics/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.OWNER)
  getAdminById(@Param('id') id: string): Promise<TopicDetails> {
    return this.topics.getAdminById(id);
  }

  @Post('admin/topics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.OWNER)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateTopicDto,
    @CurrentUser('id') actorId: string,
  ): Promise<TopicDetails> {
    return this.topics.create(dto, actorId);
  }

  @Patch('admin/topics/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.OWNER)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTopicDto,
    @CurrentUser('id') actorId: string,
  ): Promise<TopicDetails> {
    return this.topics.update(id, dto, actorId);
  }

  @Delete('admin/topics/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.topics.remove(id);
  }

  @Post('admin/topics/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  reorder(@Body() dto: ReorderTopicsDto): Promise<void> {
    return this.topics.reorder(dto.orders);
  }

  @Post('admin/topics/:id/pin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.OWNER)
  pin(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
  ): Promise<TopicSummary> {
    return this.topics.pin(id, actorId);
  }

  @Post('admin/topics/:id/unpin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.OWNER)
  unpin(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
  ): Promise<TopicSummary> {
    return this.topics.unpin(id, actorId);
  }

  @Post('admin/topics/:id/attachments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.OWNER)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    }),
  )
  addAttachment(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: 10 * 1024 * 1024 })
        .build({ fileIsRequired: true }),
    )
    file: Express.Multer.File,
    @CurrentUser('id') actorId: string,
  ): Promise<TopicDetails> {
    return this.topics.addAttachment(id, file, actorId);
  }

  @Delete('admin/topics/:id/attachments/:attachmentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.OWNER)
  removeAttachment(
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
  ): Promise<TopicDetails> {
    return this.topics.removeAttachment(id, attachmentId);
  }
}
