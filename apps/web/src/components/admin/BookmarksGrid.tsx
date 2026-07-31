'use client';

import Link from 'next/link';
import {
  ArrowDown,
  ArrowUp,
  Bookmark,
  ExternalLink,
  Plus,
  Trash2,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface AdminBookmark {
  id: string;
  url: string;
  title: string;
  icon?: string | null;
  order: number;
}

interface BookmarksGridProps {
  bookmarks: AdminBookmark[];
  onAdd?: () => void;
  onDelete?: (id: string) => void;
  onReorder?: (id: string, direction: 'up' | 'down') => void;
  className?: string;
  emptyMessage?: string;
}

function resolveIcon(name?: string | null): LucideIcons.LucideIcon {
  if (!name) return Bookmark;
  const icons = LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>;
  return icons[name] ?? Bookmark;
}

function isExternal(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export function BookmarksGrid({
  bookmarks,
  onAdd,
  onDelete,
  onReorder,
  className,
  emptyMessage = 'Добавьте быстрые ссылки для панели',
}: BookmarksGridProps) {
  const sorted = [...bookmarks].sort((a, b) => a.order - b.order);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-white">Закладки</h2>
        {onAdd ? (
          <Button type="button" variant="secondary" size="sm" onClick={onAdd}>
            <Plus className="mr-1.5 h-4 w-4" />
            Добавить
          </Button>
        ) : null}
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl glass-medium p-8 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sorted.map((bookmark, index) => {
            const Icon = resolveIcon(bookmark.icon);
            const external = isExternal(bookmark.url);
            const card = (
              <div className="group relative flex h-full flex-col rounded-2xl glass-medium p-4 transition-colors hover:bg-white/10">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                    <Icon className="h-5 w-5 text-[#F57C00]" aria-hidden />
                  </div>
                  <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                    {onReorder && index > 0 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        aria-label="Переместить вверх"
                        onClick={(e) => {
                          e.preventDefault();
                          onReorder(bookmark.id, 'up');
                        }}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                    {onReorder && index < sorted.length - 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        aria-label="Переместить вниз"
                        onClick={(e) => {
                          e.preventDefault();
                          onReorder(bookmark.id, 'down');
                        }}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                    {onDelete ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        aria-label="Удалить закладку"
                        onClick={(e) => {
                          e.preventDefault();
                          onDelete(bookmark.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                  </div>
                </div>
                <p className="font-medium text-white">{bookmark.title}</p>
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                  {bookmark.url}
                </p>
                {external ? (
                  <ExternalLink className="absolute bottom-4 right-4 h-3.5 w-3.5 text-muted-foreground" />
                ) : null}
              </div>
            );

            if (external) {
              return (
                <a
                  key={bookmark.id}
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-full"
                >
                  {card}
                </a>
              );
            }

            return (
              <Link key={bookmark.id} href={bookmark.url} className="block h-full">
                {card}
              </Link>
            );
          })}

          {onAdd ? (
            <button
              type="button"
              onClick={onAdd}
              className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] text-sm text-muted-foreground transition-colors hover:border-white/20 hover:bg-white/5 hover:text-white"
            >
              <Plus className="h-5 w-5" />
              Добавить закладку
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
