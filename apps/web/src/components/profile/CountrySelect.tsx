'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { popularCountries } from '@/lib/profile';

interface CountrySelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

export function CountrySelect({ value, onChange }: CountrySelectProps) {
  return (
    <Select
      value={value ?? '__none__'}
      onValueChange={(next) => onChange(next === '__none__' ? null : next)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Страна" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">Не указано</SelectItem>
        {popularCountries.map((country) => (
          <SelectItem key={country} value={country}>
            {country}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
