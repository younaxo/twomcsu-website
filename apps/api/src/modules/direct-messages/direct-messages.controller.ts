import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DirectMessagesGateway } from './direct-messages.gateway';
import { DirectMessagesService } from './direct-messages.service';
import {
  AddConversationMemberDto,
  CreateDirectConversationDto,
  CreateGroupConversationDto,
  CreateGroupInviteDto,
  EditDirectMessageDto,
  MarkConversationReadDto,
  ReactToDirectMessageDto,
  SendDirectMessageDto,
  UpdateConversationDto,
  UpdateConversationMemberDto,
  UpdateDirectMessagePrivacyDto,
} from './dto/direct-messages.dto';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class DirectMessagesController {
  constructor(
    private readonly messages: DirectMessagesService,
    private readonly gateway: DirectMessagesGateway,
  ) {}

  @Get('conversations')
  list(@CurrentUser('id') userId: string) {
    return this.messages.listConversations(userId);
  }

  @Get('conversations/:id')
  getConversation(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.messages.getConversation(userId, id);
  }

  @Post('conversations/direct')
  async createDirect(@CurrentUser('id') userId: string, @Body() body: CreateDirectConversationDto) {
    const conversation = await this.messages.createDirect(userId, body.username);
    await this.gateway.syncConversationRooms(conversation.id);
    return conversation;
  }

  @Post('conversations/group')
  async createGroup(@CurrentUser('id') userId: string, @Body() body: CreateGroupConversationDto) {
    const conversation = await this.messages.createGroup(userId, body.title, body.usernames);
    await this.gateway.syncConversationRooms(conversation.id);
    return conversation;
  }

  @Patch('conversations/:id')
  async updateConversation(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: UpdateConversationDto,
  ) {
    const conversation = await this.messages.updateConversation(userId, id, body);
    this.gateway.emitConversationChanged(id);
    return conversation;
  }

  @Get('conversations/:id/messages')
  getMessages(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Query('before') before: string | undefined,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.messages.getMessages(userId, id, before, limit);
  }

  @Post('conversations/:id/messages')
  async sendMessage(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: SendDirectMessageDto,
  ) {
    const message = await this.messages.sendMessage(userId, id, body.content, body.parentId);
    this.gateway.emitNewMessage(id, message);
    return message;
  }

  @Post('conversations/:id/messages/upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async sendAttachment(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('content') content?: string,
    @Body('parentId') parentId?: string,
  ) {
    if (!file) throw new BadRequestException('Файл не выбран');
    const message = await this.messages.sendAttachment(userId, id, file, content, parentId);
    this.gateway.emitNewMessage(id, message);
    return message;
  }

  @Patch('messages/:messageId')
  async editMessage(
    @CurrentUser('id') userId: string,
    @Param('messageId') messageId: string,
    @Body() body: EditDirectMessageDto,
  ) {
    const message = await this.messages.editMessage(userId, messageId, body.content);
    this.gateway.emitUpdatedMessage(message);
    return message;
  }

  @Delete('messages/:messageId')
  async deleteMessage(@CurrentUser('id') userId: string, @Param('messageId') messageId: string) {
    const message = await this.messages.deleteMessage(userId, messageId);
    this.gateway.emitUpdatedMessage(message);
    this.gateway.emitConversationChanged(message.conversationId);
    return message;
  }

  @Post('messages/:messageId/reactions')
  async react(
    @CurrentUser('id') userId: string,
    @Param('messageId') messageId: string,
    @Body() body: ReactToDirectMessageDto,
  ) {
    const message = await this.messages.toggleReaction(userId, messageId, body.emoji);
    this.gateway.emitUpdatedMessage(message);
    return message;
  }

  @Post('conversations/:id/read')
  async markRead(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: MarkConversationReadDto,
  ) {
    const receipt = await this.messages.markRead(userId, id, body.messageId);
    this.gateway.server.to(`messages:conversation:${id}`).emit('conversation:read', receipt);
    return receipt;
  }

  @Post('conversations/:id/members')
  async addMember(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: AddConversationMemberDto,
  ) {
    const conversation = await this.messages.addMember(userId, id, body.username);
    await this.gateway.syncConversationRooms(id);
    return conversation;
  }

  @Delete('conversations/:id/members/:memberId')
  async removeMember(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    const result = await this.messages.removeMember(userId, id, memberId);
    this.gateway.emitConversationChanged(id);
    return result;
  }

  @Patch('conversations/:id/members/:memberId')
  async updateMemberRole(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() body: UpdateConversationMemberDto,
  ) {
    const conversation = await this.messages.updateMemberRole(userId, id, memberId, body.role);
    this.gateway.emitConversationChanged(id);
    return conversation;
  }

  @Get('conversations/:id/invites')
  listInvites(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.messages.listInvites(userId, id);
  }

  @Post('conversations/:id/invites')
  createInvite(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: CreateGroupInviteDto,
  ) {
    return this.messages.createInvite(userId, id, body);
  }

  @Delete('conversations/:id/invites/:code')
  revokeInvite(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Param('code') code: string,
  ) {
    return this.messages.revokeInvite(userId, id, code);
  }

  @Public()
  @Get('invites/:code')
  previewInvite(@Param('code') code: string) {
    return this.messages.previewInvite(code);
  }

  @Post('invites/:code/join')
  async joinInvite(@CurrentUser('id') userId: string, @Param('code') code: string) {
    const conversation = await this.messages.joinInvite(userId, code);
    await this.gateway.syncConversationRooms(conversation.id);
    return conversation;
  }

  @Get('privacy')
  getPrivacy(@CurrentUser('id') userId: string) {
    return this.messages.getPrivacy(userId);
  }

  @Patch('privacy')
  updatePrivacy(@CurrentUser('id') userId: string, @Body() body: UpdateDirectMessagePrivacyDto) {
    return this.messages.updatePrivacy(userId, body.policy);
  }

  @Get('gift-fee/:username')
  giftFee(@CurrentUser('id') userId: string, @Param('username') username: string) {
    return this.messages.giftFee(userId, username);
  }
}
