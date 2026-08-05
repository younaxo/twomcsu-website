'use client';

import { useEffect, useMemo, useState } from 'react';
import { Command, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface QuickAction {
  id: string;
  label: string;
  keywords?: string[];
  group?: string;
  shortcut?: string;
  onSelect: () => void;
  disabled?: boolean;
}

interface QuickActionsMenuProps {
  actions: QuickAction[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  placeholder?: string;
  title?: string;
}

export function QuickActionsMenu({
  actions,
  open: controlledOpen,
  onOpenChange,
  placeholder = 'Поиск действий…',
  title = 'Быстрые действия',
}: QuickActionsMenuProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery] = useState('');

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setOpen]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions.filter((a) => !a.disabled);

    return actions.filter((action) => {
      if (action.disabled) return false;
      const haystack = [action.label, action.group, ...(action.keywords ?? [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [actions, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, QuickAction[]>();
    for (const action of filtered) {
      const group = action.group ?? 'Действия';
      const list = map.get(group) ?? [];
      list.push(action);
      map.set(group, list);
    }
    return [...map.entries()];
  }, [filtered]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-white/5 px-4 py-3">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Command className="h-4 w-4 text-[#F57C00]" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="border-b border-white/5 px-4 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="pl-8"
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Нажмите <kbd className="rounded border border-white/10 px-1">Ctrl</kbd>+
            <kbd className="rounded border border-white/10 px-1">K</kbd> для быстрого доступа
          </p>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {grouped.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              Ничего не найдено
            </p>
          ) : (
            grouped.map(([group, items]) => (
              <div key={group} className="mb-2 last:mb-0">
                <p className="px-2 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {group}
                </p>
                <ul>
                  {items.map((action) => (
                    <li key={action.id}>
                      <button
                        type="button"
                        className={cn(
                          'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/10',
                          action.disabled && 'cursor-not-allowed opacity-50',
                        )}
                        disabled={action.disabled}
                        onClick={() => {
                          action.onSelect();
                          setOpen(false);
                        }}
                      >
                        <span className="text-white">{action.label}</span>
                        {action.shortcut ? (
                          <span className="text-xs text-muted-foreground">{action.shortcut}</span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
