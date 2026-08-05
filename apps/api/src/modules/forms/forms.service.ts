import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FormStatus, FormVisibility, Prisma } from '@prisma/client';
import {
  FormAutofill,
  FormStats,
  FormStatsField,
  RoleGroup,
  hasRoleGroup,
} from '@twomc/shared';
import { randomBytes } from 'node:crypto';
import {
  buildPaginatedResult,
  normalizePagination,
  PaginatedResult,
} from '../../common/pagination';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateFormDto,
  CreateFormFieldDto,
  CreateInviteDto,
  ListFormsQueryDto,
  UpdateFormDto,
} from './dto/forms.dto';
import {
  FormInviteView,
  FormWithFields,
  toFormDetail,
  toFormSummary,
  toInviteView,
} from './forms.mapper';
import { slugifyForm } from './forms-slug.util';

/** Visibility → role required to view the form */
const VISIBILITY_REQUIREMENTS: Partial<Record<FormVisibility, RoleGroup>> = {
  [FormVisibility.HELPER_ONLY]: RoleGroup.HELPER,
  [FormVisibility.MODERATOR_ONLY]: RoleGroup.MODERATOR,
  [FormVisibility.ADMIN_ONLY]: RoleGroup.ADMIN,
  [FormVisibility.OWNER_ONLY]: RoleGroup.OWNER,
};

const TEMPLATE_PREFIX = 'template-';

const formWithFieldsInclude = {
  fields: { orderBy: { order: 'asc' as const } },
} satisfies Prisma.FormInclude;

interface Viewer {
  id?: string | null;
  roleGroup?: RoleGroup | null;
}

@Injectable()
export class FormsService {
  constructor(private readonly prisma: PrismaService) {}

  async createForm(userId: string, dto: CreateFormDto): Promise<FormWithFields> {
    const slug = await this.ensureUniqueSlug(dto.slug?.trim() || slugifyForm(dto.title));

    try {
      const created = await this.prisma.form.create({
        data: {
          title: dto.title.trim(),
          slug,
          description: dto.description?.trim() || null,
          coverImage: dto.coverImage?.trim() || null,
          visibility: dto.visibility ?? FormVisibility.PUBLIC,
          status: dto.status ?? FormStatus.DRAFT,
          onePerUser: dto.onePerUser ?? true,
          isAnonymous: dto.isAnonymous ?? false,
          showResults: dto.showResults ?? false,
          requiresAuth: dto.requiresAuth ?? false,
          requiresCaptcha: dto.requiresCaptcha ?? true,
          opensAt: dto.opensAt ? new Date(dto.opensAt) : null,
          closesAt: dto.closesAt ? new Date(dto.closesAt) : null,
          timeLimit: dto.timeLimit ?? null,
          maxResponses: dto.maxResponses ?? null,
          multiStep: dto.multiStep ?? false,
          stepsConfig: this.toInputJson(dto.stepsConfig),
          thankYouMessage: dto.thankYouMessage?.trim() || null,
          redirectUrl: dto.redirectUrl?.trim() || null,
          customCss: dto.customCss ?? null,
          createdById: userId,
          fields: dto.fields?.length
            ? { create: dto.fields.map((field, index) => this.toFieldCreateInput(field, index)) }
            : undefined,
        },
        include: formWithFieldsInclude,
      });

      return created;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Форма с таким slug уже существует');
      }
      throw error;
    }
  }

  async updateForm(formId: string, dto: UpdateFormDto): Promise<FormWithFields> {
    await this.requireForm(formId);

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (dto.fields) {
          await tx.formField.deleteMany({ where: { formId } });
        }

        return tx.form.update({
          where: { id: formId },
          data: {
            ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
            ...(dto.slug !== undefined ? { slug: dto.slug.trim() } : {}),
            ...(dto.description !== undefined
              ? { description: dto.description?.trim() || null }
              : {}),
            ...(dto.coverImage !== undefined
              ? { coverImage: dto.coverImage?.trim() || null }
              : {}),
            ...(dto.visibility !== undefined ? { visibility: dto.visibility } : {}),
            ...(dto.status !== undefined ? { status: dto.status } : {}),
            ...(dto.onePerUser !== undefined ? { onePerUser: dto.onePerUser } : {}),
            ...(dto.isAnonymous !== undefined ? { isAnonymous: dto.isAnonymous } : {}),
            ...(dto.showResults !== undefined ? { showResults: dto.showResults } : {}),
            ...(dto.requiresAuth !== undefined ? { requiresAuth: dto.requiresAuth } : {}),
            ...(dto.requiresCaptcha !== undefined
              ? { requiresCaptcha: dto.requiresCaptcha }
              : {}),
            ...(dto.opensAt !== undefined
              ? { opensAt: dto.opensAt ? new Date(dto.opensAt) : null }
              : {}),
            ...(dto.closesAt !== undefined
              ? { closesAt: dto.closesAt ? new Date(dto.closesAt) : null }
              : {}),
            ...(dto.timeLimit !== undefined ? { timeLimit: dto.timeLimit } : {}),
            ...(dto.maxResponses !== undefined ? { maxResponses: dto.maxResponses } : {}),
            ...(dto.multiStep !== undefined ? { multiStep: dto.multiStep } : {}),
            ...(dto.stepsConfig !== undefined
              ? { stepsConfig: this.toInputJson(dto.stepsConfig) }
              : {}),
            ...(dto.thankYouMessage !== undefined
              ? { thankYouMessage: dto.thankYouMessage?.trim() || null }
              : {}),
            ...(dto.redirectUrl !== undefined
              ? { redirectUrl: dto.redirectUrl?.trim() || null }
              : {}),
            ...(dto.customCss !== undefined ? { customCss: dto.customCss ?? null } : {}),
            ...(dto.fields
              ? {
                  fields: {
                    create: dto.fields.map((field, index) =>
                      this.toFieldCreateInput(field, index),
                    ),
                  },
                }
              : {}),
          },
          include: formWithFieldsInclude,
        });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Форма с таким slug уже существует');
      }
      throw error;
    }
  }

  async deleteForm(formId: string): Promise<void> {
    await this.requireForm(formId);
    await this.prisma.form.update({
      where: { id: formId },
      data: {
        status: FormStatus.ARCHIVED,
        deletedAt: new Date(),
      },
    });
  }

  async publishForm(formId: string): Promise<FormWithFields> {
    const form = await this.requireForm(formId);
    const fieldsCount = await this.prisma.formField.count({ where: { formId } });
    if (fieldsCount === 0) {
      throw new BadRequestException('Нельзя опубликовать форму без полей');
    }

    return this.prisma.form.update({
      where: { id: form.id },
      data: { status: FormStatus.PUBLISHED, deletedAt: null },
      include: formWithFieldsInclude,
    });
  }

  async closeForm(formId: string): Promise<FormWithFields> {
    const form = await this.requireForm(formId);
    return this.prisma.form.update({
      where: { id: form.id },
      data: { status: FormStatus.CLOSED },
      include: formWithFieldsInclude,
    });
  }

  async getFormBySlug(slug: string, viewer?: Viewer): Promise<FormWithFields> {
    const form = await this.prisma.form.findUnique({
      where: { slug },
      include: formWithFieldsInclude,
    });

    if (!form || form.deletedAt || form.status === FormStatus.ARCHIVED) {
      throw new NotFoundException('Форма не найдена');
    }

    this.assertVisibility(form.visibility, viewer);
    return form;
  }

  async getFormById(id: string): Promise<FormWithFields> {
    const form = await this.prisma.form.findUnique({
      where: { id },
      include: formWithFieldsInclude,
    });

    if (!form) {
      throw new NotFoundException('Форма не найдена');
    }
    return form;
  }

  async getMyForms(userId: string): Promise<FormWithFields[]> {
    return this.prisma.form.findMany({
      where: { createdById: userId, deletedAt: null },
      include: formWithFieldsInclude,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async listPublished(viewer?: Viewer): Promise<FormWithFields[]> {
    const rows = await this.prisma.form.findMany({
      where: {
        status: FormStatus.PUBLISHED,
        deletedAt: null,
        visibility: { not: FormVisibility.INVITE_ONLY },
        NOT: { slug: { startsWith: TEMPLATE_PREFIX } },
      },
      include: formWithFieldsInclude,
      orderBy: [{ updatedAt: 'desc' }],
    });

    return rows.filter((form) => this.hasVisibilityAccess(form.visibility, viewer));
  }

  async listAdmin(query: ListFormsQueryDto): Promise<PaginatedResult<FormWithFields>> {
    const { page, limit, skip } = normalizePagination(query);
    const search = query.search?.trim();

    const where: Prisma.FormWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.visibility ? { visibility: query.visibility } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { slug: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.form.findMany({
        where,
        include: formWithFieldsInclude,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.form.count({ where }),
    ]);

    return buildPaginatedResult(rows, total, page, limit);
  }

  async listTemplates(): Promise<FormWithFields[]> {
    return this.prisma.form.findMany({
      where: { slug: { startsWith: TEMPLATE_PREFIX } },
      include: formWithFieldsInclude,
      orderBy: { title: 'asc' },
    });
  }

  async createFromTemplate(
    templateSlug: string,
    userId: string,
    overrides?: Partial<CreateFormDto>,
  ): Promise<FormWithFields> {
    const template = await this.prisma.form.findUnique({
      where: { slug: templateSlug },
      include: formWithFieldsInclude,
    });

    if (!template || !template.slug.startsWith(TEMPLATE_PREFIX)) {
      throw new NotFoundException('Шаблон не найден');
    }

    const baseTitle = overrides?.title?.trim() || template.title;
    const baseSlug = overrides?.slug?.trim() || slugifyForm(baseTitle);
    const slug = await this.ensureUniqueSlug(baseSlug);

    return this.prisma.form.create({
      data: {
        title: baseTitle,
        slug,
        description: overrides?.description ?? template.description,
        coverImage: overrides?.coverImage ?? template.coverImage,
        visibility: overrides?.visibility ?? template.visibility,
        status: overrides?.status ?? FormStatus.DRAFT,
        onePerUser: overrides?.onePerUser ?? template.onePerUser,
        isAnonymous: overrides?.isAnonymous ?? template.isAnonymous,
        showResults: overrides?.showResults ?? template.showResults,
        requiresAuth: overrides?.requiresAuth ?? template.requiresAuth,
        requiresCaptcha: overrides?.requiresCaptcha ?? template.requiresCaptcha,
        multiStep: overrides?.multiStep ?? template.multiStep,
        stepsConfig: this.toInputJson(template.stepsConfig),
        thankYouMessage: overrides?.thankYouMessage ?? template.thankYouMessage,
        redirectUrl: overrides?.redirectUrl ?? template.redirectUrl,
        customCss: overrides?.customCss ?? template.customCss,
        createdById: userId,
        fields: {
          create: template.fields.map((field, index) => ({
            type: field.type,
            label: field.label,
            description: field.description,
            placeholder: field.placeholder,
            isRequired: field.isRequired,
            order: field.order ?? index,
            stepIndex: field.stepIndex,
            options: this.toInputJson(field.options),
            validation: this.toInputJson(field.validation),
            conditionalLogic: this.toInputJson(field.conditionalLogic),
            defaultValue: field.defaultValue,
            minValue: field.minValue,
            maxValue: field.maxValue,
            minLength: field.minLength,
            maxLength: field.maxLength,
            maxFiles: field.maxFiles,
            maxFileSize: field.maxFileSize,
            allowedMimes: field.allowedMimes,
            metadata: this.toInputJson(field.metadata),
          })),
        },
      },
      include: formWithFieldsInclude,
    });
  }

  async duplicateForm(formId: string, userId: string): Promise<FormWithFields> {
    const source = await this.getFormById(formId);
    const baseSlug = slugifyForm(`${source.title}-copy`);
    const slug = await this.ensureUniqueSlug(baseSlug);

    return this.prisma.form.create({
      data: {
        title: `${source.title} (копия)`,
        slug,
        description: source.description,
        coverImage: source.coverImage,
        visibility: source.visibility,
        status: FormStatus.DRAFT,
        onePerUser: source.onePerUser,
        isAnonymous: source.isAnonymous,
        showResults: source.showResults,
        requiresAuth: source.requiresAuth,
        requiresCaptcha: source.requiresCaptcha,
        opensAt: source.opensAt,
        closesAt: source.closesAt,
        timeLimit: source.timeLimit,
        maxResponses: source.maxResponses,
        multiStep: source.multiStep,
        stepsConfig: this.toInputJson(source.stepsConfig),
        thankYouMessage: source.thankYouMessage,
        redirectUrl: source.redirectUrl,
        customCss: source.customCss,
        createdById: userId,
        fields: {
          create: source.fields.map((field, index) => ({
            type: field.type,
            label: field.label,
            description: field.description,
            placeholder: field.placeholder,
            isRequired: field.isRequired,
            order: field.order ?? index,
            stepIndex: field.stepIndex,
            options: this.toInputJson(field.options),
            validation: this.toInputJson(field.validation),
            conditionalLogic: this.toInputJson(field.conditionalLogic),
            defaultValue: field.defaultValue,
            minValue: field.minValue,
            maxValue: field.maxValue,
            minLength: field.minLength,
            maxLength: field.maxLength,
            maxFiles: field.maxFiles,
            maxFileSize: field.maxFileSize,
            allowedMimes: field.allowedMimes,
            metadata: this.toInputJson(field.metadata),
          })),
        },
      },
      include: formWithFieldsInclude,
    });
  }

  async getStats(formId: string): Promise<FormStats> {
    const form = await this.getFormById(formId);
    const [total, completed] = await Promise.all([
      this.prisma.formResponse.count({ where: { formId } }),
      this.prisma.formResponse.count({ where: { formId, isComplete: true } }),
    ]);

    const answers = await this.prisma.formFieldAnswer.findMany({
      where: {
        field: { formId },
        response: { isComplete: true },
      },
      select: {
        fieldId: true,
        textValue: true,
        numberValue: true,
        jsonValue: true,
      },
    });

    const answersByField = new Map<string, typeof answers>();
    for (const answer of answers) {
      const arr = answersByField.get(answer.fieldId) ?? [];
      arr.push(answer);
      answersByField.set(answer.fieldId, arr);
    }

    const fields: FormStatsField[] = form.fields.map((field) => {
      const list = answersByField.get(field.id) ?? [];
      const base: FormStatsField = {
        fieldId: field.id,
        label: field.label,
        type: field.type,
        count: list.length,
      };

      switch (field.type) {
        case 'RADIO':
        case 'SELECT': {
          const distribution: Record<string, number> = {};
          for (const answer of list) {
            const key = answer.textValue?.trim();
            if (!key) continue;
            distribution[key] = (distribution[key] ?? 0) + 1;
          }
          return { ...base, distribution };
        }

        case 'CHECKBOX': {
          const distribution: Record<string, number> = {};
          for (const answer of list) {
            const options = Array.isArray(answer.jsonValue) ? answer.jsonValue : [];
            for (const entry of options) {
              const key = typeof entry === 'string' ? entry : String(entry);
              distribution[key] = (distribution[key] ?? 0) + 1;
            }
          }
          return { ...base, distribution };
        }

        case 'RATING':
        case 'NUMBER': {
          const values = list
            .map((entry) =>
              entry.numberValue === null || entry.numberValue === undefined
                ? Number.NaN
                : Number(entry.numberValue),
            )
            .filter((num) => Number.isFinite(num));

          if (!values.length) {
            return base;
          }

          const sum = values.reduce((acc, cur) => acc + cur, 0);
          return {
            ...base,
            average: Math.round((sum / values.length) * 100) / 100,
            min: Math.min(...values),
            max: Math.max(...values),
          };
        }

        default:
          return base;
      }
    });

    return {
      totalResponses: total,
      completedResponses: completed,
      completionRate: total === 0 ? 0 : Math.round((completed / total) * 100),
      fields,
    };
  }

  async createInvite(
    formId: string,
    userId: string,
    dto: CreateInviteDto,
  ): Promise<FormInviteView> {
    await this.getFormById(formId);
    const code = randomBytes(6).toString('hex');
    const invite = await this.prisma.formInvite.create({
      data: {
        formId,
        code,
        maxUses: dto.maxUses ?? null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        createdBy: userId,
      },
    });

    return toInviteView(invite);
  }

  async listInvites(formId: string): Promise<FormInviteView[]> {
    const invites = await this.prisma.formInvite.findMany({
      where: { formId },
      orderBy: { createdAt: 'desc' },
    });
    return invites.map(toInviteView);
  }

  async deleteInvite(formId: string, code: string): Promise<void> {
    const invite = await this.prisma.formInvite.findUnique({ where: { code } });
    if (!invite || invite.formId !== formId) {
      throw new NotFoundException('Приглашение не найдено');
    }
    await this.prisma.formInvite.delete({ where: { id: invite.id } });
  }

  async getFormByInviteCode(code: string): Promise<FormWithFields> {
    const invite = await this.prisma.formInvite.findUnique({ where: { code } });
    if (!invite) {
      throw new NotFoundException('Приглашение не найдено');
    }

    if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
      throw new ForbiddenException('Срок действия приглашения истёк');
    }

    if (invite.maxUses !== null && invite.usedCount >= invite.maxUses) {
      throw new ForbiddenException('Лимит использования приглашения исчерпан');
    }

    const form = await this.prisma.form.findUnique({
      where: { id: invite.formId },
      include: formWithFieldsInclude,
    });

    if (!form || form.deletedAt) {
      throw new NotFoundException('Форма не найдена');
    }

    return form;
  }

  async getAutofill(userId: string): Promise<FormAutofill> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        roleGroup: true,
        statistics: {
          select: { coins: true, playTime: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return {
      username: user.username,
      roleGroup: user.roleGroup as RoleGroup,
      stats: user.statistics
        ? {
            playTimeHours: user.statistics.playTime
              ? Math.round(user.statistics.playTime / 60)
              : 0,
            coins: user.statistics.coins ?? 0,
            level: null,
          }
        : null,
    };
  }

  // ─── Helpers ────────────────────────────────────────────

  async requireForm(id: string): Promise<FormWithFields> {
    const form = await this.prisma.form.findUnique({
      where: { id },
      include: formWithFieldsInclude,
    });
    if (!form) {
      throw new NotFoundException('Форма не найдена');
    }
    return form;
  }

  private assertVisibility(visibility: FormVisibility, viewer?: Viewer): void {
    if (visibility === FormVisibility.PUBLIC) return;

    if (visibility === FormVisibility.INVITE_ONLY) {
      throw new ForbiddenException('Форма доступна только по приглашению');
    }

    if (!viewer?.id || !viewer.roleGroup) {
      throw new ForbiddenException('Требуется авторизация');
    }

    if (visibility === FormVisibility.AUTHENTICATED) return;

    const required = VISIBILITY_REQUIREMENTS[visibility];
    if (required && !hasRoleGroup(viewer.roleGroup, required)) {
      throw new ForbiddenException('Недостаточно прав для этой формы');
    }
  }

  private hasVisibilityAccess(visibility: FormVisibility, viewer?: Viewer): boolean {
    try {
      this.assertVisibility(visibility, viewer);
      return true;
    } catch {
      return false;
    }
  }

  private toFieldCreateInput(
    field: CreateFormFieldDto,
    fallbackOrder: number,
  ): Prisma.FormFieldCreateWithoutFormInput {
    return {
      type: field.type,
      label: field.label.trim(),
      description: field.description?.toString().trim() || null,
      placeholder: field.placeholder?.toString().trim() || null,
      isRequired: field.isRequired ?? false,
      order: field.order ?? fallbackOrder,
      stepIndex: field.stepIndex ?? null,
      options: this.toInputJson(field.options),
      validation: this.toInputJson(field.validation),
      conditionalLogic: this.toInputJson(field.conditionalLogic),
      defaultValue: field.defaultValue?.toString() ?? null,
      minValue: field.minValue ?? null,
      maxValue: field.maxValue ?? null,
      minLength: field.minLength ?? null,
      maxLength: field.maxLength ?? null,
      maxFiles: field.maxFiles ?? null,
      maxFileSize: field.maxFileSize ?? null,
      allowedMimes: field.allowedMimes ?? [],
      metadata: this.toInputJson(field.metadata),
    };
  }

  private toInputJson(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
    if (value === undefined) return undefined;
    if (value === null) return Prisma.JsonNull;
    return value as Prisma.InputJsonValue;
  }

  private async ensureUniqueSlug(base: string): Promise<string> {
    let candidate = base;
    let suffix = 2;

    while (await this.prisma.form.findUnique({ where: { slug: candidate } })) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }
}

// Re-export mapper helpers used by controllers
export { toFormDetail, toFormSummary };
