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
import { NewsAdminItem, NewsStats, PaginatedResponse, RoleGroup } from '@twomc/shared';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  AdminListNewsQueryDto,
  CreateNewsDto,
  UpdateNewsDto,
} from './dto/news.dto';
import { NewsService } from './news.service';

@Controller('admin/news')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleGroup.ADMIN)
export class NewsAdminController {
  constructor(private readonly news: NewsService) {}

  @Get()
  list(@Query() query: AdminListNewsQueryDto): Promise<PaginatedResponse<NewsAdminItem>> {
    return this.news.listAdmin(query);
  }

  @Get('stats')
  stats(): Promise<NewsStats> {
    return this.news.stats();
  }

  @Get(':id')
  getById(@Param('id') id: string): Promise<NewsAdminItem> {
    return this.news.getAdminById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateNewsDto,
    @CurrentUser('id') actorId: string,
  ): Promise<NewsAdminItem> {
    return this.news.create(dto, actorId);
  }

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    }),
  )
  uploadImage(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: 5 * 1024 * 1024 })
        .build({ fileIsRequired: true }),
    )
    file: Express.Multer.File,
  ): Promise<{ url: string }> {
    return this.news.uploadImage(file);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateNewsDto,
    @CurrentUser('id') actorId: string,
  ): Promise<NewsAdminItem> {
    return this.news.update(id, dto, actorId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.news.archive(id);
  }

  @Post(':id/pin')
  pin(@Param('id') id: string): Promise<NewsAdminItem> {
    return this.news.setPinned(id, true);
  }

  @Post(':id/unpin')
  unpin(@Param('id') id: string): Promise<NewsAdminItem> {
    return this.news.setPinned(id, false);
  }

  @Post(':id/feature')
  feature(@Param('id') id: string): Promise<NewsAdminItem> {
    return this.news.setFeatured(id, true);
  }

  @Post(':id/unfeature')
  unfeature(@Param('id') id: string): Promise<NewsAdminItem> {
    return this.news.setFeatured(id, false);
  }
}
