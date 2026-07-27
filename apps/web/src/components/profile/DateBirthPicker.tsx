'use client';

import { format, getDaysInMonth, parseISO } from 'date-fns';
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

  const date = parseISO(value.slice(0, 10));
  return { day: date.getUTCDate(), month: date.getUTCMonth() + 1, year: date.getUTCFullYear() };
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
    const iso = format(new Date(Date.UTC(nextYear, nextMonth - 1, safeDay)), 'yyyy-MM-dd');
    onChange(iso);
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
