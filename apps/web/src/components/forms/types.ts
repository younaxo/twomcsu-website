import type { FormFieldDto } from '@twomc/shared';

// Local builder draft (mirrors FormFieldDto but everything optional except id/type/label)
export type BuilderField = FormFieldDto & {
  // Internal builder-only flags
  _isNew?: boolean;
};

export type FieldValue = {
  fieldId: string;
  textValue?: string | null;
  numberValue?: number | null;
  booleanValue?: boolean | null;
  dateValue?: string | null;
  jsonValue?: unknown;
  fileUrls?: string[];
};

export type AnswersMap = Record<string, FieldValue>;

export interface ConditionalRule {
  fieldId: string;
  operator: 'eq' | 'neq' | 'in' | 'contains';
  value: unknown;
}

export interface ConditionalLogic {
  showIf?: ConditionalRule | ConditionalRule[];
  hideIf?: ConditionalRule | ConditionalRule[];
}

export interface StepConfigItem {
  title?: string;
  description?: string;
}
