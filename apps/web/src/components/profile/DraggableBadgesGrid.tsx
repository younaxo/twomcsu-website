'use client';

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { UserBadge } from '@twomc/shared';
import { GripVertical } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { UserBadgeIcon } from '@/components/shared/UserBadgeIcon';
import { api, extractErrorMessage } from '@/lib/api';
import { userBadgeLabels } from '@/lib/profile';
import { cn } from '@/lib/utils';

interface DraggableBadgesGridProps {
  badges: UserBadge[];
  onReorder?: (badges: UserBadge[]) => void;
}

function SortableBadge({ badge }: { badge: UserBadge }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: badge.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        'glass-light glass-hover-orange flex cursor-grab items-center gap-2 rounded-xl border border-white/5 px-3 py-2 active:cursor-grabbing',
        isDragging && 'z-10 opacity-80 shadow-lg',
      )}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
      <UserBadgeIcon type={badge.type} size={24} />
      <span className="truncate text-sm">{userBadgeLabels[badge.type]}</span>
    </div>
  );
}

export function DraggableBadgesGrid({ badges, onReorder }: DraggableBadgesGridProps) {
  const [items, setItems] = useState(badges);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setItems(badges);
  }, [badges]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const previous = items;
    const next = arrayMove(items, oldIndex, newIndex).map((item, order) => ({ ...item, order }));
    setItems(next);
    onReorder?.(next);

    setSaving(true);
    try {
      await api.patch('/users/me/badges/order', {
        orders: next.map((item, order) => ({ badgeId: item.id, order })),
      });
    } catch (error) {
      setItems(previous);
      onReorder?.(previous);
      toast.error(extractErrorMessage(error, 'Не удалось сохранить порядок бейджей'));
    } finally {
      setSaving(false);
    }
  };

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">У вас пока нет бейджей</p>;
  }

  return (
    <div className="space-y-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((item) => item.id)} strategy={rectSortingStrategy}>
          <div className="grid gap-2 sm:grid-cols-2">
            {items.map((badge) => (
              <SortableBadge key={badge.id} badge={badge} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {saving ? <p className="text-xs text-muted-foreground">Сохранение…</p> : null}
    </div>
  );
}
