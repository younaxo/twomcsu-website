import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { FormFieldType, FormStatus, Prisma } from '@prisma/client';
import { CaptchaService } from '../auth/captcha.service';
import {
  buildPaginatedResult,
  normalizePagination,
  PaginatedResult,
} from '../../common/pagination';
import { PrismaService } from '../prisma/prisma.service';
import {
  AnswerDto,
  ListResponsesQueryDto,
  SaveDraftDto,
  SubmitResponseDto,
} from './dto/forms.dto';
import { FormsService } from './forms.service';
import { FormValidationService } from './form-validation.service';
import {
  ResponseWithAnswers,
  SimpleResponse,
  toResponseDetail,
  toResponseSummary,
} from './forms.mapper';

const responseWithAnswersInclude = {
  answers: {
    include: {
      field: { select: { label: true, type: true } },
    },
  },
  respondent: { select: { id: true, username: true } },
} satisfies Prisma.FormResponseInclude;

const simpleResponseInclude = {
  respondent: { select: { id: true, username: true } },
  form: { select: { title: true, slug: true } },
} satisfies Prisma.FormResponseInclude;

interface SubmitMeta {
  ipHash?: string | null;
  userAgent?: string | null;
  ip?: string | null;
}

@Injectable()
export class FormResponsesService {
  private readonly logger = new Logger(FormResponsesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly forms: FormsService,
    private readonly validation: FormValidationService,
    private readonly captcha: CaptchaService,
  ) {}

  async submitResponse(
    slug: string,
    userId: string | null,
    dto: SubmitResponseDto,
    meta: SubmitMeta = {},
  ): Promise<{ id: string }> {
    const form = await this.forms.getFormBySlug(
      slug,
      userId ? { id: userId, roleGroup: undefined } : undefined,
    );

    if (form.status !== FormStatus.PUBLISHED) {
      throw new ForbiddenException('Форма недоступна для отправки');
    }

    if (form.requiresAuth && !userId) {
      throw new ForbiddenException('Для отправки формы требуется авторизация');
    }

    const now = new Date();
    if (form.opensAt && form.opensAt.getTime() > now.getTime()) {
      throw new ForbiddenException('Форма ещё не открыта');
    }
    if (form.closesAt && form.closesAt.getTime() < now.getTime()) {
      throw new ForbiddenException('Форма закрыта для новых ответов');
    }

    if (form.maxResponses !== null && form.responsesCount >= form.maxResponses) {
      throw new ForbiddenException('Достигнут лимит ответов на форму');
    }

    if (form.onePerUser && userId) {
      const existing = await this.prisma.formResponse.findFirst({
        where: { formId: form.id, respondentId: userId, isComplete: true },
        select: { id: true },
      });

      if (existing) {
        throw new ConflictException('Вы уже отправляли эту форму');
      }
    }

    if (form.requiresCaptcha && !dto.isDraft) {
      try {
        await this.captcha.verify(dto.captchaToken, meta.ip ?? undefined);
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        this.logger.warn(`captcha verification failed: ${String(error)}`);
        throw new BadRequestException('Не удалось проверить капчу');
      }
    }

    const answersMap = new Map<string, AnswerDto>();
    for (const answer of dto.answers ?? []) {
      answersMap.set(answer.fieldId, answer);
    }

    // Existing draft (for time-limit + reuse the row when submitting a saved draft)
    const draft =
      userId && !form.isAnonymous
        ? await this.prisma.formResponse.findFirst({
            where: { formId: form.id, respondentId: userId, isComplete: false },
            orderBy: { createdAt: 'desc' },
          })
        : null;

    if (!dto.isDraft && form.timeLimit && draft?.startedAt) {
      const elapsedSeconds = Math.floor((now.getTime() - draft.startedAt.getTime()) / 1000);
      if (elapsedSeconds > form.timeLimit) {
        throw new ForbiddenException('Время на заполнение формы истекло');
      }
    }

    const fieldsById = new Map(form.fields.map((field) => [field.id, field]));

    for (const answer of dto.answers ?? []) {
      if (!fieldsById.has(answer.fieldId)) {
        throw new BadRequestException(`Неизвестное поле: ${answer.fieldId}`);
      }
    }

    if (!dto.isDraft) {
      for (const field of form.fields) {
        if (!this.validation.isFieldVisible(field, answersMap)) {
          answersMap.delete(field.id);
          continue;
        }
        await this.validation.validateField(field, answersMap.get(field.id));
      }
    }

    const invite = dto.inviteCode
      ? await this.prisma.formInvite.findUnique({ where: { code: dto.inviteCode } })
      : null;

    if (dto.inviteCode) {
      if (!invite || invite.formId !== form.id) {
        throw new NotFoundException('Приглашение не найдено');
      }
      if (invite.expiresAt && invite.expiresAt.getTime() < now.getTime()) {
        throw new ForbiddenException('Срок действия приглашения истёк');
      }
      if (invite.maxUses !== null && invite.usedCount >= invite.maxUses) {
        throw new ForbiddenException('Лимит использования приглашения исчерпан');
      }
    }

    const isDraft = dto.isDraft === true;

    const result = await this.prisma.$transaction(async (tx) => {
      const response = draft
        ? await tx.formResponse.update({
            where: { id: draft.id },
            data: {
              isComplete: !isDraft,
              completedAt: isDraft ? null : now,
              userAgent: meta.userAgent ?? draft.userAgent,
              ipHash: meta.ipHash ?? draft.ipHash,
              isAnonymous: form.isAnonymous || !userId,
            },
          })
        : await tx.formResponse.create({
            data: {
              formId: form.id,
              respondentId: form.isAnonymous ? null : userId,
              isAnonymous: form.isAnonymous || !userId,
              ipHash: meta.ipHash ?? null,
              userAgent: meta.userAgent ?? null,
              isComplete: !isDraft,
              completedAt: isDraft ? null : now,
              startedAt: now,
              currentStep: 0,
            },
          });

      await tx.formFieldAnswer.deleteMany({ where: { responseId: response.id } });

      const answerEntries = [...answersMap.entries()];
      if (answerEntries.length) {
        await tx.formFieldAnswer.createMany({
          data: answerEntries.map(([fieldId, answer]) =>
            this.toAnswerCreateInput(response.id, fieldId, answer),
          ),
        });
      }

      if (!isDraft) {
        await tx.form.update({
          where: { id: form.id },
          data: { responsesCount: { increment: 1 } },
        });

        if (invite) {
          await tx.formInvite.update({
            where: { id: invite.id },
            data: { usedCount: { increment: 1 } },
          });
        }
      }

      return response;
    });

    return { id: result.id };
  }

  async saveDraft(slug: string, userId: string, dto: SaveDraftDto): Promise<{ id: string }> {
    const form = await this.forms.getFormBySlug(slug, {
      id: userId,
      roleGroup: undefined,
    });

    const answersMap = new Map<string, AnswerDto>();
    for (const answer of dto.answers ?? []) {
      answersMap.set(answer.fieldId, answer);
    }

    const draft = await this.prisma.formResponse.findFirst({
      where: { formId: form.id, respondentId: userId, isComplete: false },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      const response = draft
        ? await tx.formResponse.update({
            where: { id: draft.id },
            data: { currentStep: dto.currentStep ?? draft.currentStep },
          })
        : await tx.formResponse.create({
            data: {
              formId: form.id,
              respondentId: userId,
              isAnonymous: false,
              isComplete: false,
              startedAt: now,
              currentStep: dto.currentStep ?? 0,
            },
          });

      await tx.formFieldAnswer.deleteMany({ where: { responseId: response.id } });

      const entries = [...answersMap.entries()];
      if (entries.length) {
        await tx.formFieldAnswer.createMany({
          data: entries.map(([fieldId, answer]) =>
            this.toAnswerCreateInput(response.id, fieldId, answer),
          ),
        });
      }

      return response;
    });

    return { id: result.id };
  }

  async getResponses(
    formId: string,
    filters: ListResponsesQueryDto,
  ): Promise<PaginatedResult<ReturnType<typeof toResponseSummary>>> {
    await this.forms.requireForm(formId);
    const { page, limit, skip } = normalizePagination(filters);

    const where: Prisma.FormResponseWhereInput = {
      formId,
      ...(filters.completeOnly ? { isComplete: true } : {}),
      ...(filters.from || filters.to
        ? {
            createdAt: {
              ...(filters.from ? { gte: new Date(filters.from) } : {}),
              ...(filters.to ? { lte: new Date(filters.to) } : {}),
            },
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.formResponse.findMany({
        where,
        include: simpleResponseInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.formResponse.count({ where }),
    ]);

    return buildPaginatedResult(
      rows.map((row: SimpleResponse) => toResponseSummary(row)),
      total,
      page,
      limit,
    );
  }

  async getResponse(responseId: string): Promise<ReturnType<typeof toResponseDetail>> {
    const response = await this.prisma.formResponse.findUnique({
      where: { id: responseId },
      include: responseWithAnswersInclude,
    });

    if (!response) {
      throw new NotFoundException('Ответ не найден');
    }

    return toResponseDetail(response as ResponseWithAnswers);
  }

  async getMyResponses(userId: string): Promise<ReturnType<typeof toResponseSummary>[]> {
    const rows = await this.prisma.formResponse.findMany({
      where: { respondentId: userId },
      include: simpleResponseInclude,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return rows.map((row: SimpleResponse) => toResponseSummary(row));
  }

  async deleteResponse(responseId: string): Promise<void> {
    const response = await this.prisma.formResponse.findUnique({
      where: { id: responseId },
      select: { id: true, formId: true, isComplete: true },
    });

    if (!response) {
      throw new NotFoundException('Ответ не найден');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.formResponse.delete({ where: { id: response.id } });
      if (response.isComplete) {
        await tx.form.update({
          where: { id: response.formId },
          data: { responsesCount: { decrement: 1 } },
        });
      }
    });
  }

  async listResponsesForExport(
    formId: string,
    filters: { from?: string; to?: string; completeOnly?: boolean },
  ): Promise<ResponseWithAnswers[]> {
    await this.forms.requireForm(formId);

    const where: Prisma.FormResponseWhereInput = {
      formId,
      ...(filters.completeOnly ? { isComplete: true } : {}),
      ...(filters.from || filters.to
        ? {
            createdAt: {
              ...(filters.from ? { gte: new Date(filters.from) } : {}),
              ...(filters.to ? { lte: new Date(filters.to) } : {}),
            },
          }
        : {}),
    };

    const rows = await this.prisma.formResponse.findMany({
      where,
      include: responseWithAnswersInclude,
      orderBy: { createdAt: 'desc' },
      take: 10_000,
    });

    return rows as ResponseWithAnswers[];
  }

  private toAnswerCreateInput(
    responseId: string,
    fieldId: string,
    answer: AnswerDto,
  ): Prisma.FormFieldAnswerCreateManyInput {
    const numberValue =
      answer.numberValue === null || answer.numberValue === undefined
        ? null
        : new Prisma.Decimal(answer.numberValue);

    return {
      responseId,
      fieldId,
      textValue: answer.textValue ?? null,
      numberValue,
      booleanValue: answer.booleanValue ?? null,
      dateValue: answer.dateValue ? new Date(answer.dateValue) : null,
      jsonValue:
        answer.jsonValue === undefined
          ? Prisma.JsonNull
          : (answer.jsonValue as Prisma.InputJsonValue),
      fileUrls: answer.fileUrls ?? [],
    };
  }
}

/** Field types whose answers export nicely as text */
export function stringifyAnswer(
  fieldType: FormFieldType,
  answer: {
    textValue: string | null;
    numberValue: Prisma.Decimal | number | null;
    booleanValue: boolean | null;
    dateValue: Date | null;
    jsonValue: Prisma.JsonValue | null;
    fileUrls: string[];
  } | undefined,
): string {
  if (!answer) return '';

  switch (fieldType) {
    case FormFieldType.CHECKBOX:
    case FormFieldType.AGREEMENT_CHECKLIST:
    case FormFieldType.PLAYER_SELECTOR:
    case FormFieldType.FRIENDS_SELECTOR:
      if (Array.isArray(answer.jsonValue)) {
        return answer.jsonValue.map((v) => String(v)).join(', ');
      }
      return answer.textValue ?? '';

    case FormFieldType.FILE_UPLOAD:
    case FormFieldType.IMAGE_GALLERY:
      return answer.fileUrls.join(', ');

    case FormFieldType.NUMBER:
    case FormFieldType.RATING:
    case FormFieldType.CURRENCY_AMOUNT:
      return answer.numberValue !== null && answer.numberValue !== undefined
        ? String(answer.numberValue)
        : '';

    case FormFieldType.DATE:
    case FormFieldType.TIME:
      return answer.dateValue?.toISOString() ?? answer.textValue ?? '';

    case FormFieldType.DATE_RANGE:
      if (answer.jsonValue && typeof answer.jsonValue === 'object' && !Array.isArray(answer.jsonValue)) {
        const range = answer.jsonValue as { from?: string; to?: string };
        return `${range.from ?? ''} – ${range.to ?? ''}`;
      }
      return '';

    case FormFieldType.SCHEDULE_PICKER:
      return answer.jsonValue ? JSON.stringify(answer.jsonValue) : '';

    default:
      if (answer.textValue) return answer.textValue;
      if (answer.jsonValue !== null && answer.jsonValue !== undefined) {
        return typeof answer.jsonValue === 'string'
          ? answer.jsonValue
          : JSON.stringify(answer.jsonValue);
      }
      return '';
  }
}
