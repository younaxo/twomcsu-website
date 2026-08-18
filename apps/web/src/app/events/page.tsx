'use client';

import {
  CalendarEventCategory,
  calendarEventCategoryLabels,
  type CalendarEvent,
} from '@twomc/shared';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { CalendarDays, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useEvents } from '@/hooks/useEvents';
import { cn } from '@/lib/utils';

function EventRow({ event }: { event: CalendarEvent }) {
  return (
    <Link href={`/events/${event.slug}`} className="block">
      <Card className="border border-white/5 transition-colors hover:border-white/15">
        <CardContent className="flex gap-4 p-4">
          <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10 text-primary">
            <span className="text-xl font-semibold">{format(new Date(event.startsAt), 'd')}</span>
            <span className="text-[10px] uppercase">{format(new Date(event.startsAt), 'LLL', { locale: ru })}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base text-white">{event.title}</h3>
              <Badge variant="secondary">{calendarEventCategoryLabels[event.category]}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {event.allDay ? 'Весь день' : format(new Date(event.startsAt), 'HH:mm')}
              {event.location ? <span> · {event.location}</span> : null}
            </p>
            <p className="mt-1 line-clamp-2 text-sm text-neutral-300">{event.description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function EventsPage() {
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [category, setCategory] = useState<CalendarEventCategory | undefined>();
  const from = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const to = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const events = useEvents({ from: from.toISOString(), to: to.toISOString(), category });
  const days = eachDayOfInterval({ start: from, end: to });
  const byDate = useMemo(() => {
    const result = new Map<string, CalendarEvent[]>();
    for (const event of events.data ?? []) {
      const key = format(new Date(event.startsAt), 'yyyy-MM-dd');
      result.set(key, [...(result.get(key) ?? []), event]);
    }
    return result;
  }, [events.data]);

  return (
    <div className="space-y-7">
      <section className="glass-strong overflow-hidden rounded-3xl border border-white/10 p-6 sm:p-8">
        <div className="flex items-center gap-3 text-primary"><CalendarDays className="h-6 w-6" /><span className="text-sm uppercase tracking-[0.2em]">События TWOMC</span></div>
        <h1 className="mt-3 text-3xl text-white sm:text-4xl">Календарь проекта</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">Турниры, обновления, праздники и встречи сообщества — всё важное в одном месте.</p>
      </section>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={!category ? 'default' : 'secondary'} onClick={() => setCategory(undefined)}>Все</Button>
        {Object.values(CalendarEventCategory).map((value) => (
          <Button key={value} size="sm" variant={category === value ? 'default' : 'secondary'} onClick={() => setCategory(value)}>
            {calendarEventCategoryLabels[value]}
          </Button>
        ))}
      </div>

      <Card className="overflow-hidden border border-white/5">
        <div className="flex items-center justify-between border-b border-white/5 p-4">
          <Button variant="ghost" size="icon" onClick={() => setMonth(subMonths(month, 1))}><ChevronLeft className="h-5 w-5" /></Button>
          <h2 className="text-xl capitalize">{format(month, 'LLLL yyyy', { locale: ru })}</h2>
          <Button variant="ghost" size="icon" onClick={() => setMonth(addMonths(month, 1))}><ChevronRight className="h-5 w-5" /></Button>
        </div>
        <div className="grid grid-cols-7 border-b border-white/5 text-center text-xs text-muted-foreground">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => <div key={day} className="py-2">{day}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const rows = byDate.get(format(day, 'yyyy-MM-dd')) ?? [];
            return (
              <div key={day.toISOString()} className={cn('min-h-24 border-b border-r border-white/5 p-1.5 sm:min-h-32 sm:p-2', !isSameMonth(day, month) && 'bg-black/15 text-muted-foreground')}>
                <span className={cn('inline-flex h-6 w-6 items-center justify-center rounded-full text-xs', isSameDay(day, new Date()) && 'bg-primary text-white')}>{format(day, 'd')}</span>
                <div className="mt-1 space-y-1">
                  {rows.slice(0, 3).map((event) => (
                    <Link key={event.id} href={`/events/${event.slug}`} className="block truncate rounded bg-primary/10 px-1.5 py-1 text-[10px] text-primary hover:bg-primary/15 sm:text-xs">{event.title}</Link>
                  ))}
                  {rows.length > 3 ? <span className="text-[10px] text-muted-foreground">+ ещё {rows.length - 3}</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <section className="space-y-3">
        <h2 className="text-2xl">События месяца</h2>
        {events.isLoading ? <Skeleton className="h-32 w-full" /> : null}
        {!events.isLoading && !events.data?.length ? <Card><CardContent className="flex flex-col items-center p-10 text-muted-foreground"><MapPin className="mb-3 h-8 w-8" />На этот месяц событий пока нет</CardContent></Card> : null}
        {events.data?.map((event) => <EventRow key={event.id} event={event} />)}
      </section>
    </div>
  );
}
