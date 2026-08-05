import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { ChannelsService } from './channels.service';
import { MessagesService } from './messages.service';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly channels: ChannelsService,
    private readonly messages: MessagesService,
  ) {}

  @Get('channels')
  listChannels() {
    return this.channels.listActive();
  }

  @Get('channels/:slug')
  getChannel(@Param('slug') slug: string) {
    return this.channels.getBySlug(slug);
  }

  @Get('channels/:slug/messages')
  @UseGuards(OptionalJwtAuthGuard)
  getMessages(
    @Param('slug') slug: string,
    @Query('before') before: string | undefined,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @CurrentUser('id') userId?: string,
  ) {
    return this.messages.getHistory(slug, before, limit, userId);
  }

  @Get('channels/:slug/online')
  async getOnline(@Param('slug') slug: string) {
    const channel = await this.channels.getBySlug(slug);
    return this.messages.getOnlineUsers(channel.id);
  }

  @Get('channels/:slug/pinned')
  @UseGuards(OptionalJwtAuthGuard)
  getPinned(@Param('slug') slug: string, @CurrentUser('id') userId?: string) {
    return this.messages.getPinned(slug, userId);
  }
}
