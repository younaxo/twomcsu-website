import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { FormAutofill, FormDetail, FormSummary } from '@twomc/shared';
import { createHash, randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import type { Request } from 'express';
import { memoryStorage } from 'multer';
import { AuthenticatedUser } from '../auth/authenticated-user';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { getRequestContext } from '../auth/request-context';
import { UPLOADS_ROUTE } from '../uploads/upload.constants';
import { UploadsService } from '../uploads/uploads.service';
import { SaveDraftDto, SubmitResponseDto } from './dto/forms.dto';
import { FormResponsesService } from './form-responses.service';
import { FormsService } from './forms.service';
import { toFormDetail, toFormSummary } from './forms.mapper';

const FORM_UPLOAD_MAX = 15 * 1024 * 1024;

@Controller('forms')
export class FormsController {
  constructor(
    private readonly forms: FormsService,
    private readonly responses: FormResponsesService,
    private readonly uploads: UploadsService,
  ) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async listPublished(
    @CurrentUser() viewer: AuthenticatedUser | undefined,
  ): Promise<FormSummary[]> {
    const forms = await this.forms.listPublished(
      viewer ? { id: viewer.id, roleGroup: viewer.roleGroup } : undefined,
    );
    return forms.map(toFormSummary);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async listMy(@CurrentUser('id') userId: string): Promise<FormSummary[]> {
    const forms = await this.forms.getMyForms(userId);
    return forms.map(toFormSummary);
  }

  @Get('my/responses')
  @UseGuards(JwtAuthGuard)
  async listMyResponses(@CurrentUser('id') userId: string) {
    return this.responses.getMyResponses(userId);
  }

  @Get('autofill')
  @UseGuards(JwtAuthGuard)
  async autofill(@CurrentUser('id') userId: string): Promise<FormAutofill> {
    return this.forms.getAutofill(userId);
  }

  @Get('invite/:code')
  @UseGuards(OptionalJwtAuthGuard)
  async getByInvite(@Param('code') code: string): Promise<FormDetail> {
    const form = await this.forms.getFormByInviteCode(code);
    return toFormDetail(form);
  }

  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  async getBySlug(
    @Param('slug') slug: string,
    @CurrentUser() viewer: AuthenticatedUser | undefined,
  ): Promise<FormDetail> {
    const form = await this.forms.getFormBySlug(
      slug,
      viewer ? { id: viewer.id, roleGroup: viewer.roleGroup } : undefined,
    );
    return toFormDetail(form);
  }

  @Post(':slug/responses')
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  async submit(
    @Param('slug') slug: string,
    @Body() dto: SubmitResponseDto,
    @CurrentUser() viewer: AuthenticatedUser | undefined,
    @Req() req: Request,
  ): Promise<{ id: string }> {
    const context = getRequestContext(req);
    const ipHash = context.ip ? createHash('sha256').update(context.ip).digest('hex') : null;

    return this.responses.submitResponse(slug, viewer?.id ?? null, dto, {
      ipHash,
      userAgent: context.userAgent?.slice(0, 500) ?? null,
      ip: context.ip,
    });
  }

  @Post(':slug/responses/save-draft')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async saveDraft(
    @Param('slug') slug: string,
    @Body() dto: SaveDraftDto,
    @CurrentUser('id') userId: string,
  ): Promise<{ id: string }> {
    return this.responses.saveDraft(slug, userId, dto);
  }

  @Post(':slug/responses/upload')
  @UseGuards(OptionalJwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: FORM_UPLOAD_MAX, files: 1 },
    }),
  )
  async uploadResponseFile(
    @Param('slug') slug: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: FORM_UPLOAD_MAX })
        .build({ fileIsRequired: true }),
    )
    file: Express.Multer.File,
    @CurrentUser() viewer: AuthenticatedUser | undefined,
  ): Promise<{ url: string; fileName: string; size: number; mimeType: string }> {
    if (!file) {
      throw new BadRequestException('Файл не выбран');
    }

    const form = await this.forms.getFormBySlug(
      slug,
      viewer ? { id: viewer.id, roleGroup: viewer.roleGroup } : undefined,
    );

    const directory = join(this.uploads.rootDir, 'forms', form.id);
    await mkdir(directory, { recursive: true });

    const ext = extname(file.originalname) || '';
    const storedName = `${randomBytes(8).toString('hex')}${ext}`;
    await writeFile(join(directory, storedName), file.buffer);

    return {
      url: `${UPLOADS_ROUTE}/forms/${form.id}/${storedName}`,
      fileName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    };
  }
}
