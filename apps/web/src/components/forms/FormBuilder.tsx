'use client';

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { FormStatus, type FormDetail, type FormFieldDto, type FormFieldType } from '@twomc/shared';
import { Eye, Settings2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { v4 as uuid } from 'uuid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { extractErrorMessage } from '@/lib/api';
import {
  useCreateForm,
  usePublishForm,
  useUpdateForm,
  type FormPayload,
} from '@/hooks/forms';
import { FieldPalette } from './FieldPalette';
import { FieldPreview } from './FieldPreview';
import { FieldSettings } from './FieldSettings';
import { FormSettingsDialog } from './FormSettingsDialog';
import { fieldTypeMeta } from './field-types';

interface Props {
  initial?: FormDetail;
}

// Local draft: fields must retain stable ids for DnD + settings
function makeInitialDraft(initial?: FormDetail): Partial<FormDetail> {
  return initial
    ? {
        ...initial,
        fields: initial.fields.map((field) => ({ ...field })),
      }
    : {
        title: '',
        slug: '',
        description: '',
        visibility: 'PUBLIC' as FormDetail['visibility'],
        onePerUser: false,
        isAnonymous: false,
        showResults: false,
        requiresAuth: false,
        requiresCaptcha: false,
        multiStep: false,
        fields: [],
      };
}

function makeNewField(type: FormFieldType, order: number): FormFieldDto {
  const meta = fieldTypeMeta(type);
  return {
    id: uuid(),
    type,
    label: meta.labelRu,
    description: null,
    placeholder: null,
    isRequired: false,
    order,
    stepIndex: null,
    options: null,
    validation: null,
    conditionalLogic: null,
    defaultValue: null,
    minValue: null,
    maxValue: null,
    minLength: null,
    maxLength: null,
    maxFiles: null,
    maxFileSize: null,
    allowedMimes: [],
    metadata: null,
  };
}

function toPayload(draft: Partial<FormDetail>): FormPayload {
  return {
    title: draft.title ?? '',
    slug: draft.slug || undefined,
    description: draft.description ?? null,
    coverImage: draft.coverImage ?? null,
    visibility: draft.visibility ?? 'PUBLIC',
    onePerUser: draft.onePerUser ?? false,
    isAnonymous: draft.isAnonymous ?? false,
    showResults: draft.showResults ?? false,
    requiresAuth: draft.requiresAuth ?? false,
    requiresCaptcha: draft.requiresCaptcha ?? false,
    opensAt: draft.opensAt ?? null,
    closesAt: draft.closesAt ?? null,
    timeLimit: draft.timeLimit ?? null,
    maxResponses: draft.maxResponses ?? null,
    multiStep: draft.multiStep ?? false,
    stepsConfig: draft.stepsConfig ?? null,
    thankYouMessage: draft.thankYouMessage ?? null,
    redirectUrl: draft.redirectUrl ?? null,
    customCss: draft.customCss ?? null,
    fields: (draft.fields ?? []).map((field, index) => ({ ...field, order: index })),
  };
}

export function FormBuilder({ initial }: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState<Partial<FormDetail>>(() => makeInitialDraft(initial));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const create = useCreateForm();
  const update = useUpdateForm(initial?.id ?? '');
  const publish = usePublishForm();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const fields = draft.fields ?? [];
  const selected = useMemo(
    () => fields.find((field) => field.id === selectedId) ?? null,
    [fields, selectedId],
  );

  const addField = (type: FormFieldType) => {
    const field = makeNewField(type, fields.length);
    setDraft((prev) => ({ ...prev, fields: [...(prev.fields ?? []), field] }));
    setSelectedId(field.id);
  };

  const patchField = (id: string, patch: Partial<FormFieldDto>) => {
    setDraft((prev) => ({
      ...prev,
      fields: (prev.fields ?? []).map((field) =>
        field.id === id ? { ...field, ...patch } : field,
      ),
    }));
  };

  const deleteField = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      fields: (prev.fields ?? []).filter((field) => field.id !== id),
    }));
    if (selectedId === id) setSelectedId(null);
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setDraft((prev) => {
      const list = prev.fields ?? [];
      const oldIndex = list.findIndex((field) => field.id === active.id);
      const newIndex = list.findIndex((field) => field.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return { ...prev, fields: arrayMove(list, oldIndex, newIndex) };
    });
  };

  const persist = async (thenPublish = false): Promise<string | null> => {
    if (!draft.title?.trim()) {
      toast.error('Введите название формы');
      return null;
    }
    try {
      const payload = toPayload(draft);
      let saved;
      if (initial?.id) {
        saved = await update.mutateAsync(payload);
      } else {
        saved = await create.mutateAsync(payload);
      }
      toast.success('Сохранено');
      if (thenPublish) {
        const published = await publish.mutateAsync(saved.id);
        toast.success('Опубликовано');
        return published.id;
      }
      if (!initial?.id) {
        router.replace(`/admin/forms/${saved.id}/edit`);
      }
      return saved.id;
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось сохранить'));
      return null;
    }
  };

  const preview = () => {
    if (draft.slug) {
      window.open(`/forms/${draft.slug}`, '_blank');
    } else {
      toast.error('Сохраните форму, чтобы открыть предпросмотр');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl glass-strong p-4">
        <Input
          value={draft.title ?? ''}
          onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
          placeholder="Название формы"
          className="max-w-md text-lg font-semibold"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" onClick={preview}>
            <Eye className="mr-1 h-4 w-4" /> Предпросмотр
          </Button>
          <Button variant="secondary" onClick={() => setSettingsOpen(true)}>
            <Settings2 className="mr-1 h-4 w-4" /> Настройки
          </Button>
          <Button variant="secondary" onClick={() => void persist(false)}>
            Сохранить
          </Button>
          {initial?.status !== FormStatus.PUBLISHED ? (
            <Button onClick={() => void persist(true)}>Опубликовать</Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr_320px]">
        <div className="space-y-3 rounded-2xl glass-medium p-4">
          <h3 className="text-sm font-semibold text-white">Поля</h3>
          <FieldPalette onAdd={addField} />
        </div>

        <div className="space-y-3">
          {fields.length === 0 ? (
            <div className="rounded-2xl glass-medium p-8 text-center text-sm text-muted-foreground">
              Пока нет полей. Добавьте поле из палитры слева.
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext
                items={fields.map((field) => field.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {fields.map((field) => (
                    <FieldPreview
                      key={field.id}
                      field={field}
                      selected={field.id === selectedId}
                      onSelect={() => setSelectedId(field.id)}
                      onDelete={() => deleteField(field.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        <div className="rounded-2xl glass-medium p-4">
          <h3 className="mb-3 text-sm font-semibold text-white">Свойства</h3>
          {selected ? (
            <FieldSettings
              field={selected}
              otherFields={fields}
              onChange={(patch) => patchField(selected.id, patch)}
              onDelete={() => deleteField(selected.id)}
            />
          ) : (
            <p className="text-xs text-muted-foreground">Выберите поле для редактирования</p>
          )}
        </div>
      </div>

      <FormSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        form={draft}
        onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
      />
    </div>
  );
}
