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
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Achievement, RoleGroup } from '@twomc/shared';
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { randomBytes } from 'crypto';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { imageUploadOptions } from '../uploads/multer.options';
import { AchievementsService } from './achievements.service';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { UpdateAchievementDto } from './dto/update-achievement.dto';

@Controller('admin/achievements')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleGroup.ADMIN)
export class AdminAchievementsController {
  constructor(private readonly achievements: AchievementsService) {}

  @Get()
  list(): Promise<Achievement[]> {
    return this.achievements.listAdmin();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateAchievementDto): Promise<Achievement> {
    return this.achievements.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAchievementDto,
  ): Promise<Achievement> {
    return this.achievements.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.achievements.remove(id);
  }

  @Post('upload-icon')
  @UseInterceptors(FileInterceptor('file', imageUploadOptions(2 * 1024 * 1024)))
  async uploadIcon(
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<{ iconUrl: string }> {
    if (!file) throw new BadRequestException('Файл не загружен');

    const ext = file.mimetype === 'image/png' ? 'png' : file.mimetype === 'image/webp' ? 'webp' : 'jpg';
    const name = `${Date.now()}-${randomBytes(4).toString('hex')}.${ext}`;
    const dir = join(process.cwd(), '..', 'web', 'public', 'achievements');
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, name), file.buffer);

    return { iconUrl: `/achievements/${name}` };
  }

  @Post('check-all-users')
  checkAll(): Promise<{ checked: number; granted: number }> {
    return this.achievements.checkAllUsers();
  }
}
