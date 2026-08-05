'use client';

import { FormVisibility, type FormDetail } from '@twomc/shared';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { StepConfig } from './StepConfig';
import type { StepConfigItem } from './types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: Partial<FormDetail>;
  onChange: (patch: Partial<FormDetail>) => void;
}

const VISIBILITY_LABELS: Record<FormVisibility, string> = {
  [FormVisibility.PUBLIC]: 'Публично',
  [FormVisibility.AUTHENTICATED]: 'Авторизованные',
  [FormVisibility.HELPER_ONLY]: 'Helper+',
  [FormVisibility.MODERATOR_ONLY]: 'Moderator+',
  [FormVisibility.ADMIN_ONLY]: 'Admin+',
  [FormVisibility.OWNER_ONLY]: 'Только владелец',
  [FormVisibility.INVITE_ONLY]: 'По приглашению',
};

function extractSteps(source: unknown): StepConfigItem[] {
  if (!Array.isArray(source)) return [];
  return source.map((entry, index) => {
    if (entry && typeof entry === 'object') {
      const raw = entry as Record<string, unknown>;
      return {
        title: typeof raw.title === 'string' ? raw.title : `Шаг ${index + 1}`,
        description:
          typeof raw.description === 'string' ? raw.description : undefined,
      };
    }
    return { title: `Шаг ${index + 1}` };
  });
}

export function FormSettingsDialog({ open, onOpenChange, form, onChange }: Props) {
  const steps = extractSteps(form.stepsConfig);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Настройки формы</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">Slug</label>
            <Input
              value={form.slug ?? ''}
              onChange={(event) => onChange({ slug: event.target.value })}
              placeholder="my-form"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Описание</label>
            <Textarea
              value={form.description ?? ''}
              rows={3}
              onChange={(event) => onChange({ description: event.target.value || null })}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Обложка (URL)</label>
            <Input
              value={form.coverImage ?? ''}
              onChange={(event) => onChange({ coverImage: event.target.value || null })}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Видимость</label>
            <select
              className="mt-1 w-full rounded-md border border-input bg-secondary/40 px-3 py-2 text-sm"
              value={form.visibility ?? FormVisibility.PUBLIC}
              onChange={(event) =>
                onChange({ visibility: event.target.value as FormVisibility })
              }
            >
              {(Object.keys(VISIBILITY_LABELS) as FormVisibility[]).map((value) => (
                <option key={value} value={value}>
                  {VISIBILITY_LABELS[value]}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Открытие</label>
              <Input
                type="datetime-local"
                value={form.opensAt ? form.opensAt.slice(0, 16) : ''}
                onChange={(event) =>
                  onChange({
                    opensAt: event.target.value ? new Date(event.target.value).toISOString() : null,
                  })
                }
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Закрытие</label>
              <Input
                type="datetime-local"
                value={form.closesAt ? form.closesAt.slice(0, 16) : ''}
                onChange={(event) =>
                  onChange({
                    closesAt: event.target.value ? new Date(event.target.value).toISOString() : null,
                  })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Лимит времени (сек)</label>
              <Input
                type="number"
                value={form.timeLimit ?? ''}
                onChange={(event) =>
                  onChange({
                    timeLimit: event.target.value === '' ? null : Number(event.target.value),
                  })
                }
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Макс ответов</label>
              <Input
                type="number"
                value={form.maxResponses ?? ''}
                onChange={(event) =>
                  onChange({
                    maxResponses:
                      event.target.value === '' ? null : Number(event.target.value),
                  })
                }
              />
            </div>
          </div>

          <div className="grid gap-2">
            <label className="flex items-center justify-between text-sm">
              Один ответ на пользователя
              <Switch
                checked={form.onePerUser ?? false}
                onCheckedChange={(next) => onChange({ onePerUser: next })}
              />
            </label>
            <label className="flex items-center justify-between text-sm">
              Анонимно
              <Switch
                checked={form.isAnonymous ?? false}
                onCheckedChange={(next) => onChange({ isAnonymous: next })}
              />
            </label>
            <label className="flex items-center justify-between text-sm">
              Показывать результаты пользователю
              <Switch
                checked={form.showResults ?? false}
                onCheckedChange={(next) => onChange({ showResults: next })}
              />
            </label>
            <label className="flex items-center justify-between text-sm">
              Требуется авторизация
              <Switch
                checked={form.requiresAuth ?? false}
                onCheckedChange={(next) => onChange({ requiresAuth: next })}
              />
            </label>
            <label className="flex items-center justify-between text-sm">
              Требовать капчу
              <Switch
                checked={form.requiresCaptcha ?? false}
                onCheckedChange={(next) => onChange({ requiresCaptcha: next })}
              />
            </label>
            <label className="flex items-center justify-between text-sm">
              Многошаговая форма
              <Switch
                checked={form.multiStep ?? false}
                onCheckedChange={(next) => onChange({ multiStep: next })}
              />
            </label>
          </div>

          {form.multiStep ? (
            <div className="space-y-2 rounded-lg glass-light p-3">
              <p className="text-xs text-muted-foreground">Шаги</p>
              <StepConfig
                steps={steps}
                onChange={(next) => onChange({ stepsConfig: next })}
              />
            </div>
          ) : null}

          <div>
            <label className="text-xs text-muted-foreground">Сообщение после отправки</label>
            <Textarea
              value={form.thankYouMessage ?? ''}
              rows={3}
              onChange={(event) => onChange({ thankYouMessage: event.target.value || null })}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">URL редиректа после отправки</label>
            <Input
              value={form.redirectUrl ?? ''}
              onChange={(event) => onChange({ redirectUrl: event.target.value || null })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Готово</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
