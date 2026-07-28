'use client';

import type { UserSearchResult } from '@twomc/shared';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { AvatarWithSkin } from '@/components/shared/AvatarWithSkin';
import { PositionBadge } from '@/components/shared/PositionBadge';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/profile';
import { cn } from '@/lib/utils';

const DEBOUNCE_MS = 300;

interface UserSearchInputProps {
  onSelect: (user: UserSearchResult) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minLength?: number;
  autoFocus?: boolean;
  id?: string;
}

export function UserSearchInput({
  onSelect,
  placeholder = 'Никнейм, email, #123 или tag',
  disabled = false,
  className,
  minLength = 1,
  autoFocus = false,
  id,
}: UserSearchInputProps) {
  const listboxId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const [query, setQuery] = useState('');
  const [debounced] = useDebounce(query.trim(), DEBOUNCE_MS);
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    if (debounced.length < minLength) {
      setResults([]);
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void api
      .get<UserSearchResult[]>('/users/search', { params: { q: debounced, limit: 10 } })
      .then(({ data }) => {
        if (cancelled) {
          return;
        }

        setResults(data);
        setOpen(data.length > 0);
        setActiveIndex(-1);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setResults([]);
        setOpen(false);
        setActiveIndex(-1);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debounced, minLength]);

  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) {
      return;
    }

    const item = listRef.current.children[activeIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const select = useCallback(
    (user: UserSearchResult) => {
      onSelect(user);
      setQuery('');
      setResults([]);
      setOpen(false);
      setActiveIndex(-1);
    },
    [onSelect],
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }

    if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      select(results[activeIndex]);
      return;
    }

    if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <Input
        id={id}
        value={query}
        disabled={disabled}
        autoFocus={autoFocus}
        autoComplete="off"
        placeholder={placeholder}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={
          activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
        }
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (results.length > 0) {
            setOpen(true);
          }
        }}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={handleKeyDown}
      />

      {loading && debounced.length >= minLength ? (
        <p className="mt-1 text-xs text-muted-foreground">Поиск…</p>
      ) : null}

      {open && results.length > 0 ? (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md glass-heavy text-popover-foreground shadow-md"
        >
          {results.map((user, index) => (
            <li
              key={user.id}
              id={`${listboxId}-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
            >
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => select(user)}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-secondary',
                  index === activeIndex && 'bg-secondary',
                )}
              >
                <AvatarWithSkin
                  user={{
                    username: user.username,
                    avatar: resolveMediaUrl(user.avatar) ?? null,
                  }}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{user.username}</p>
                  <p className="text-xs text-muted-foreground">#{user.shortId}</p>
                </div>
                <PositionBadge position={user.position} size="sm" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
