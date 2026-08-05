'use client';

import type { FormFieldDto } from '@twomc/shared';
import { cn } from '@/lib/utils';

interface StepInfo {
  index: number;
  title?: string;
}

interface Props {
  steps: StepInfo[];
  currentStep: number;
  onStepChange: (step: number) => void;
  fields?: FormFieldDto[];
}

// Simple step indicator; renderer controls which fields to show per step
export function MultiStepForm({ steps, currentStep, onStepChange }: Props) {
  if (steps.length <= 1) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {steps.map((step) => (
        <button
          key={step.index}
          type="button"
          onClick={() => onStepChange(step.index)}
          className={cn(
            'flex items-center gap-2 rounded-full px-3 py-1 text-xs transition-colors',
            step.index === currentStep
              ? 'bg-[#F57C00] text-white'
              : step.index < currentStep
                ? 'bg-white/10 text-white'
                : 'bg-white/[0.03] text-muted-foreground',
          )}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/30 text-[10px]">
            {step.index + 1}
          </span>
          {step.title ?? `Шаг ${step.index + 1}`}
        </button>
      ))}
    </div>
  );
}
