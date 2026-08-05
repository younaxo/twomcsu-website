'use client';

import { format, formatDistanceToNow, isYesterday, differenceInDays } from 'date-fns';
import { ru } from 'date-fns/locale';

export function formatActivityTime(iso: string): string {
  const date = new Date(iso);
  const days = differenceInDays(new Date(), date);

  if (days > 30) {
    return format(date, 'd MMMM yyyy', { locale: ru });
  }

  if (isYesterday(date)) {
    return `Вчера в ${format(date, 'HH:mm', { locale: ru })}`;
  }

  return formatDistanceToNow(date, { addSuffix: true, locale: ru });
}
