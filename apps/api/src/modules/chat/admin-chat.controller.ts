import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RoleGroup } from '@twomc/shared';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ChannelsService } from './channels.service';
import {
  ChatSettingsDto,
  CreateChannelDto,
  UpdateChannelDto,
} from './dto/chat.dto';
import { MessagesService } from './messages.service';
import { ModerationService } from './moderation.service';

@Controller('admin/chat')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleGroup.ADMIN)
export class AdminChatController {
  constructor(
    private readonly channels: ChannelsService,
    private readonly messages: MessagesService,
    private readonly moderation: ModerationService,
  ) {}

  @Post('channels')
  @HttpCode(HttpStatus.CREATED)
  createChannel(@Body() dto: CreateChannelDto) {
    return this.channels.create(dto);
  }

  @Patch('channels/:id')
  updateChannel(@Param('id') id: string, @Body() dto: UpdateChannelDto) {
    return this.channels.update(id, dto);
  }

  @Delete('channels/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteChannel(@Param('id') id: string) {
    await this.channels.remove(id);
  }

  @Get('mutes')
  listMutes() {
    return this.moderation.listMutes();
  }

  @Delete('mutes/:id')
  unmute(@Param('id') id: string) {
    return this.moderation.unmute(id);
  }

  @Get('bans')
  listBans() {
    return this.moderation.listBans();
  }

  @Delete('bans/:id')
  unban(@Param('id') id: string) {
    return this.moderation.unban(id);
  }

  @Get('messages/search')
  search(
    @Query('q') q = '',
    @Query('channel') channel?: string,
  ) {
    return this.messages.search(q, channel);
  }

  @Get('messages/:id')
  getMessage(@Param('id') id: string) {
    return this.messages.getById(id);
  }

  @Get('settings')
  getSettings() {
    return this.moderation.getSettings();
  }

  @Patch('settings')
  updateSettings(@Body() dto: ChatSettingsDto) {
    return this.moderation.updateSettings(dto);
  }
}
