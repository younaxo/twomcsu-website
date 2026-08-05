import {
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  BlockedUserItem,
  FriendListItem,
  FriendRequestItem,
  FriendsCountResponse,
  FriendshipStatusResponse,
  PaginatedResponse,
} from '@twomc/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FriendsService } from './friends.service';

@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(private readonly friends: FriendsService) {}

  @Post('request/:username')
  @Throttle({ default: { limit: 20, ttl: 3_600_000 } })
  @HttpCode(HttpStatus.CREATED)
  sendRequest(
    @CurrentUser('id') userId: string,
    @Param('username') username: string,
  ): Promise<FriendRequestItem> {
    return this.friends.sendRequest(userId, username);
  }

  @Post('accept/:requestId')
  @Throttle({ default: { limit: 60, ttl: 3_600_000 } })
  acceptRequest(
    @CurrentUser('id') userId: string,
    @Param('requestId') requestId: string,
  ): Promise<FriendListItem> {
    return this.friends.acceptRequest(userId, requestId);
  }

  @Post('reject/:requestId')
  @HttpCode(HttpStatus.NO_CONTENT)
  rejectRequest(
    @CurrentUser('id') userId: string,
    @Param('requestId') requestId: string,
  ): Promise<void> {
    return this.friends.rejectRequest(userId, requestId);
  }

  @Delete('requests/:requestId')
  @HttpCode(HttpStatus.NO_CONTENT)
  cancelRequest(
    @CurrentUser('id') userId: string,
    @Param('requestId') requestId: string,
  ): Promise<void> {
    return this.friends.cancelRequest(userId, requestId);
  }

  @Delete('block/:username')
  @HttpCode(HttpStatus.NO_CONTENT)
  unblockUser(
    @CurrentUser('id') userId: string,
    @Param('username') username: string,
  ): Promise<void> {
    return this.friends.unblockUser(userId, username);
  }

  @Post('block/:username')
  @Throttle({ default: { limit: 30, ttl: 3_600_000 } })
  @HttpCode(HttpStatus.CREATED)
  blockUser(
    @CurrentUser('id') userId: string,
    @Param('username') username: string,
  ): Promise<BlockedUserItem> {
    return this.friends.blockUser(userId, username);
  }

  @Delete(':username')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeFriend(
    @CurrentUser('id') userId: string,
    @Param('username') username: string,
  ): Promise<void> {
    return this.friends.removeFriend(userId, username);
  }

  @Get()
  getFriends(
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ): Promise<PaginatedResponse<FriendListItem>> {
    return this.friends.getFriendsList(userId, page, limit, search);
  }

  @Get('requests/incoming')
  getIncoming(
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<PaginatedResponse<FriendRequestItem>> {
    return this.friends.getIncomingRequests(userId, page, limit);
  }

  @Get('requests/incoming/count')
  getIncomingCount(@CurrentUser('id') userId: string): Promise<FriendsCountResponse> {
    return this.friends.getIncomingCount(userId);
  }

  @Get('requests/outgoing')
  getOutgoing(
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<PaginatedResponse<FriendRequestItem>> {
    return this.friends.getOutgoingRequests(userId, page, limit);
  }

  @Get('blocked')
  getBlocked(
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<PaginatedResponse<BlockedUserItem>> {
    return this.friends.getBlockedUsers(userId, page, limit);
  }

  @Get('status/:username')
  getStatus(
    @CurrentUser('id') userId: string,
    @Param('username') username: string,
  ): Promise<FriendshipStatusResponse> {
    return this.friends.getFriendshipStatus(userId, username);
  }

  @Get('count')
  getMyCount(@CurrentUser('id') userId: string): Promise<FriendsCountResponse> {
    return this.friends.getFriendsCount(userId);
  }

  @Public()
  @Get('count/:username')
  getCountByUsername(@Param('username') username: string): Promise<FriendsCountResponse> {
    return this.friends.getFriendsCountByUsername(username);
  }
}
