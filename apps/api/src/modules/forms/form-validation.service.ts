import { BadRequestException, Injectable } from '@nestjs/common';
import { FormField, FormFieldType, Prisma } from '@prisma/client';
import { AnswerDto } from './dto/forms.dto';

/** Shape stored in FormField.conditionalLogic */
export interface ConditionalRule {
  fieldId: string;
  operator: 'eq' | 'neq' | 'in' | 'contains';
  value: unknown;
}

export interface ConditionalLogic {
  showIf?: ConditionalRule | ConditionalRule[];
  hideIf?: ConditionalRule | ConditionalRule[];
}

export type AnswersMap = Map<string, AnswerDto>;

const URL_REGEX = /^https?:\/\/[^\s<>"']+$/i;
const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9()\-\s]{5,32}$/;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === 'string');
}

function extractChoices(options: Prisma.JsonValue | null | undefined): string[] {
  if (!options) return [];
  if (Array.isArray(options)) return toStringArray(options);
  if (isPlainObject(options)) {
    if (Array.isArray(options.choices)) return toStringArray(options.choices);
    if (Array.isArray(options.items)) return toStringArray(options.items);
    if (Array.isArray(options.options)) return toStringArray(options.options);
  }
  return [];
}

@Injectable()
export class FormValidationService {
  /** Whether a conditional field should be treated as present in the response */
  isFieldVisible(field: Pick<FormField, 'conditionalLogic'>, answers: AnswersMap): boolean {
    const logic = field.conditionalLogic;
    if (!isPlainObject(logic)) return true;

    const showIf = this.normalizeRules(logic.showIf);
    const hideIf = this.normalizeRules(logic.hideIf);

    if (showIf.length && !showIf.every((rule) => this.matchesRule(rule, answers))) {
      return false;
    }

    if (hideIf.length && hideIf.every((rule) => this.matchesRule(rule, answers))) {
      return false;
    }

    return true;
  }

  /** Throws a Russian BadRequestException when the answer is malformed for its field type */
  async validateField(field: FormField, answer: AnswerDto | undefined): Promise<void> {
    const isEmpty = this.isAnswerEmpty(answer);

    if (isEmpty) {
      if (field.isRequired) {
        throw new BadRequestException(`Поле «${field.label}» обязательно для заполнения`);
      }
      return;
    }

    const value = answer as AnswerDto;

    switch (field.type) {
      case FormFieldType.TEXT:
      case FormFieldType.TEXTAREA:
      case FormFieldType.MARKDOWN_EDITOR:
      case FormFieldType.CODE_EDITOR:
      case FormFieldType.SIGNATURE:
        this.assertTextLength(field, value.textValue);
        break;

      case FormFieldType.EMAIL:
        this.assertText(field, value.textValue);
        if (!EMAIL_REGEX.test(String(value.textValue))) {
          throw new BadRequestException(`«${field.label}»: неверный email`);
        }
        break;

      case FormFieldType.PHONE:
        this.assertText(field, value.textValue);
        if (!PHONE_REGEX.test(String(value.textValue))) {
          throw new BadRequestException(`«${field.label}»: неверный номер телефона`);
        }
        break;

      case FormFieldType.URL:
      case FormFieldType.VIDEO_URL:
        this.assertText(field, value.textValue);
        if (!URL_REGEX.test(String(value.textValue))) {
          throw new BadRequestException(`«${field.label}»: неверный URL`);
        }
        break;

      case FormFieldType.NUMBER:
      case FormFieldType.CURRENCY_AMOUNT:
        this.assertNumber(field, value.numberValue);
        break;

      case FormFieldType.RATING:
        this.assertNumber(field, value.numberValue);
        break;

      case FormFieldType.DATE:
      case FormFieldType.TIME:
        if (!value.dateValue && !value.textValue) {
          throw new BadRequestException(`«${field.label}»: укажите дату или время`);
        }
        break;

      case FormFieldType.DATE_RANGE: {
        const range = value.jsonValue;
        if (!isPlainObject(range) || typeof range.from !== 'string' || typeof range.to !== 'string') {
          throw new BadRequestException(`«${field.label}»: укажите начало и конец периода`);
        }
        const from = new Date(range.from);
        const to = new Date(range.to);
        if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
          throw new BadRequestException(`«${field.label}»: неверные даты периода`);
        }
        if (from.getTime() > to.getTime()) {
          throw new BadRequestException(`«${field.label}»: конец периода раньше начала`);
        }
        break;
      }

      case FormFieldType.COLOR_PICKER:
        this.assertText(field, value.textValue);
        if (!HEX_COLOR_REGEX.test(String(value.textValue))) {
          throw new BadRequestException(`«${field.label}»: неверный HEX-цвет`);
        }
        break;

      case FormFieldType.RADIO:
      case FormFieldType.SELECT:
      case FormFieldType.RANK_SELECTOR: {
        this.assertText(field, value.textValue);
        const choices = extractChoices(field.options);
        if (choices.length && !choices.includes(String(value.textValue))) {
          throw new BadRequestException(`«${field.label}»: недопустимый вариант ответа`);
        }
        break;
      }

      case FormFieldType.CHECKBOX: {
        const chosen = this.extractJsonArray(value);
        if (!chosen.length) {
          throw new BadRequestException(`«${field.label}»: выберите хотя бы один вариант`);
        }
        const choices = extractChoices(field.options);
        if (choices.length) {
          for (const entry of chosen) {
            if (!choices.includes(entry)) {
              throw new BadRequestException(`«${field.label}»: недопустимый вариант «${entry}»`);
            }
          }
        }
        break;
      }

      case FormFieldType.AGREEMENT_CHECKLIST: {
        const items = extractChoices(field.options);
        const agreed = new Set(this.extractJsonArray(value));
        for (const item of items) {
          if (!agreed.has(item)) {
            throw new BadRequestException(`«${field.label}»: необходимо согласиться со всеми пунктами`);
          }
        }
        break;
      }

      case FormFieldType.FILE_UPLOAD:
      case FormFieldType.IMAGE_GALLERY:
        this.assertFiles(field, value.fileUrls);
        break;

      case FormFieldType.PLAYER_SELECTOR:
      case FormFieldType.FRIENDS_SELECTOR: {
        const picked = this.extractJsonArray(value);
        if (!picked.length) {
          throw new BadRequestException(`«${field.label}»: выберите хотя бы одного игрока`);
        }
        break;
      }

      case FormFieldType.SERVER_SELECTOR:
      case FormFieldType.PRODUCT_SELECTOR:
      case FormFieldType.ORDER_SELECTOR:
      case FormFieldType.REPORT_REFERENCE:
      case FormFieldType.NEWS_REFERENCE:
      case FormFieldType.TOPIC_REFERENCE:
      case FormFieldType.PUNISHMENT_REFERENCE:
      case FormFieldType.ACHIEVEMENT_SELECTOR:
        if (!value.textValue && !value.jsonValue) {
          throw new BadRequestException(`«${field.label}»: обязательно для заполнения`);
        }
        break;

      case FormFieldType.SCHEDULE_PICKER:
        if (!isPlainObject(value.jsonValue)) {
          throw new BadRequestException(`«${field.label}»: укажите расписание`);
        }
        break;

      case FormFieldType.STATS_DISPLAY:
        // Display-only: nothing to validate
        break;

      default:
        break;
    }
  }

  private isAnswerEmpty(answer: AnswerDto | undefined): boolean {
    if (!answer) return true;

    const { textValue, numberValue, booleanValue, dateValue, jsonValue, fileUrls } = answer;

    if (textValue != null && String(textValue).trim().length > 0) return false;
    if (numberValue != null && !Number.isNaN(Number(numberValue))) return false;
    if (booleanValue === true || booleanValue === false) return false;
    if (dateValue != null && String(dateValue).trim().length > 0) return false;
    if (fileUrls?.length) return false;

    if (Array.isArray(jsonValue) && jsonValue.length > 0) return false;
    if (isPlainObject(jsonValue) && Object.keys(jsonValue).length > 0) return false;
    if (typeof jsonValue === 'string' && jsonValue.trim().length > 0) return false;
    if (typeof jsonValue === 'number' && !Number.isNaN(jsonValue)) return false;

    return true;
  }

  private assertText(field: FormField, value: string | null | undefined): void {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new BadRequestException(`«${field.label}»: заполните поле`);
    }
  }

  private assertTextLength(field: FormField, value: string | null | undefined): void {
    this.assertText(field, value);
    const trimmed = String(value).trim();
    if (field.minLength && trimmed.length < field.minLength) {
      throw new BadRequestException(
        `«${field.label}»: минимальная длина — ${field.minLength} символов`,
      );
    }
    if (field.maxLength && trimmed.length > field.maxLength) {
      throw new BadRequestException(
        `«${field.label}»: максимальная длина — ${field.maxLength} символов`,
      );
    }
  }

  private assertNumber(field: FormField, value: number | null | undefined): void {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      throw new BadRequestException(`«${field.label}»: введите число`);
    }
    const num = Number(value);
    if (field.minValue != null && num < field.minValue) {
      throw new BadRequestException(`«${field.label}»: минимум — ${field.minValue}`);
    }
    if (field.maxValue != null && num > field.maxValue) {
      throw new BadRequestException(`«${field.label}»: максимум — ${field.maxValue}`);
    }
  }

  private assertFiles(field: FormField, files: string[] | undefined): void {
    if (!files?.length) {
      throw new BadRequestException(`«${field.label}»: прикрепите хотя бы один файл`);
    }
    if (field.maxFiles && files.length > field.maxFiles) {
      throw new BadRequestException(
        `«${field.label}»: не более ${field.maxFiles} файлов`,
      );
    }
  }

  private extractJsonArray(answer: AnswerDto): string[] {
    if (Array.isArray(answer.jsonValue)) {
      return answer.jsonValue.filter((v): v is string => typeof v === 'string');
    }
    if (typeof answer.textValue === 'string' && answer.textValue.trim().length > 0) {
      return [answer.textValue];
    }
    return [];
  }

  private normalizeRules(source: unknown): ConditionalRule[] {
    if (!source) return [];
    const raw = Array.isArray(source) ? source : [source];
    return raw.filter((entry): entry is ConditionalRule => this.isConditionalRule(entry));
  }

  private isConditionalRule(value: unknown): value is ConditionalRule {
    return (
      isPlainObject(value) &&
      typeof value.fieldId === 'string' &&
      typeof value.operator === 'string' &&
      ['eq', 'neq', 'in', 'contains'].includes(value.operator)
    );
  }

  private matchesRule(rule: ConditionalRule, answers: AnswersMap): boolean {
    const answer = answers.get(rule.fieldId);
    const actual = this.readAnswerValue(answer);

    switch (rule.operator) {
      case 'eq':
        return this.softEqual(actual, rule.value);
      case 'neq':
        return !this.softEqual(actual, rule.value);
      case 'in':
        if (Array.isArray(rule.value)) {
          return rule.value.some((entry) => this.softEqual(actual, entry));
        }
        if (Array.isArray(actual)) {
          return actual.some((entry) => this.softEqual(entry, rule.value));
        }
        return false;
      case 'contains':
        if (Array.isArray(actual)) {
          return actual.some((entry) => this.softEqual(entry, rule.value));
        }
        if (typeof actual === 'string' && typeof rule.value === 'string') {
          return actual.toLowerCase().includes(rule.value.toLowerCase());
        }
        return false;
      default:
        return false;
    }
  }

  private readAnswerValue(answer: AnswerDto | undefined): unknown {
    if (!answer) return null;
    if (answer.textValue != null) return answer.textValue;
    if (answer.numberValue != null) return answer.numberValue;
    if (answer.booleanValue != null) return answer.booleanValue;
    if (answer.dateValue != null) return answer.dateValue;
    if (answer.fileUrls?.length) return answer.fileUrls;
    if (answer.jsonValue !== undefined) return answer.jsonValue;
    return null;
  }

  private softEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a == null || b == null) return a == b;
    return String(a).toLowerCase() === String(b).toLowerCase();
  }
}
