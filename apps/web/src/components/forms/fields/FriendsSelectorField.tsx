'use client';

import type { FormFieldDto } from '@twomc/shared';
import { useFriends } from '@/hooks/useFriendsQueries';
import { Checkbox } from '@/components/ui/checkbox';
import { FieldShell } from './field-shell';
import type { FieldValue } from '../types';

interface Props {
  field: FormFieldDto;
  value: FieldValue | undefined;
  onChange: (v: FieldValue) => void;
  disabled?: boolean;
}

export function FriendsSelectorField({ field, value, onChange, disabled }: Props) {
  const { data } = useFriends(1, 100);
  const friends = data?.data ?? [];
  const selected = Array.isArray(value?.jsonValue)
    ? (value!.jsonValue as unknown[]).filter((v): v is string => typeof v === 'string')
    : [];

  const toggle = (username: string) => {
    const next = selected.includes(username)
      ? selected.filter((v) => v !== username)
      : [...selected, username];
    onChange({ fieldId: field.id, jsonValue: next });
  };

  return (
    <FieldShell field={field}>
      {!friends.length ? (
        <p className="text-xs text-muted-foreground">У вас пока нет друзей</p>
      ) : (
        <div className="grid gap-1 sm:grid-cols-2">
          {friends.map((friend) => {
            const id = `${field.id}-friend-${friend.user.username}`;
            return (
              <label key={friend.id} htmlFor={id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  id={id}
                  checked={selected.includes(friend.user.username)}
                  disabled={disabled}
                  onCheckedChange={() => toggle(friend.user.username)}
                />
                <span className="text-white">{friend.user.username}</span>
              </label>
            );
          })}
        </div>
      )}
    </FieldShell>
  );
}
