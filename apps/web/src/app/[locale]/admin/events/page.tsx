'use client';

import {
  CalendarEventCategory,
  CalendarEventStatus,
  CalendarEventVisibility,
  calendarEventCategoryLabels,
  calendarEventStatusLabels,
  type CalendarEvent,
} from '@twomc/shared';
import { format } from 'date-fns';
import { CalendarPlus, Pencil, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { api, extractErrorMessage } from '@/lib/api';

type Draft = {
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  category: CalendarEventCategory;
  status: CalendarEventStatus;
  visibility: CalendarEventVisibility;
  location: string;
  serverName: string;
  maxParticipants: string;
  coverImage: string;
  isFeatured: boolean;
  allDay: boolean;
};
const emptyDraft: Draft = {
  title: '',
  description: '',
  startsAt: '',
  endsAt: '',
  category: CalendarEventCategory.COMMUNITY,
  status: CalendarEventStatus.DRAFT,
  visibility: CalendarEventVisibility.PUBLIC,
  location: '',
  serverName: '',
  maxParticipants: '',
  coverImage: '',
  isFeatured: false,
  allDay: false,
};

export default function AdminEventsPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      setEvents((await api.get<CalendarEvent[]>('/admin/events')).data);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось загрузить события'));
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setBusy(true);
    try {
      const payload = {
        ...draft,
        startsAt: new Date(draft.startsAt).toISOString(),
        endsAt: draft.endsAt ? new Date(draft.endsAt).toISOString() : null,
        maxParticipants: draft.maxParticipants ? Number(draft.maxParticipants) : null,
        location: draft.location || null,
        serverName: draft.serverName || null,
        coverImage: draft.coverImage || null,
      };
      if (editId) await api.patch(`/admin/events/${editId}`, payload);
      else await api.post('/admin/events', payload);
      toast.success(editId ? 'Событие обновлено' : 'Событие создано');
      setDraft(emptyDraft);
      setEditId(null);
      setShowForm(false);
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось сохранить событие'));
    } finally {
      setBusy(false);
    }
  };

  const edit = (event: CalendarEvent) => {
    const local = (value: string | null) =>
      value ? format(new Date(value), "yyyy-MM-dd'T'HH:mm") : '';
    setDraft({
      title: event.title,
      description: event.description,
      startsAt: local(event.startsAt),
      endsAt: local(event.endsAt),
      category: event.category,
      status: event.status,
      visibility: event.visibility,
      location: event.location ?? '',
      serverName: event.serverName ?? '',
      maxParticipants: event.maxParticipants?.toString() ?? '',
      coverImage: event.coverImage ?? '',
      isFeatured: event.isFeatured,
      allDay: event.allDay,
    });
    setEditId(event.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id: string) => {
    if (!window.confirm('Удалить событие без возможности восстановления?')) return;
    try {
      await api.delete(`/admin/events/${id}`);
      toast.success('Событие удалено');
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось удалить событие'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl">События</h1>
          <p className="text-sm text-muted-foreground">
            Календарь проекта и регистрация участников
          </p>
        </div>
        <Button
          onClick={() => {
            setDraft(emptyDraft);
            setEditId(null);
            setShowForm(!showForm);
          }}
        >
          <CalendarPlus className="mr-2 h-4 w-4" />
          Новое событие
        </Button>
      </div>
      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>{editId ? 'Редактирование' : 'Новое событие'}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Название</Label>
              <Input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Описание (Markdown)</Label>
              <Textarea
                rows={8}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Начало</Label>
              <Input
                type="datetime-local"
                value={draft.startsAt}
                onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Окончание</Label>
              <Input
                type="datetime-local"
                value={draft.endsAt}
                onChange={(e) => setDraft({ ...draft, endsAt: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Категория</Label>
              <Select
                value={draft.category}
                onValueChange={(category: CalendarEventCategory) =>
                  setDraft({ ...draft, category })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(CalendarEventCategory).map((value) => (
                    <SelectItem key={value} value={value}>
                      {calendarEventCategoryLabels[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Видимость</Label>
              <Select
                value={draft.visibility}
                onValueChange={(visibility: CalendarEventVisibility) =>
                  setDraft({ ...draft, visibility })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">Для всех</SelectItem>
                  <SelectItem value="AUTHENTICATED">Для авторизованных</SelectItem>
                  <SelectItem value="STAFF">Для команды</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Место</Label>
              <Input
                value={draft.location}
                onChange={(e) => setDraft({ ...draft, location: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Сервер</Label>
              <Input
                value={draft.serverName}
                onChange={(e) => setDraft({ ...draft, serverName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Лимит участников</Label>
              <Input
                type="number"
                min="1"
                value={draft.maxParticipants}
                onChange={(e) => setDraft({ ...draft, maxParticipants: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Обложка (URL)</Label>
              <Input
                value={draft.coverImage}
                onChange={(e) => setDraft({ ...draft, coverImage: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-3">
              <Switch
                checked={draft.allDay}
                onCheckedChange={(allDay) => setDraft({ ...draft, allDay })}
              />
              Весь день
            </label>
            <label className="flex items-center gap-3">
              <Switch
                checked={draft.isFeatured}
                onCheckedChange={(isFeatured) => setDraft({ ...draft, isFeatured })}
              />
              Избранное
            </label>
            <div className="flex gap-2 md:col-span-2">
              <Button
                onClick={() => void save()}
                disabled={busy || !draft.title || !draft.description || !draft.startsAt}
              >
                Сохранить
              </Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
      <div className="grid gap-3">
        {events.map((event) => (
          <Card key={event.id}>
            <CardContent className="flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2">
                  <h3>{event.title}</h3>
                  <span className="text-xs text-primary">
                    {calendarEventStatusLabels[event.status]}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(event.startsAt), 'dd.MM.yyyy HH:mm')} ·{' '}
                  {calendarEventCategoryLabels[event.category]} · {event.participantCounts.GOING}{' '}
                  участников
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  void api
                    .post(
                      `/admin/events/${event.id}/${event.status === 'PUBLISHED' ? 'cancel' : 'publish'}`,
                    )
                    .then(load)
                }
              >
                {event.status === 'PUBLISHED' ? 'Отменить' : 'Опубликовать'}
              </Button>
              <Button size="icon" variant="ghost" onClick={() => edit(event)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => void remove(event.id)}>
                <Trash2 className="h-4 w-4 text-red-400" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
