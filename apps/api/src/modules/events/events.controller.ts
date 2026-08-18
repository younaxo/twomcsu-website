import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CalendarEventStatus, RoleGroup } from '@twomc/shared';
import { AuthenticatedUser } from '../auth/authenticated-user';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateEventDto, EventAttendanceDto, ListEventsQueryDto, UpdateEventDto } from './dto/events.dto';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  list(@Query() query: ListEventsQueryDto, @CurrentUser() viewer?: AuthenticatedUser) {
    return this.events.list(query, viewer);
  }

  @Get('featured')
  @UseGuards(OptionalJwtAuthGuard)
  featured(@CurrentUser() viewer?: AuthenticatedUser) { return this.events.featured(viewer); }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  mine(@CurrentUser('id') userId: string) { return this.events.my(userId); }

  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  bySlug(@Param('slug') slug: string, @CurrentUser() viewer?: AuthenticatedUser) {
    return this.events.bySlug(slug, viewer);
  }

  @Post(':id/attendance')
  @UseGuards(JwtAuthGuard)
  attend(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() dto: EventAttendanceDto) {
    return this.events.attend(id, userId, dto.status);
  }

  @Delete(':id/attendance')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  leave(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.events.leave(id, userId);
  }
}

@Controller('admin/events')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleGroup.ADMIN)
export class AdminEventsController {
  constructor(private readonly events: EventsService) {}
  @Get() list() { return this.events.adminList(); }
  @Post() create(@Body() dto: CreateEventDto, @CurrentUser('id') actorId: string) { return this.events.create(dto, actorId); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateEventDto) { return this.events.update(id, dto); }
  @Post(':id/publish') publish(@Param('id') id: string) { return this.events.setStatus(id, CalendarEventStatus.PUBLISHED); }
  @Post(':id/cancel') cancel(@Param('id') id: string) { return this.events.setStatus(id, CalendarEventStatus.CANCELLED); }
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) remove(@Param('id') id: string) { return this.events.remove(id); }
}
