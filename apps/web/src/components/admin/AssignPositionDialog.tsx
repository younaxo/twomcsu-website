'use client';

import { PositionSummary, UserSearchResult } from '@twomc/shared';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ColoredUsername } from '@/components/shared/ColoredUsername';
import { PositionBadge } from '@/components/shared/PositionBadge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api, extractErrorMessage } from '@/lib/api';

const SEARCH_DEBOUNCE_MS = 300;

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
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [selected, setSelected] = useState<UserSearchResult | null>(null);
  const [positionId, setPositionId] = useState('');
  const [isSaving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setSelected(null);
      setPositionId('');
    }
  }, [open]);

  useEffect(() => {
    if (!open || selected || query.trim().length < 1) {
      setResults([]);

      return;
    }

    const timer = setTimeout(() => {
      api
        .get<UserSearchResult[]>('/users/search', { params: { q: query.trim() } })
        .then(({ data }) => setResults(data))
        .catch(() => setResults([]));
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [open, query, selected]);

  const submit = async () => {
    if (!selected || !positionId) {
      return;
    }

    setSaving(true);

    try {
      await api.post(`/positions/${positionId}/assign`, { userId: selected.id });
      toast.success(`${selected.username} получил новую позицию`);
      onOpenChange(false);
      onAssigned();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось назначить позицию'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Назначить позицию</DialogTitle>
          <DialogDescription>
            Группа прав игрока изменится на группу выбранной позиции.
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
              <>
                <Input
                  id="assign-user"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Начните вводить никнейм"
                  autoComplete="off"
                />

                {results.length > 0 ? (
                  <ul className="max-h-48 overflow-y-auto rounded-md border border-border">
                    {results.map((user) => (
                      <li key={user.id}>
                        <button
                          type="button"
                          onClick={() => setSelected(user)}
                          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-secondary"
                        >
                          <ColoredUsername user={user} size="sm" linkToProfile={false} />
                          <PositionBadge position={user.position} size="sm" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label>Позиция</Label>
            <Select value={positionId} onValueChange={setPositionId}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите позицию" />
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
