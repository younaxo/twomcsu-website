'use client';

import type { FormFieldDto } from '@twomc/shared';
import { GripVertical, Pencil, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { fieldTypeMeta } from './field-types';
import { FieldRenderer } from './FieldRenderer';

interface Props {
  field: FormFieldDto;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

// Draggable preview card used inside the builder canvas
export function FieldPreview({ field, selected, onSelect, onDelete }: Props) {
  const meta = fieldTypeMeta(field.type);
  const Icon = meta.icon;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative rounded-2xl border border-transparent glass-medium p-4 transition-colors',
        selected && 'border-[#F57C00]',
      )}
      onClick={onSelect}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab rounded-md p-1 text-muted-foreground hover:bg-white/10 active:cursor-grabbing"
            aria-label="Перетащить"
            onClick={(event) => event.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <Icon className="h-3.5 w-3.5" />
          <span>{meta.labelRu}</span>
        </div>
        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={(event) => {
              event.stopPropagation();
              onSelect();
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="pointer-events-none">
        <FieldRenderer
          field={field}
          slug="preview"
          value={undefined}
          onChange={() => {}}
          disabled
        />
      </div>
    </div>
  );
}
