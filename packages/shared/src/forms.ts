import type { RoleGroup } from './user';

export const FormFieldType = {
  TEXT: 'TEXT',
  TEXTAREA: 'TEXTAREA',
  RADIO: 'RADIO',
  CHECKBOX: 'CHECKBOX',
  SELECT: 'SELECT',
  NUMBER: 'NUMBER',
  DATE: 'DATE',
  TIME: 'TIME',
  EMAIL: 'EMAIL',
  PHONE: 'PHONE',
  URL: 'URL',
  FILE_UPLOAD: 'FILE_UPLOAD',
  RATING: 'RATING',
  COLOR_PICKER: 'COLOR_PICKER',
  CODE_EDITOR: 'CODE_EDITOR',
  MARKDOWN_EDITOR: 'MARKDOWN_EDITOR',
  IMAGE_GALLERY: 'IMAGE_GALLERY',
  VIDEO_URL: 'VIDEO_URL',
  SCHEDULE_PICKER: 'SCHEDULE_PICKER',
  AGREEMENT_CHECKLIST: 'AGREEMENT_CHECKLIST',
  PLAYER_SELECTOR: 'PLAYER_SELECTOR',
  SERVER_SELECTOR: 'SERVER_SELECTOR',
  RANK_SELECTOR: 'RANK_SELECTOR',
  FRIENDS_SELECTOR: 'FRIENDS_SELECTOR',
  PRODUCT_SELECTOR: 'PRODUCT_SELECTOR',
  ORDER_SELECTOR: 'ORDER_SELECTOR',
  REPORT_REFERENCE: 'REPORT_REFERENCE',
  NEWS_REFERENCE: 'NEWS_REFERENCE',
  TOPIC_REFERENCE: 'TOPIC_REFERENCE',
  PUNISHMENT_REFERENCE: 'PUNISHMENT_REFERENCE',
  SIGNATURE: 'SIGNATURE',
  DATE_RANGE: 'DATE_RANGE',
  CURRENCY_AMOUNT: 'CURRENCY_AMOUNT',
  STATS_DISPLAY: 'STATS_DISPLAY',
  ACHIEVEMENT_SELECTOR: 'ACHIEVEMENT_SELECTOR',
} as const;

export type FormFieldType = (typeof FormFieldType)[keyof typeof FormFieldType];

export const FormVisibility = {
  PUBLIC: 'PUBLIC',
  AUTHENTICATED: 'AUTHENTICATED',
  HELPER_ONLY: 'HELPER_ONLY',
  MODERATOR_ONLY: 'MODERATOR_ONLY',
  ADMIN_ONLY: 'ADMIN_ONLY',
  OWNER_ONLY: 'OWNER_ONLY',
  INVITE_ONLY: 'INVITE_ONLY',
} as const;

export type FormVisibility = (typeof FormVisibility)[keyof typeof FormVisibility];

export const FormStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  CLOSED: 'CLOSED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type FormStatus = (typeof FormStatus)[keyof typeof FormStatus];

export interface FormFieldDto {
  id: string;
  type: FormFieldType;
  label: string;
  description: string | null;
  placeholder: string | null;
  isRequired: boolean;
  order: number;
  stepIndex: number | null;
  options: unknown;
  validation: unknown;
  conditionalLogic: unknown;
  defaultValue: string | null;
  minValue: number | null;
  maxValue: number | null;
  minLength: number | null;
  maxLength: number | null;
  maxFiles: number | null;
  maxFileSize: number | null;
  allowedMimes: string[];
  metadata: unknown;
}

export interface FormSummary {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  status: FormStatus;
  visibility: FormVisibility;
  responsesCount: number;
  onePerUser: boolean;
  showResults: boolean;
  opensAt: string | null;
  closesAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FormDetail extends FormSummary {
  descriptionHtml: string | null;
  isAnonymous: boolean;
  requiresAuth: boolean;
  requiresCaptcha: boolean;
  timeLimit: number | null;
  maxResponses: number | null;
  multiStep: boolean;
  stepsConfig: unknown;
  thankYouMessage: string | null;
  redirectUrl: string | null;
  customCss: string | null;
  createdById: string;
  fields: FormFieldDto[];
  alreadyResponded?: boolean;
}

export interface FormResponseSummary {
  id: string;
  formId: string;
  formTitle?: string;
  formSlug?: string;
  respondentId: string | null;
  respondentUsername?: string | null;
  isAnonymous: boolean;
  isComplete: boolean;
  completedAt: string | null;
  startedAt: string;
  currentStep: number;
  createdAt: string;
}

export interface FormFieldAnswerDto {
  id: string;
  fieldId: string;
  fieldLabel?: string;
  fieldType?: FormFieldType;
  textValue: string | null;
  numberValue: number | null;
  booleanValue: boolean | null;
  dateValue: string | null;
  jsonValue: unknown;
  fileUrls: string[];
}

export interface FormResponseDetail extends FormResponseSummary {
  answers: FormFieldAnswerDto[];
  userAgent: string | null;
}

export interface FormStatsField {
  fieldId: string;
  label: string;
  type: FormFieldType;
  distribution?: Record<string, number>;
  average?: number;
  min?: number;
  max?: number;
  count: number;
}

export interface FormStats {
  totalResponses: number;
  completedResponses: number;
  completionRate: number;
  fields: FormStatsField[];
}

export interface FormAutofill {
  username: string;
  roleGroup: RoleGroup;
  stats: {
    playTimeHours: number | null;
    coins: number | null;
    level: number | null;
  } | null;
}
