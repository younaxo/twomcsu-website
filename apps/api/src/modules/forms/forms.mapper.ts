import {
  Form,
  FormField,
  FormFieldAnswer,
  FormFieldType,
  FormInvite,
  FormResponse,
  Prisma,
  User,
} from '@prisma/client';
import {
  FormDetail,
  FormFieldAnswerDto,
  FormFieldDto,
  FormResponseDetail,
  FormResponseSummary,
  FormStatus,
  FormSummary,
  FormVisibility,
} from '@twomc/shared';

export type FormWithFields = Form & { fields: FormField[] };

export type ResponseWithAnswers = FormResponse & {
  answers: (FormFieldAnswer & { field: Pick<FormField, 'label' | 'type'> })[];
  respondent?: Pick<User, 'id' | 'username'> | null;
};

export type SimpleResponse = FormResponse & {
  respondent?: Pick<User, 'id' | 'username'> | null;
  form?: Pick<Form, 'title' | 'slug'>;
};

export interface FormInviteView {
  id: string;
  code: string;
  formId: string;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  createdBy: string;
  createdAt: string;
}

function toFieldDto(field: FormField): FormFieldDto {
  return {
    id: field.id,
    type: field.type as FormFieldType,
    label: field.label,
    description: field.description,
    placeholder: field.placeholder,
    isRequired: field.isRequired,
    order: field.order,
    stepIndex: field.stepIndex,
    options: field.options as Prisma.JsonValue,
    validation: field.validation as Prisma.JsonValue,
    conditionalLogic: field.conditionalLogic as Prisma.JsonValue,
    defaultValue: field.defaultValue,
    minValue: field.minValue,
    maxValue: field.maxValue,
    minLength: field.minLength,
    maxLength: field.maxLength,
    maxFiles: field.maxFiles,
    maxFileSize: field.maxFileSize,
    allowedMimes: field.allowedMimes,
    metadata: field.metadata as Prisma.JsonValue,
  };
}

export function toFormSummary(form: Form & { responsesCount?: number }): FormSummary {
  return {
    id: form.id,
    slug: form.slug,
    title: form.title,
    description: form.description,
    coverImage: form.coverImage,
    status: form.status as FormStatus,
    visibility: form.visibility as FormVisibility,
    responsesCount: form.responsesCount ?? 0,
    onePerUser: form.onePerUser,
    showResults: form.showResults,
    opensAt: form.opensAt?.toISOString() ?? null,
    closesAt: form.closesAt?.toISOString() ?? null,
    createdAt: form.createdAt.toISOString(),
    updatedAt: form.updatedAt.toISOString(),
  };
}

export function toFormDetail(
  form: FormWithFields,
  extras?: { alreadyResponded?: boolean },
): FormDetail {
  const summary = toFormSummary(form);
  const fields = [...form.fields]
    .sort((a, b) => a.order - b.order)
    .map(toFieldDto);

  return {
    ...summary,
    descriptionHtml: form.descriptionHtml,
    isAnonymous: form.isAnonymous,
    requiresAuth: form.requiresAuth,
    requiresCaptcha: form.requiresCaptcha,
    timeLimit: form.timeLimit,
    maxResponses: form.maxResponses,
    multiStep: form.multiStep,
    stepsConfig: form.stepsConfig as Prisma.JsonValue,
    thankYouMessage: form.thankYouMessage,
    redirectUrl: form.redirectUrl,
    customCss: form.customCss,
    createdById: form.createdById,
    fields,
    ...(extras?.alreadyResponded !== undefined
      ? { alreadyResponded: extras.alreadyResponded }
      : {}),
  };
}

export function toResponseSummary(response: SimpleResponse): FormResponseSummary {
  return {
    id: response.id,
    formId: response.formId,
    formTitle: response.form?.title,
    formSlug: response.form?.slug,
    respondentId: response.respondentId,
    respondentUsername: response.respondent?.username ?? null,
    isAnonymous: response.isAnonymous,
    isComplete: response.isComplete,
    completedAt: response.completedAt?.toISOString() ?? null,
    startedAt: response.startedAt.toISOString(),
    currentStep: response.currentStep,
    createdAt: response.createdAt.toISOString(),
  };
}

function toAnswerDto(answer: ResponseWithAnswers['answers'][number]): FormFieldAnswerDto {
  return {
    id: answer.id,
    fieldId: answer.fieldId,
    fieldLabel: answer.field.label,
    fieldType: answer.field.type as FormFieldType,
    textValue: answer.textValue,
    numberValue:
      answer.numberValue === null || answer.numberValue === undefined
        ? null
        : Number(answer.numberValue),
    booleanValue: answer.booleanValue,
    dateValue: answer.dateValue?.toISOString() ?? null,
    jsonValue: answer.jsonValue as Prisma.JsonValue,
    fileUrls: answer.fileUrls,
  };
}

export function toResponseDetail(response: ResponseWithAnswers): FormResponseDetail {
  return {
    ...toResponseSummary(response),
    userAgent: response.userAgent,
    answers: response.answers.map(toAnswerDto),
  };
}

export function toInviteView(invite: FormInvite): FormInviteView {
  return {
    id: invite.id,
    code: invite.code,
    formId: invite.formId,
    maxUses: invite.maxUses,
    usedCount: invite.usedCount,
    expiresAt: invite.expiresAt?.toISOString() ?? null,
    createdBy: invite.createdBy,
    createdAt: invite.createdAt.toISOString(),
  };
}
