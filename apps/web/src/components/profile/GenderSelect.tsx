'use client';

import { Gender } from '@twomc/shared';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { genderLabels } from '@/lib/profile';

interface GenderSelectProps {
  value: Gender | null;
  onChange: (value: Gender | null) => void;
}

export function GenderSelect({ value, onChange }: GenderSelectProps) {
  return (
    <Select
      value={value ?? '__none__'}
      onValueChange={(next) => onChange(next === '__none__' ? null : (next as Gender))}
    >
      <SelectTrigger>
        <SelectValue placeholder="Пол" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">Не указано</SelectItem>
        {(Object.keys(genderLabels) as Gender[]).map((key) => (
          <SelectItem key={key} value={key}>
            {genderLabels[key]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
