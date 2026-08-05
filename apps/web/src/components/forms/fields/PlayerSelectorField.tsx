'use client';

import type { FormFieldDto, UserSearchResult } from '@twomc/shared';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserSearchInput } from '@/components/shared/UserSearchInput';
import { FieldShell } from './field-shell';
import type { FieldValue } from '../types';

interface Props {
  field: FormFieldDto;
  value: FieldValue | undefined;
  onChange: (v: FieldValue) => void;
  disabled?: boolean;
}

// Stores selected usernames as jsonValue: string[]
export function PlayerSelectorField({ field, value, onChange, disabled }: Props) {
  const selected = Array.isArray(value?.jsonValue)
    ? (value!.jsonValue as unknown[]).filter((v): v is string => typeof v === 'string')
    : [];

  const add = (user: UserSearchResult) => {
    if (selected.includes(user.username)) return;
    onChange({ fieldId: field.id, jsonValue: [...selected, user.username] });
  };

  const remove = (username: string) => {
    onChange({ fieldId: field.id, jsonValue: selected.filter((v) => v !== username) });
  };

  return (
    <FieldShell field={field}>
      <div className="space-y-2">
        {!disabled ? <UserSearchInput onSelect={add} placeholder="Найти игрока..." /> : null}
        {selected.length ? (
          <ul className="flex flex-wrap gap-1.5">
            {selected.map((username) => (
              <li
                key={username}
                className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] py-0.5 pl-2 pr-1 text-xs"
              >
                <span className="text-white">{username}</span>
                {!disabled ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => remove(username)}
                    className="h-5 w-5"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </FieldShell>
  );
}
