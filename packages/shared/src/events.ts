export const CalendarEventCategory = {
  COMMUNITY: 'COMMUNITY',
  TOURNAMENT: 'TOURNAMENT',
  UPDATE: 'UPDATE',
  MAINTENANCE: 'MAINTENANCE',
  HOLIDAY: 'HOLIDAY',
  OTHER: 'OTHER',
} as const;
export type CalendarEventCategory =
  (typeof CalendarEventCategory)[keyof typeof CalendarEventCategory];

export const CalendarEventStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
} as const;
export type CalendarEventStatus =
  (typeof CalendarEventStatus)[keyof typeof CalendarEventStatus];

export const CalendarEventVisibility = {
  PUBLIC: 'PUBLIC',
  AUTHENTICATED: 'AUTHENTICATED',
  STAFF: 'STAFF',
} as const;
export type CalendarEventVisibility =
  (typeof CalendarEventVisibility)[keyof typeof CalendarEventVisibility];

export const EventAttendanceStatus = {
  GOING: 'GOING',
  INTERESTED: 'INTERESTED',
  DECLINED: 'DECLINED',
} as const;
export type EventAttendanceStatus =
  (typeof EventAttendanceStatus)[keyof typeof EventAttendanceStatus];

export interface CalendarEventParticipant {
  id: string;
  status: EventAttendanceStatus;
  user: { id: string; username: string; avatar: string | null };
}

export interface CalendarEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  descriptionHtml: string;
  coverImage: string | null;
  category: CalendarEventCategory;
  status: CalendarEventStatus;
  visibility: CalendarEventVisibility;
  startsAt: string;
  endsAt: string | null;
  allDay: boolean;
  timezone: string;
  location: string | null;
  serverName: string | null;
  maxParticipants: number | null;
  registrationDeadline: string | null;
  isFeatured: boolean;
  participantCounts: Record<EventAttendanceStatus, number>;
  myAttendance: EventAttendanceStatus | null;
  participants?: CalendarEventParticipant[];
  createdAt: string;
  updatedAt: string;
}

export const calendarEventCategoryLabels: Record<CalendarEventCategory, string> = {
  COMMUNITY: 'Сообщество',
  TOURNAMENT: 'Турнир',
  UPDATE: 'Обновление',
  MAINTENANCE: 'Технические работы',
  HOLIDAY: 'Праздник',
  OTHER: 'Другое',
};

export const calendarEventStatusLabels: Record<CalendarEventStatus, string> = {
  DRAFT: 'Черновик',
  PUBLISHED: 'Опубликовано',
  CANCELLED: 'Отменено',
  COMPLETED: 'Завершено',
};
