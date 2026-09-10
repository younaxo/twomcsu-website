'use client';
/* eslint-disable @next/next/no-img-element */

import { EventAttendanceStatus, calendarEventCategoryLabels } from '@twomc/shared';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ArrowLeft, CalendarDays, MapPin, Server, Users } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useRouter } from '@/i18n/navigation';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useEvent, useEventAttendance } from '@/hooks/useEvents';
import { extractErrorMessage } from '@/lib/api';

export default function EventDetailsPage() {
  const slug = String(useParams().slug);
  const event = useEvent(slug);
  const attendance = useEventAttendance();
  const auth = useAuth();
  const router = useRouter();

  if (event.isLoading) return <Skeleton className="h-[32rem] w-full" />;
  if (!event.data) return <p>Событие не найдено</p>;
  const item = event.data;
  const setAttendance = async (status?: EventAttendanceStatus) => {
    if (!auth.isAuthenticated) {
      router.push(`/login?next=/events/${slug}`);
      return;
    }
    try {
      await attendance.mutateAsync({ eventId: item.id, status });
      toast.success(status ? 'Ваш ответ сохранён' : 'Участие отменено');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось сохранить ответ'));
    }
  };

  return (
    <article className="mx-auto max-w-5xl space-y-6">
      <Button asChild variant="ghost">
        <Link href="/events">
          <ArrowLeft className="mr-2 h-4 w-4" />К календарю
        </Link>
      </Button>
      {item.coverImage ? (
        <div className="h-52 overflow-hidden rounded-3xl sm:h-80">
          <img src={item.coverImage} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardContent className="p-6 sm:p-8">
            <Badge>{calendarEventCategoryLabels[item.category]}</Badge>
            <h1 className="mt-4 text-3xl text-white sm:text-4xl">{item.title}</h1>
            <div
              className="prose prose-invert mt-7 max-w-none"
              dangerouslySetInnerHTML={{ __html: item.descriptionHtml }}
            />
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-5 text-sm">
              <div className="flex gap-3">
                <CalendarDays className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">
                    {format(new Date(item.startsAt), 'd MMMM yyyy', { locale: ru })}
                  </p>
                  <p className="text-muted-foreground">
                    {item.allDay ? 'Весь день' : format(new Date(item.startsAt), 'HH:mm')}
                  </p>
                </div>
              </div>
              {item.location ? (
                <div className="flex gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>{item.location}</span>
                </div>
              ) : null}
              {item.serverName ? (
                <div className="flex gap-3">
                  <Server className="h-5 w-5 text-primary" />
                  <span>{item.serverName}</span>
                </div>
              ) : null}
              <div className="flex gap-3">
                <Users className="h-5 w-5 text-primary" />
                <span>
                  Пойдут: {item.participantCounts.GOING}
                  {item.maxParticipants ? ` из ${item.maxParticipants}` : ''}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2 p-5">
              <p className="mb-3 font-medium">Вы будете участвовать?</p>
              <Button
                className="w-full"
                variant={
                  item.myAttendance === EventAttendanceStatus.GOING ? 'default' : 'secondary'
                }
                onClick={() => void setAttendance(EventAttendanceStatus.GOING)}
              >
                Пойду
              </Button>
              <Button
                className="w-full"
                variant={
                  item.myAttendance === EventAttendanceStatus.INTERESTED ? 'default' : 'secondary'
                }
                onClick={() => void setAttendance(EventAttendanceStatus.INTERESTED)}
              >
                Интересно
              </Button>
              {item.myAttendance ? (
                <Button className="w-full" variant="ghost" onClick={() => void setAttendance()}>
                  Отменить ответ
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </article>
  );
}
