import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  CalendarEventStatus,
  CalendarEventVisibility,
  EventAttendanceStatus,
  NotificationType,
  Prisma,
} from '@prisma/client';
import {
  CalendarEvent,
  RoleGroup,
  hasRoleGroup,
} from '@twomc/shared';
import { AuthenticatedUser } from '../auth/authenticated-user';
import { MarkdownService } from '../comments/markdown.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto, ListEventsQueryDto, UpdateEventDto } from './dto/events.dto';

const eventInclude = {
  participants: {
    include: { user: { select: { id: true, username: true, avatar: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
} satisfies Prisma.CalendarEventInclude;

type EventRow = Prisma.CalendarEventGetPayload<{ include: typeof eventInclude }>;

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly markdown: MarkdownService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(query: ListEventsQueryDto, viewer?: AuthenticatedUser): Promise<CalendarEvent[]> {
    const where: Prisma.CalendarEventWhereInput = {
      status: { in: [CalendarEventStatus.PUBLISHED, CalendarEventStatus.CANCELLED] },
      ...this.visibilityWhere(viewer),
      ...(query.category ? { category: query.category } : {}),
      ...(query.from || query.to
        ? {
            startsAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };
    const rows = await this.prisma.calendarEvent.findMany({
      where,
      include: eventInclude,
      orderBy: [{ startsAt: 'asc' }, { title: 'asc' }],
    });
    return rows.map((row) => this.map(row, viewer?.id));
  }

  async featured(viewer?: AuthenticatedUser): Promise<CalendarEvent[]> {
    const rows = await this.prisma.calendarEvent.findMany({
      where: {
        status: CalendarEventStatus.PUBLISHED,
        isFeatured: true,
        startsAt: { gte: new Date() },
        ...this.visibilityWhere(viewer),
      },
      include: eventInclude,
      orderBy: { startsAt: 'asc' },
      take: 5,
    });
    return rows.map((row) => this.map(row, viewer?.id));
  }

  async my(userId: string): Promise<CalendarEvent[]> {
    const rows = await this.prisma.calendarEvent.findMany({
      where: { participants: { some: { userId } } },
      include: eventInclude,
      orderBy: { startsAt: 'asc' },
    });
    return rows.map((row) => this.map(row, userId));
  }

  async bySlug(slug: string, viewer?: AuthenticatedUser): Promise<CalendarEvent> {
    const row = await this.prisma.calendarEvent.findUnique({
      where: { slug },
      include: eventInclude,
    });
    if (!row || row.status === CalendarEventStatus.DRAFT) {
      throw new NotFoundException('Событие не найдено');
    }
    this.assertVisible(row.visibility, viewer);
    return this.map(row, viewer?.id);
  }

  async attend(eventId: string, userId: string, status: EventAttendanceStatus) {
    return this.prisma.$transaction(async (tx) => {
      const event = await tx.calendarEvent.findUnique({ where: { id: eventId } });
      if (!event || event.status !== CalendarEventStatus.PUBLISHED) {
        throw new NotFoundException('Событие недоступно');
      }
      const now = new Date();
      if (event.startsAt <= now) throw new BadRequestException('Событие уже началось');
      if (event.registrationDeadline && event.registrationDeadline < now) {
        throw new BadRequestException('Регистрация на событие завершена');
      }
      if (status === EventAttendanceStatus.GOING && event.maxParticipants) {
        const count = await tx.eventParticipant.count({
          where: { eventId, status: EventAttendanceStatus.GOING },
        });
        const current = await tx.eventParticipant.findUnique({
          where: { eventId_userId: { eventId, userId } },
        });
        if (count >= event.maxParticipants && current?.status !== EventAttendanceStatus.GOING) {
          throw new BadRequestException('Все места уже заняты');
        }
      }
      return tx.eventParticipant.upsert({
        where: { eventId_userId: { eventId, userId } },
        create: { eventId, userId, status },
        update: { status, remindedAt: null },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async leave(eventId: string, userId: string): Promise<void> {
    await this.prisma.eventParticipant.deleteMany({ where: { eventId, userId } });
  }

  adminList() {
    return this.prisma.calendarEvent.findMany({
      include: eventInclude,
      orderBy: { startsAt: 'desc' },
    }).then((rows) => rows.map((row) => this.map(row)));
  }

  async create(dto: CreateEventDto, actorId: string): Promise<CalendarEvent> {
    this.validateDates(dto);
    const row = await this.prisma.calendarEvent.create({
      data: {
        title: dto.title.trim(),
        description: dto.description,
        slug: await this.uniqueSlug(dto.slug || dto.title),
        descriptionHtml: this.markdown.render(dto.description),
        coverImage: dto.coverImage || null,
        category: dto.category,
        status: dto.status,
        visibility: dto.visibility,
        startsAt: new Date(dto.startsAt),
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        isAllDay: dto.allDay,
        timezone: dto.timezone,
        location: dto.location || null,
        server: dto.serverName || null,
        maxParticipants: dto.maxParticipants,
        registrationDeadline: dto.registrationDeadline
          ? new Date(dto.registrationDeadline)
          : null,
        isFeatured: dto.isFeatured,
        createdById: actorId,
      },
      include: eventInclude,
    });
    return this.map(row);
  }

  async update(id: string, dto: UpdateEventDto): Promise<CalendarEvent> {
    const existing = await this.require(id);
    this.validateDates({
      startsAt: dto.startsAt ?? existing.startsAt.toISOString(),
      endsAt: dto.endsAt === undefined ? existing.endsAt?.toISOString() : dto.endsAt,
      registrationDeadline:
        dto.registrationDeadline === undefined
          ? existing.registrationDeadline?.toISOString()
          : dto.registrationDeadline,
    });
    const row = await this.prisma.calendarEvent.update({
      where: { id },
      data: {
        ...this.data(dto),
        ...(dto.slug ? { slug: await this.uniqueSlug(dto.slug, id) } : {}),
        ...(dto.description !== undefined
          ? { descriptionHtml: this.markdown.render(dto.description) }
          : {}),
      },
      include: eventInclude,
    });
    if (existing.status === CalendarEventStatus.PUBLISHED) {
      void this.notifyParticipants(row, 'Событие обновлено').catch(() => undefined);
    }
    return this.map(row);
  }

  async remove(id: string): Promise<void> {
    await this.require(id);
    await this.prisma.calendarEvent.delete({ where: { id } });
  }

  async setStatus(id: string, status: CalendarEventStatus): Promise<CalendarEvent> {
    const row = await this.prisma.calendarEvent.update({
      where: { id }, data: { status }, include: eventInclude,
    });
    if (status === CalendarEventStatus.CANCELLED) {
      void this.notifyParticipants(row, 'Событие отменено').catch(() => undefined);
    }
    return this.map(row);
  }

  @Cron('0 0 * * * *')
  async sendReminders(): Promise<void> {
    const now = new Date();
    const until = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const participants = await this.prisma.eventParticipant.findMany({
      where: {
        remindedAt: null,
        status: { in: [EventAttendanceStatus.GOING, EventAttendanceStatus.INTERESTED] },
        event: {
          status: CalendarEventStatus.PUBLISHED,
          startsAt: { gt: now, lte: until },
        },
      },
      include: { event: true },
      take: 500,
    });
    for (const participant of participants) {
      await this.notifications.createNotification({
        userId: participant.userId,
        type: NotificationType.EVENT_REMINDER,
        title: 'Событие скоро начнётся',
        message: `«${participant.event.title}» начнётся в течение суток`,
        link: `/events/${participant.event.slug}`,
      });
      await this.prisma.eventParticipant.update({
        where: { id: participant.id }, data: { remindedAt: new Date() },
      });
    }
  }

  private data(dto: UpdateEventDto): Prisma.CalendarEventUncheckedUpdateInput {
    return {
      ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.coverImage !== undefined ? { coverImage: dto.coverImage || null } : {}),
      ...(dto.category !== undefined ? { category: dto.category } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.visibility !== undefined ? { visibility: dto.visibility } : {}),
      ...(dto.startsAt !== undefined ? { startsAt: new Date(dto.startsAt) } : {}),
      ...(dto.endsAt !== undefined ? { endsAt: dto.endsAt ? new Date(dto.endsAt) : null } : {}),
      ...(dto.allDay !== undefined ? { isAllDay: dto.allDay } : {}),
      ...(dto.timezone !== undefined ? { timezone: dto.timezone } : {}),
      ...(dto.location !== undefined ? { location: dto.location || null } : {}),
      ...(dto.serverName !== undefined ? { server: dto.serverName || null } : {}),
      ...(dto.maxParticipants !== undefined ? { maxParticipants: dto.maxParticipants } : {}),
      ...(dto.registrationDeadline !== undefined
        ? { registrationDeadline: dto.registrationDeadline ? new Date(dto.registrationDeadline) : null }
        : {}),
      ...(dto.isFeatured !== undefined ? { isFeatured: dto.isFeatured } : {}),
    };
  }

  private map(row: EventRow, userId?: string): CalendarEvent {
    const counts = { GOING: 0, INTERESTED: 0, DECLINED: 0 };
    for (const participant of row.participants) counts[participant.status] += 1;
    return {
      id: row.id, slug: row.slug, title: row.title, description: row.description,
      descriptionHtml: row.descriptionHtml, coverImage: row.coverImage,
      category: row.category, status: row.status, visibility: row.visibility,
      startsAt: row.startsAt.toISOString(), endsAt: row.endsAt?.toISOString() ?? null,
      allDay: row.isAllDay, timezone: row.timezone, location: row.location,
      serverName: row.server, maxParticipants: row.maxParticipants,
      registrationDeadline: row.registrationDeadline?.toISOString() ?? null,
      isFeatured: row.isFeatured, participantCounts: counts,
      myAttendance: row.participants.find((p) => p.userId === userId)?.status ?? null,
      participants: row.participants.map((p) => ({
        id: p.id, status: p.status, user: p.user,
      })),
      createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
    };
  }

  private visibilityWhere(viewer?: AuthenticatedUser): Prisma.CalendarEventWhereInput {
    if (!viewer) return { visibility: CalendarEventVisibility.PUBLIC };
    if (hasRoleGroup(viewer.roleGroup, RoleGroup.HELPER)) return {};
    return { visibility: { in: [CalendarEventVisibility.PUBLIC, CalendarEventVisibility.AUTHENTICATED] } };
  }

  private assertVisible(visibility: CalendarEventVisibility, viewer?: AuthenticatedUser) {
    if (visibility === CalendarEventVisibility.AUTHENTICATED && !viewer) {
      throw new ForbiddenException('Войдите, чтобы увидеть событие');
    }
    if (visibility === CalendarEventVisibility.STAFF &&
      (!viewer || !hasRoleGroup(viewer.roleGroup, RoleGroup.HELPER))) {
      throw new ForbiddenException('Событие доступно только команде проекта');
    }
  }

  private validateDates(dto: { startsAt: string; endsAt?: string | null; registrationDeadline?: string | null }) {
    const start = new Date(dto.startsAt);
    if (dto.endsAt && new Date(dto.endsAt) < start) {
      throw new BadRequestException('Окончание события не может быть раньше начала');
    }
    if (dto.registrationDeadline && new Date(dto.registrationDeadline) > start) {
      throw new BadRequestException('Регистрация должна завершиться до начала события');
    }
  }

  private async require(id: string) {
    const row = await this.prisma.calendarEvent.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Событие не найдено');
    return row;
  }

  private async uniqueSlug(value: string, ignoreId?: string): Promise<string> {
    const base = value.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, '-')
      .replace(/^-|-$/g, '').slice(0, 120) || `event-${Date.now()}`;
    let slug = base;
    let counter = 2;
    while (await this.prisma.calendarEvent.findFirst({ where: { slug, id: { not: ignoreId } }, select: { id: true } })) {
      slug = `${base}-${counter++}`;
    }
    return slug;
  }

  private async notifyParticipants(row: EventRow, title: string) {
    await Promise.all(row.participants.map((participant) =>
      this.notifications.createNotification({
        userId: participant.userId,
        type: NotificationType.EVENT_UPDATED,
        title,
        message: row.title,
        link: `/events/${row.slug}`,
      }),
    ));
  }
}
