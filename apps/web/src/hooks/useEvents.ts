'use client';

import type {
  CalendarEvent,
  CalendarEventCategory,
  EventAttendanceStatus,
} from '@twomc/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useEvents(filters: { from?: string; to?: string; category?: CalendarEventCategory } = {}) {
  return useQuery({
    queryKey: ['events', filters],
    queryFn: async () => (await api.get<CalendarEvent[]>('/events', {
      params: filters,
      skipAuthRedirect: true,
    })).data,
  });
}

export function useEvent(slug: string) {
  return useQuery({
    queryKey: ['events', slug],
    queryFn: async () => (await api.get<CalendarEvent>(`/events/${slug}`, {
      skipAuthRedirect: true,
    })).data,
    enabled: Boolean(slug),
  });
}

export function useEventAttendance() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, status }: { eventId: string; status?: EventAttendanceStatus }) =>
      status
        ? api.post(`/events/${eventId}/attendance`, { status })
        : api.delete(`/events/${eventId}/attendance`),
    onSuccess: () => client.invalidateQueries({ queryKey: ['events'] }),
  });
}
