'use client';

import { getDaysInMonth } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DateBirthPickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

const months = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 80 }, (_, index) => currentYear - 10 - index);

function partsFromValue(value: string | null) {
  if (!value) {
    return { day: 0, month: 0, year: 0 };
  }

  const match = value.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return { day: 0, month: 0, year: 0 };
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function toDateOnly(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function DateBirthPicker({ value, onChange }: DateBirthPickerProps) {
  const { day, month, year } = partsFromValue(value);
  const daysInMonth = month && year ? getDaysInMonth(new Date(year, month - 1)) : 31;

  const emit = (nextDay: number, nextMonth: number, nextYear: number) => {
    if (!nextDay || !nextMonth || !nextYear) {
      onChange(null);
      return;
    }

    const safeDay = Math.min(nextDay, getDaysInMonth(new Date(nextYear, nextMonth - 1)));
    onChange(toDateOnly(nextYear, nextMonth, safeDay));
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      <Select
        value={day ? String(day) : '__none__'}
        onValueChange={(next) => emit(Number(next === '__none__' ? 0 : next), month, year)}
      >
        <SelectTrigger>
          <SelectValue placeholder="День" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">—</SelectItem>
          {Array.from({ length: daysInMonth }, (_, index) => index + 1).map((item) => (
            <SelectItem key={item} value={String(item)}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={month ? String(month) : '__none__'}
        onValueChange={(next) => emit(day, Number(next === '__none__' ? 0 : next), year)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Месяц" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">—</SelectItem>
          {months.map((label, index) => (
            <SelectItem key={label} value={String(index + 1)}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={year ? String(year) : '__none__'}
        onValueChange={(next) => emit(day, month, Number(next === '__none__' ? 0 : next))}
      >
        <SelectTrigger>
          <SelectValue placeholder="Год" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">—</SelectItem>
          {years.map((item) => (
            <SelectItem key={item} value={String(item)}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
