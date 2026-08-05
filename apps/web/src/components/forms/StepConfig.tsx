'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { StepConfigItem } from './types';

interface Props {
  steps: StepConfigItem[];
  onChange: (next: StepConfigItem[]) => void;
}

export function StepConfig({ steps, onChange }: Props) {
  const update = (index: number, patch: Partial<StepConfigItem>) => {
    const next = [...steps];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">#{index + 1}</span>
          <Input
            value={step.title ?? ''}
            placeholder={`Шаг ${index + 1}`}
            onChange={(event) => update(index, { title: event.target.value })}
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => onChange(steps.filter((_, i) => i !== index))}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={() => onChange([...steps, { title: `Шаг ${steps.length + 1}` }])}
      >
        <Plus className="mr-1 h-4 w-4" /> Добавить шаг
      </Button>
    </div>
  );
}
