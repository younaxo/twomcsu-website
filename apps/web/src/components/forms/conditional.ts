import type { FormFieldDto } from '@twomc/shared';
import type { AnswersMap, ConditionalRule, FieldValue } from './types';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeRules(source: unknown): ConditionalRule[] {
  if (!source) return [];
  const raw = Array.isArray(source) ? source : [source];
  return raw.filter((entry): entry is ConditionalRule => {
    return (
      isPlainObject(entry) &&
      typeof (entry as Record<string, unknown>).fieldId === 'string' &&
      typeof (entry as Record<string, unknown>).operator === 'string' &&
      ['eq', 'neq', 'in', 'contains'].includes(
        String((entry as Record<string, unknown>).operator),
      )
    );
  });
}

function readAnswerValue(value: FieldValue | undefined): unknown {
  if (!value) return null;
  if (value.textValue != null) return value.textValue;
  if (value.numberValue != null) return value.numberValue;
  if (value.booleanValue != null) return value.booleanValue;
  if (value.dateValue != null) return value.dateValue;
  if (value.fileUrls?.length) return value.fileUrls;
  if (value.jsonValue !== undefined) return value.jsonValue;
  return null;
}

function softEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a == b;
  return String(a).toLowerCase() === String(b).toLowerCase();
}

function matchesRule(rule: ConditionalRule, answers: AnswersMap): boolean {
  const actual = readAnswerValue(answers[rule.fieldId]);
  switch (rule.operator) {
    case 'eq':
      return softEqual(actual, rule.value);
    case 'neq':
      return !softEqual(actual, rule.value);
    case 'in':
      if (Array.isArray(rule.value)) {
        return rule.value.some((entry) => softEqual(actual, entry));
      }
      if (Array.isArray(actual)) {
        return actual.some((entry) => softEqual(entry, rule.value));
      }
      return false;
    case 'contains':
      if (Array.isArray(actual)) {
        return actual.some((entry) => softEqual(entry, rule.value));
      }
      if (typeof actual === 'string' && typeof rule.value === 'string') {
        return actual.toLowerCase().includes(rule.value.toLowerCase());
      }
      return false;
    default:
      return false;
  }
}

/** Mirrors backend FormValidationService.isFieldVisible for renderer/preview */
export function isFieldVisible(field: FormFieldDto, answers: AnswersMap): boolean {
  const logic = field.conditionalLogic;
  if (!isPlainObject(logic)) return true;

  const showIf = normalizeRules(logic.showIf);
  const hideIf = normalizeRules(logic.hideIf);

  if (showIf.length && !showIf.every((rule) => matchesRule(rule, answers))) return false;
  if (hideIf.length && hideIf.every((rule) => matchesRule(rule, answers))) return false;

  return true;
}
