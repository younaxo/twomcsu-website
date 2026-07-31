import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  GamePunishmentSummary,
  GameReportSummary,
  ReportAttachment,
  ReportBanInfo,
  ReportDetails,
  ReportListResponse,
  ReportStats,
  RoleGroup,
  TopicDetails,
  UserPunishmentSummary,
} from '@twomc/shared';
import { AuthenticatedUser } from '../auth/authenticated-user';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  AddReportMessageDto,
  ArchiveReportDto,
  AssignReportDto,
  BanReportsDto,
  ChangeReportStatusDto,
  CreateDonationProblemDto,
  CreateModeratorNoteDto,
  CreatePunishmentDto,
  CreateReportDto,
  ListReportsQueryDto,
  LockReportDto,
  MyPunishmentsQueryDto,
  ReportRulesQueryDto,
  SetVerdictDto,
  SoftDeleteMessageDto,
  UpdateModeratorNoteDto,
  UpdateOwnReportMessageDto,
  UpdatePunishmentDto,
} from './dto/reports.dto';
import { ReportsPunishmentsService } from './reports-punishments.service';
import { ReportsService } from './reports.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(
    private readonly reports: ReportsService,
    private readonly punishments: ReportsPunishmentsService,
  ) {}

  @Get('reports/rules')
  @Public()
  getRules(@Query() query: ReportRulesQueryDto): Promise<TopicDetails | null> {
    return this.reports.getRules(query.type);
  }

  @Get('reports')
  listMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListReportsQueryDto,
  ): Promise<ReportListResponse> {
    return this.reports.listMine(user.id, user.roleGroup, query);
  }

  @Get('reports/:reportNumber')
  getOne(
    @Param('reportNumber') reportNumber: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ReportDetails> {
    return this.reports.getByNumber(reportNumber, user.id, user.roleGroup);
  }

  @Post('reports')
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReportDto,
    @Ip() ip: string,
  ): Promise<ReportDetails> {
    return this.reports.createReport(userId, dto, ip);
  }

  @Post('reports/:reportNumber/messages')
  @HttpCode(HttpStatus.CREATED)
  addMessage(
    @Param('reportNumber') reportNumber: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddReportMessageDto,
  ): Promise<ReportDetails> {
    return this.reports.addMessage(reportNumber, user.id, user.roleGroup, dto);
  }

  @Patch('reports/:reportNumber/messages/:messageId')
  updateOwnMessage(
    @Param('reportNumber') reportNumber: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateOwnReportMessageDto,
  ): Promise<ReportDetails> {
    return this.reports.updateOwnMessage(
      reportNumber,
      messageId,
      user.id,
      user.roleGroup,
      dto,
    );
  }

  @Post('reports/:reportNumber/attachments')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024, files: 1 },
    }),
  )
  uploadAttachment(
    @Param('reportNumber') reportNumber: string,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: 20 * 1024 * 1024 })
        .build({ fileIsRequired: true }),
    )
    file: Express.Multer.File,
  ): Promise<ReportAttachment> {
    return this.reports.uploadAttachment(reportNumber, user.id, user.roleGroup, file);
  }

  @Get('game-reports')
  listGameReports(): Promise<GameReportSummary[]> {
    return this.reports.listGameReports();
  }

  @Get('users/:username/game-reports/incoming')
  listIncomingGameReports(
    @Param('username') username: string,
  ): Promise<GameReportSummary[]> {
    return this.reports.listIncomingGameReports(username);
  }

  @Get('users/:username/game-reports/outgoing')
  listOutgoingGameReports(
    @Param('username') username: string,
  ): Promise<GameReportSummary[]> {
    return this.reports.listOutgoingGameReports(username);
  }

  @Get('bans')
  listActiveGamePunishments(): Promise<GamePunishmentSummary[]> {
    return this.reports.listActiveGamePunishments();
  }

  @Get('users/:username/punishments-history')
  listGamePunishmentHistory(
    @Param('username') username: string,
  ): Promise<GamePunishmentSummary[]> {
    return this.reports.listGamePunishmentHistory(username);
  }

  @Get('users/me/game-punishments')
  listMyGamePunishments(@CurrentUser('id') userId: string): Promise<GamePunishmentSummary[]> {
    return this.reports.listMyGamePunishments(userId);
  }

  @Get('moderation/reports')
  @UseGuards(RolesGuard)
  @Roles(RoleGroup.HELPER)
  listModeration(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListReportsQueryDto,
  ): Promise<ReportListResponse> {
    return this.reports.listModeration(user.roleGroup, query, user.id);
  }

  @Patch('moderation/reports/:reportNumber/assign')
  @UseGuards(RolesGuard)
  @Roles(RoleGroup.HELPER)
  assign(
    @Param('reportNumber') reportNumber: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AssignReportDto,
  ): Promise<ReportDetails> {
    return this.reports.assign(reportNumber, user.id, user.roleGroup, dto);
  }

  @Patch('moderation/reports/:reportNumber/status')
  @UseGuards(RolesGuard)
  @Roles(RoleGroup.HELPER)
  changeStatus(
    @Param('reportNumber') reportNumber: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangeReportStatusDto,
  ): Promise<ReportDetails> {
    return this.reports.changeStatus(reportNumber, user.id, user.roleGroup, dto);
  }

  @Patch('moderation/reports/:reportNumber/verdict')
  @UseGuards(RolesGuard)
  @Roles(RoleGroup.HELPER)
  setVerdict(
    @Param('reportNumber') reportNumber: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SetVerdictDto,
  ): Promise<ReportDetails> {
    return this.reports.setVerdict(reportNumber, user.id, user.roleGroup, dto);
  }

  @Post('moderation/reports/:reportNumber/messages')
  @UseGuards(RolesGuard)
  @Roles(RoleGroup.HELPER)
  @HttpCode(HttpStatus.CREATED)
  moderationMessage(
    @Param('reportNumber') reportNumber: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddReportMessageDto,
  ): Promise<ReportDetails> {
    return this.reports.addMessage(reportNumber, user.id, user.roleGroup, dto, {
      asModerator: true,
    });
  }

  @Delete('moderation/reports/:reportNumber/messages/:messageId')
  @UseGuards(RolesGuard)
  @Roles(RoleGroup.HELPER)
  softDeleteMessage(
    @Param('reportNumber') reportNumber: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SoftDeleteMessageDto,
  ): Promise<ReportDetails> {
    return this.reports.softDeleteMessage(
      reportNumber,
      messageId,
      user.id,
      user.roleGroup,
      dto,
    );
  }

  @Patch('moderation/reports/:reportNumber/messages/:messageId/pin')
  @UseGuards(RolesGuard)
  @Roles(RoleGroup.HELPER)
  pinMessage(
    @Param('reportNumber') reportNumber: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ReportDetails> {
    return this.reports.pinMessage(reportNumber, messageId, user.id, user.roleGroup);
  }

  @Patch('moderation/reports/:reportNumber/messages/:messageId/unpin')
  @UseGuards(RolesGuard)
  @Roles(RoleGroup.HELPER)
  unpinMessage(
    @Param('reportNumber') reportNumber: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ReportDetails> {
    return this.reports.unpinMessage(reportNumber, messageId, user.id, user.roleGroup);
  }

  @Post('moderation/reports/:reportNumber/notes')
  @UseGuards(RolesGuard)
  @Roles(RoleGroup.HELPER)
  @HttpCode(HttpStatus.CREATED)
  createModeratorNote(
    @Param('reportNumber') reportNumber: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateModeratorNoteDto,
  ): Promise<ReportDetails> {
    return this.reports.createModeratorNote(reportNumber, user.id, user.roleGroup, dto);
  }

  @Patch('moderation/reports/:reportNumber/notes/:noteId')
  @UseGuards(RolesGuard)
  @Roles(RoleGroup.HELPER)
  updateModeratorNote(
    @Param('reportNumber') reportNumber: string,
    @Param('noteId') noteId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateModeratorNoteDto,
  ): Promise<ReportDetails> {
    return this.reports.updateModeratorNote(
      reportNumber,
      noteId,
      user.id,
      user.roleGroup,
      dto,
    );
  }

  @Delete('moderation/reports/:reportNumber/notes/:noteId')
  @UseGuards(RolesGuard)
  @Roles(RoleGroup.HELPER)
  deleteModeratorNote(
    @Param('reportNumber') reportNumber: string,
    @Param('noteId') noteId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ReportDetails> {
    return this.reports.deleteModeratorNote(reportNumber, noteId, user.id, user.roleGroup);
  }

  @Patch('moderation/reports/:reportNumber/notes/:noteId/pin')
  @UseGuards(RolesGuard)
  @Roles(RoleGroup.HELPER)
  pinModeratorNote(
    @Param('reportNumber') reportNumber: string,
    @Param('noteId') noteId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ReportDetails> {
    return this.reports.pinModeratorNote(reportNumber, noteId, user.id, user.roleGroup);
  }

  @Post('moderation/reports/:reportNumber/lock')
  @UseGuards(RolesGuard)
  @Roles(RoleGroup.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  lock(
    @Param('reportNumber') reportNumber: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: LockReportDto,
  ): Promise<ReportDetails> {
    return this.reports.lock(reportNumber, user.id, user.roleGroup, dto);
  }

  @Get('admin/reports/stats')
  @UseGuards(RolesGuard)
  @Roles(RoleGroup.ADMIN)
  stats(): Promise<ReportStats> {
    return this.reports.stats();
  }

  @Get('admin/reports/archived')
  @UseGuards(RolesGuard)
  @Roles(RoleGroup.ADMIN)
  listArchived(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListReportsQueryDto,
  ): Promise<ReportListResponse> {
    return this.reports.listArchived(user.roleGroup, query);
  }

  @Post('admin/reports/:reportNumber/archive')
  @UseGuards(RolesGuard)
  @Roles(RoleGroup.ADMIN)
  @HttpCode(HttpStatus.OK)
  archiveReport(
    @Param('reportNumber') reportNumber: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ArchiveReportDto,
  ): Promise<ReportDetails> {
    return this.reports.archiveReport(reportNumber, user.id, user.roleGroup, dto);
  }

  @Post('admin/reports/:reportNumber/unarchive')
  @UseGuards(RolesGuard)
  @Roles(RoleGroup.ADMIN)
  @HttpCode(HttpStatus.OK)
  unarchiveReport(
    @Param('reportNumber') reportNumber: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ReportDetails> {
    return this.reports.unarchiveReport(reportNumber, user.id, user.roleGroup);
  }

  @Delete('admin/reports/:reportNumber')
  @UseGuards(RolesGuard)
  @Roles(RoleGroup.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteReport(
    @Param('reportNumber') reportNumber: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.reports.deleteReport(reportNumber, user.id, user.roleGroup);
  }

  @Delete('admin/reports/:reportNumber/messages/:messageId')
  @UseGuards(RolesGuard)
  @Roles(RoleGroup.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  hardDeleteMessage(
    @Param('reportNumber') reportNumber: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.reports.hardDeleteMessage(
      reportNumber,
      messageId,
      user.id,
      user.roleGroup,
    );
  }

  @Post('admin/reports/ban/:userId')
  @UseGuards(RolesGuard)
  @Roles(RoleGroup.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  banUser(
    @Param('userId') userId: string,
    @CurrentUser('id') actorId: string,
    @Body() dto: BanReportsDto,
  ): Promise<ReportBanInfo> {
    return this.reports.banUser(userId, actorId, dto);
  }

  @Delete('admin/reports/ban/:userId')
  @UseGuards(RolesGuard)
  @Roles(RoleGroup.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  unbanUser(@Param('userId') userId: string): Promise<void> {
    return this.reports.unbanUser(userId);
  }

  @Post('support/donation-problem')
  @HttpCode(HttpStatus.CREATED)
  donationProblem(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateDonationProblemDto,
    @Ip() ip: string,
  ): Promise<ReportDetails> {
    return this.reports.createDonationProblem(userId, dto, ip);
  }

  @Get('admin/support/donations')
  @UseGuards(RolesGuard)
  @Roles(RoleGroup.OWNER)
  listDonations(@Query() query: ListReportsQueryDto): Promise<ReportListResponse> {
    return this.reports.listDonations(query);
  }

  @Get('users/me/punishments')
  listMyPunishments(
    @CurrentUser('id') userId: string,
    @Query() query: MyPunishmentsQueryDto,
  ): Promise<UserPunishmentSummary[]> {
    return this.punishments.listMyPunishments(userId, Boolean(query.onlyAppealable));
  }

  @Get('admin/users/:username/punishments')
  @UseGuards(RolesGuard)
  @Roles(RoleGroup.MODERATOR)
  listUserPunishments(
    @Param('username') username: string,
  ): Promise<UserPunishmentSummary[]> {
    return this.punishments.listByUsername(username);
  }

  @Post('admin/users/:userId/punishments')
  @UseGuards(RolesGuard)
  @Roles(RoleGroup.MODERATOR)
  @HttpCode(HttpStatus.CREATED)
  issuePunishment(
    @Param('userId') userId: string,
    @CurrentUser('id') actorId: string,
    @Body() dto: CreatePunishmentDto,
  ): Promise<UserPunishmentSummary> {
    return this.punishments.issuePunishment(userId, actorId, dto);
  }

  @Patch('admin/users/:userId/punishments/:id')
  @UseGuards(RolesGuard)
  @Roles(RoleGroup.MODERATOR)
  updatePunishment(
    @Param('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePunishmentDto,
  ): Promise<UserPunishmentSummary> {
    return this.punishments.updatePunishment(userId, id, dto);
  }
}
