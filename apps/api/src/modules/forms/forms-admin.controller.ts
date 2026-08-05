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
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { FormDetail, FormStats, FormSummary, RoleGroup } from '@twomc/shared';
import type { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PaginatedResult } from '../../common/pagination';
import {
  CreateFormDto,
  CreateFromTemplateDto,
  CreateInviteDto,
  ExportFormDto,
  ListFormsQueryDto,
  ListResponsesQueryDto,
  UpdateFormDto,
} from './dto/forms.dto';
import { FormExportService } from './form-export.service';
import { FormResponsesService } from './form-responses.service';
import { FormsService } from './forms.service';
import { toFormDetail, toFormSummary, FormInviteView } from './forms.mapper';

@Controller('admin/forms')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleGroup.ADMIN)
export class FormsAdminController {
  constructor(
    private readonly forms: FormsService,
    private readonly responses: FormResponsesService,
    private readonly exporter: FormExportService,
  ) {}

  @Get()
  async list(
    @Query() query: ListFormsQueryDto,
  ): Promise<PaginatedResult<FormSummary>> {
    const result = await this.forms.listAdmin(query);
    return {
      ...result,
      data: result.data.map(toFormSummary),
    };
  }

  @Get('templates')
  async listTemplates(): Promise<FormSummary[]> {
    const templates = await this.forms.listTemplates();
    return templates.map(toFormSummary);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateFormDto,
    @CurrentUser('id') userId: string,
  ): Promise<FormDetail> {
    const form = await this.forms.createForm(userId, dto);
    return toFormDetail(form);
  }

  @Post('from-template/:slug')
  @HttpCode(HttpStatus.CREATED)
  async createFromTemplate(
    @Param('slug') slug: string,
    @Body() dto: CreateFromTemplateDto,
    @CurrentUser('id') userId: string,
  ): Promise<FormDetail> {
    const form = await this.forms.createFromTemplate(
      slug,
      userId,
      dto.overrides as Partial<CreateFormDto> | undefined,
    );
    return toFormDetail(form);
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<FormDetail> {
    const form = await this.forms.getFormById(id);
    return toFormDetail(form);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateFormDto,
  ): Promise<FormDetail> {
    const form = await this.forms.updateForm(id, dto);
    return toFormDetail(form);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.forms.deleteForm(id);
  }

  @Post(':id/publish')
  async publish(@Param('id') id: string): Promise<FormDetail> {
    const form = await this.forms.publishForm(id);
    return toFormDetail(form);
  }

  @Post(':id/close')
  async close(@Param('id') id: string): Promise<FormDetail> {
    const form = await this.forms.closeForm(id);
    return toFormDetail(form);
  }

  @Post(':id/duplicate')
  @HttpCode(HttpStatus.CREATED)
  async duplicate(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<FormDetail> {
    const form = await this.forms.duplicateForm(id, userId);
    return toFormDetail(form);
  }

  @Get(':id/responses')
  async getResponses(
    @Param('id') id: string,
    @Query() query: ListResponsesQueryDto,
  ) {
    return this.responses.getResponses(id, query);
  }

  @Get(':id/responses/:responseId')
  async getResponse(
    @Param('id') _id: string,
    @Param('responseId') responseId: string,
  ) {
    return this.responses.getResponse(responseId);
  }

  @Delete(':id/responses/:responseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteResponse(
    @Param('id') _id: string,
    @Param('responseId') responseId: string,
  ): Promise<void> {
    await this.responses.deleteResponse(responseId);
  }

  @Post(':id/export')
  async exportResponses(
    @Param('id') id: string,
    @Body() dto: ExportFormDto,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.exporter.exportResponses(id, dto);
    res.setHeader('Content-Type', result.contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(result.filename)}"`,
    );
    res.send(result.buffer);
  }

  @Get(':id/stats')
  async getStats(@Param('id') id: string): Promise<FormStats> {
    return this.forms.getStats(id);
  }

  @Get(':id/invites')
  async listInvites(@Param('id') id: string): Promise<FormInviteView[]> {
    return this.forms.listInvites(id);
  }

  @Post(':id/invites')
  @HttpCode(HttpStatus.CREATED)
  async createInvite(
    @Param('id') id: string,
    @Body() dto: CreateInviteDto,
    @CurrentUser('id') userId: string,
  ): Promise<FormInviteView> {
    return this.forms.createInvite(id, userId, dto);
  }

  @Delete(':id/invites/:code')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteInvite(
    @Param('id') id: string,
    @Param('code') code: string,
  ): Promise<void> {
    await this.forms.deleteInvite(id, code);
  }
}
