'use client';

import type { FormFieldDto } from '@twomc/shared';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ConditionalLogic, ConditionalRule } from './types';

interface Props {
  currentField: FormFieldDto;
  otherFields: FormFieldDto[];
  value: unknown;
  onChange: (next: ConditionalLogic | null) => void;
}

const OPERATOR_LABELS: Record<ConditionalRule['operator'], string> = {
  eq: 'равно',
  neq: 'не равно',
  in: 'входит в',
  contains: 'содержит',
};

function toRules(source: unknown): ConditionalRule[] {
  if (!source) return [];
  const raw = Array.isArray(source) ? source : [source];
  return raw.filter(
    (entry): entry is ConditionalRule =>
      Boolean(entry) &&
      typeof entry === 'object' &&
      typeof (entry as ConditionalRule).fieldId === 'string' &&
      typeof (entry as ConditionalRule).operator === 'string',
  );
}

function currentLogic(value: unknown): ConditionalLogic {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as ConditionalLogic;
  }
  return {};
}

export function ConditionalLogicBuilder({ currentField, otherFields, value, onChange }: Props) {
  const logic = currentLogic(value);
  const showIfRules = toRules(logic.showIf);
  const hideIfRules = toRules(logic.hideIf);

  const eligible = otherFields.filter((field) => field.id !== currentField.id);

  const commit = (key: 'showIf' | 'hideIf', rules: ConditionalRule[]) => {
    const next: ConditionalLogic = { ...logic, [key]: rules.length ? rules : undefined };
    if (!next.showIf && !next.hideIf) {
      onChange(null);
      return;
    }
    onChange(next);
  };

  const renderRuleList = (
    key: 'showIf' | 'hideIf',
    rules: ConditionalRule[],
    title: string,
  ) => (
    <div className="space-y-2 rounded-lg glass-light p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-white">{title}</span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() =>
            commit(key, [
              ...rules,
              { fieldId: eligible[0]?.id ?? '', operator: 'eq', value: '' },
            ])
          }
          disabled={!eligible.length}
        >
          <Plus className="h-3.5 w-3.5" /> Добавить
        </Button>
      </div>
      {rules.length === 0 ? (
        <p className="text-xs text-muted-foreground">Нет правил</p>
      ) : null}
      {rules.map((rule, index) => (
        <div key={index} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2">
          <select
            className="rounded-md border border-input bg-secondary/40 px-2 py-1 text-xs"
            value={rule.fieldId}
            onChange={(event) => {
              const next = [...rules];
              next[index] = { ...rule, fieldId: event.target.value };
              commit(key, next);
            }}
          >
            {eligible.map((field) => (
              <option key={field.id} value={field.id}>
                {field.label}
              </option>
            ))}
          </select>
          <select
            className="rounded-md border border-input bg-secondary/40 px-2 py-1 text-xs"
            value={rule.operator}
            onChange={(event) => {
              const next = [...rules];
              next[index] = {
                ...rule,
                operator: event.target.value as ConditionalRule['operator'],
              };
              commit(key, next);
            }}
          >
            {(Object.keys(OPERATOR_LABELS) as ConditionalRule['operator'][]).map((op) => (
              <option key={op} value={op}>
                {OPERATOR_LABELS[op]}
              </option>
            ))}
          </select>
          <Input
            value={typeof rule.value === 'string' ? rule.value : String(rule.value ?? '')}
            onChange={(event) => {
              const next = [...rules];
              next[index] = { ...rule, value: event.target.value };
              commit(key, next);
            }}
            placeholder="значение"
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => commit(key, rules.filter((_, i) => i !== index))}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-3">
      {renderRuleList('showIf', showIfRules, 'Показывать если')}
      {renderRuleList('hideIf', hideIfRules, 'Скрывать если')}
    </div>
  );
}
