'use client';

import { FormFieldType, type FormFieldDto } from '@twomc/shared';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { extractChoices, fieldTypeMeta } from './field-types';
import { ConditionalLogicBuilder } from './ConditionalLogicBuilder';

interface Props {
  field: FormFieldDto;
  otherFields: FormFieldDto[];
  onChange: (patch: Partial<FormFieldDto>) => void;
  onDelete: () => void;
}

const TYPES_WITH_CHOICES: FormFieldType[] = [
  FormFieldType.RADIO,
  FormFieldType.CHECKBOX,
  FormFieldType.SELECT,
  FormFieldType.AGREEMENT_CHECKLIST,
];

const TYPES_WITH_MIN_MAX_NUMBER: FormFieldType[] = [
  FormFieldType.NUMBER,
  FormFieldType.RATING,
  FormFieldType.CURRENCY_AMOUNT,
];

const TYPES_WITH_MIN_MAX_LENGTH: FormFieldType[] = [
  FormFieldType.TEXT,
  FormFieldType.TEXTAREA,
  FormFieldType.MARKDOWN_EDITOR,
  FormFieldType.CODE_EDITOR,
];

const TYPES_WITH_FILES: FormFieldType[] = [
  FormFieldType.FILE_UPLOAD,
  FormFieldType.IMAGE_GALLERY,
];

export function FieldSettings({ field, otherFields, onChange }: Props) {
  const meta = fieldTypeMeta(field.type);
  const choices = TYPES_WITH_CHOICES.includes(field.type) ? extractChoices(field.options) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <meta.icon className="h-3.5 w-3.5" />
        <span>{meta.labelRu}</span>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Заголовок</label>
        <Input value={field.label} onChange={(event) => onChange({ label: event.target.value })} />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Описание</label>
        <Textarea
          value={field.description ?? ''}
          rows={2}
          onChange={(event) => onChange({ description: event.target.value || null })}
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Placeholder</label>
        <Input
          value={field.placeholder ?? ''}
          onChange={(event) => onChange({ placeholder: event.target.value || null })}
        />
      </div>

      <label className="flex items-center justify-between text-sm">
        Обязательное
        <Switch
          checked={field.isRequired}
          onCheckedChange={(next) => onChange({ isRequired: next })}
        />
      </label>

      {TYPES_WITH_CHOICES.includes(field.type) ? (
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Варианты (по строкам)</label>
          <Textarea
            value={choices.join('\n')}
            rows={6}
            onChange={(event) => {
              const list = event.target.value
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean);
              onChange({ options: { choices: list } });
            }}
          />
        </div>
      ) : null}

      {TYPES_WITH_MIN_MAX_NUMBER.includes(field.type) ? (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">Мин</label>
            <Input
              type="number"
              value={field.minValue ?? ''}
              onChange={(event) =>
                onChange({
                  minValue: event.target.value === '' ? null : Number(event.target.value),
                })
              }
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Макс</label>
            <Input
              type="number"
              value={field.maxValue ?? ''}
              onChange={(event) =>
                onChange({
                  maxValue: event.target.value === '' ? null : Number(event.target.value),
                })
              }
            />
          </div>
        </div>
      ) : null}

      {TYPES_WITH_MIN_MAX_LENGTH.includes(field.type) ? (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">Мин длина</label>
            <Input
              type="number"
              value={field.minLength ?? ''}
              onChange={(event) =>
                onChange({
                  minLength: event.target.value === '' ? null : Number(event.target.value),
                })
              }
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Макс длина</label>
            <Input
              type="number"
              value={field.maxLength ?? ''}
              onChange={(event) =>
                onChange({
                  maxLength: event.target.value === '' ? null : Number(event.target.value),
                })
              }
            />
          </div>
        </div>
      ) : null}

      {TYPES_WITH_FILES.includes(field.type) ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Макс файлов</label>
              <Input
                type="number"
                value={field.maxFiles ?? ''}
                onChange={(event) =>
                  onChange({
                    maxFiles: event.target.value === '' ? null : Number(event.target.value),
                  })
                }
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Макс размер (МБ)</label>
              <Input
                type="number"
                value={field.maxFileSize ? Math.round(field.maxFileSize / 1024 / 1024) : ''}
                onChange={(event) =>
                  onChange({
                    maxFileSize:
                      event.target.value === '' ? null : Number(event.target.value) * 1024 * 1024,
                  })
                }
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Разрешённые mime (через запятую)</label>
            <Input
              value={field.allowedMimes.join(', ')}
              onChange={(event) =>
                onChange({
                  allowedMimes: event.target.value
                    .split(',')
                    .map((entry) => entry.trim())
                    .filter(Boolean),
                })
              }
            />
          </div>
        </>
      ) : null}

      <details className="rounded-lg glass-light p-3">
        <summary className="cursor-pointer text-xs text-muted-foreground">
          Условная логика
        </summary>
        <div className="mt-3">
          <ConditionalLogicBuilder
            currentField={field}
            otherFields={otherFields}
            value={field.conditionalLogic}
            onChange={(next) => onChange({ conditionalLogic: next })}
          />
        </div>
      </details>
    </div>
  );
}
