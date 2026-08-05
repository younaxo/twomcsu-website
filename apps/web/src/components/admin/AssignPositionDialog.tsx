'use client';

import { PositionSummary, UserSearchResult } from '@twomc/shared';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ColoredUsername } from '@/components/shared/ColoredUsername';
import { UserSearchInput } from '@/components/shared/UserSearchInput';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api, extractErrorMessage } from '@/lib/api';

interface AssignPositionDialogProps {
  open: boolean;
  positions: PositionSummary[];
  onOpenChange: (open: boolean) => void;
  onAssigned: () => void;
}

export function AssignPositionDialog({
  open,
  positions,
  onOpenChange,
  onAssigned,
}: AssignPositionDialogProps) {
  const [selected, setSelected] = useState<UserSearchResult | null>(null);
  const [positionId, setPositionId] = useState('');
  const [isSaving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelected(null);
      setPositionId('');
    }
  }, [open]);

  const submit = async () => {
    if (!selected || !positionId) {
      return;
    }

    setSaving(true);

    try {
      await api.post(`/positions/${positionId}/assign`, { userId: selected.id });
      toast.success(`${selected.username} получил новый префикс`);
      onOpenChange(false);
      onAssigned();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось назначить префикс'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Назначить префикс</DialogTitle>
          <DialogDescription>
            Группа прав игрока изменится на группу выбранного префикса.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="assign-user">Игрок</Label>

            {selected ? (
              <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <ColoredUsername user={selected} size="sm" linkToProfile={false} showBadge />
                <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
                  Сменить
                </Button>
              </div>
            ) : (
              <UserSearchInput
                id="assign-user"
                placeholder="Начните вводить никнейм"
                onSelect={setSelected}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>Префикс игрока</Label>
            <Select value={positionId} onValueChange={setPositionId}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите префикс" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {positions.map((position) => (
                  <SelectItem key={position.id} value={position.id}>
                    <span style={{ color: position.color }}>{position.displayName}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{position.group}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={submit} disabled={!selected || !positionId || isSaving}>
            Назначить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
