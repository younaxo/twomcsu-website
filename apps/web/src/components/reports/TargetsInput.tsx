'use client';

import type { UserSearchHint, UserSearchResult } from '@twomc/shared';
import { useState } from 'react';
import { toast } from 'sonner';
import { TargetChip } from '@/components/reports/TargetChip';
import { UserSearchInput } from '@/components/shared/UserSearchInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';

export type TargetDraft = {
  username: string;
  user?: UserSearchResult | null;
};

const MAX_TARGETS = 10;

function normalizeUsername(value: string): string {
  return value.trim();
}

function isValidUsername(username: string): boolean {
  return username.length >= 2 && username.length <= 16;
}

export function TargetsInput({
  value,
  onChange,
  label,
  className,
}: {
  value: TargetDraft[];
  onChange: (targets: TargetDraft[]) => void;
  label?: string;
  className?: string;
}) {
  const [showInput, setShowInput] = useState(value.length === 0);
  const [manualMode, setManualMode] = useState(false);
  const [manualUsername, setManualUsername] = useState('');
  const [adding, setAdding] = useState(false);

  const usernames = new Set(value.map((item) => item.username.toLowerCase()));

  const addTarget = (draft: TargetDraft) => {
    const username = normalizeUsername(draft.username);
    if (!isValidUsername(username)) {
      toast.error('Никнейм должен быть от 2 до 16 символов');
      return;
    }
    if (usernames.has(username.toLowerCase())) {
      toast.error('Этот ник уже добавлен');
      return;
    }
    onChange([...value, { ...draft, username }]);
    setManualUsername('');
    setManualMode(false);
    setShowInput(false);
  };

  const handleSelect = (user: UserSearchResult) => {
    addTarget({ username: user.username, user });
  };

  const handleManualAdd = async () => {
    const username = normalizeUsername(manualUsername);
    if (!isValidUsername(username)) {
      toast.error('Никнейм должен быть от 2 до 16 символов');
      return;
    }
    if (usernames.has(username.toLowerCase())) {
      toast.error('Этот ник уже добавлен');
      return;
    }

    setAdding(true);
    try {
      const { data: hint } = await api.get<UserSearchHint>(
        `/users/${encodeURIComponent(username)}/search-hint`,
        { skipAuthRedirect: true },
      );

      if (hint.exists) {
        const { data: searchResults } = await api.get<UserSearchResult[]>('/users/search', {
          params: { q: username, limit: 10 },
        });
        const match = searchResults.find(
          (item) => item.username.toLowerCase() === username.toLowerCase(),
        );
        addTarget({ username: hint.username, user: match ?? null });
      } else {
        addTarget({ username, user: null });
      }
    } catch {
      addTarget({ username, user: null });
    } finally {
      setAdding(false);
    }
  };

  const removeAt = (index: number) => {
    const next = value.filter((_, i) => i !== index);
    onChange(next);
    if (next.length === 0) {
      setShowInput(true);
    }
  };

  const canAddMore = value.length < MAX_TARGETS;

  return (
    <div className={className}>
      {label ? <Label className="mb-2 block">{label}</Label> : null}

      {value.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {value.map((target, index) => (
            <TargetChip
              key={`${target.username}-${index}`}
              username={target.username}
              user={target.user}
              onRemove={() => removeAt(index)}
            />
          ))}
        </div>
      ) : null}

      {showInput && canAddMore ? (
        <div className="space-y-2">
          {!manualMode ? (
            <>
              <UserSearchInput
                onSelect={handleSelect}
                placeholder="Начните вводить никнейм"
              />
              <button
                type="button"
                className="text-xs text-[#F57C00] hover:underline"
                onClick={() => setManualMode(true)}
              >
                или введите ник вручную
              </button>
            </>
          ) : (
            <div className="flex gap-2">
              <Input
                value={manualUsername}
                onChange={(event) => setManualUsername(event.target.value)}
                placeholder="Никнейм игрока"
                maxLength={16}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void handleManualAdd();
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                disabled={adding}
                onClick={() => void handleManualAdd()}
              >
                Добавить
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setManualMode(false);
                  if (value.length > 0) setShowInput(false);
                }}
              >
                Отмена
              </Button>
            </div>
          )}
        </div>
      ) : null}

      {canAddMore && !showInput ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            setManualMode(false);
            setShowInput(true);
          }}
        >
          + Добавить никнейм
        </Button>
      ) : null}

      <p className="mt-1 text-xs text-muted-foreground">
        {value.length} / {MAX_TARGETS}
      </p>
    </div>
  );
}
