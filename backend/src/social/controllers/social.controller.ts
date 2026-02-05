/**
 * ==========================================================
 * SOCIAL CONTROLLER
 * ==========================================================
 * BluffBuddy Online - Social HTTP Endpoints
 *
 * @owner DEV3 (Social)
 * @version v0.2.0
 *
 * CONTROLLER RESPONSIBILITIES:
 * - Friends list management
 * - Friend requests
 * - User search
 * - Block/report
 *
 * NOTE: Real-time social features (party, chat) use WebSocket.
 * ==========================================================
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiProperty,
} from '@nestjs/swagger';
import { DI_TOKENS } from '@contracts';

// ============================================
// REQUEST DTOs
// ============================================

class SendFriendRequestDto {
  @ApiProperty({ example: 'user_abc123', description: 'Target user UID' })
  targetUid!: string;
}

class ReportUserDto {
  @ApiProperty({ example: 'user_abc123', description: 'Reported user UID' })
  targetUid!: string;

  @ApiProperty({
    enum: ['harassment', 'cheating', 'inappropriate_name', 'other'],
    example: 'harassment',
    description: 'Report reason',
  })
  reason!: 'harassment' | 'cheating' | 'inappropriate_name' | 'other';

  @ApiProperty({ required: false, example: 'Player was being toxic in chat' })
  details?: string;

  @ApiProperty({ required: false, example: 'match_abc123' })
  matchId?: string;
}

// ============================================
// RESPONSE DTOs
// ============================================

class FriendResponse {
  @ApiProperty({ example: 'user_abc123' })
  uid!: string;

  @ApiProperty({ example: 'CoolPlayer' })
  nickname!: string;

  @ApiProperty({ example: 'avatar_01' })
  avatarId!: string;

  @ApiProperty({ enum: ['online', 'in_game', 'offline'], example: 'online' })
  status!: 'online' | 'in_game' | 'offline';

  @ApiProperty({ required: false, example: 'In casual game' })
  activity?: string;

  @ApiProperty({ example: 1500 })
  elo!: number;

  @ApiProperty({ example: '2026-02-05T10:00:00Z' })
  lastSeen!: string;
}

class FriendsListResponse {
  @ApiProperty({ type: [FriendResponse] })
  online!: FriendResponse[];

  @ApiProperty({ type: [FriendResponse] })
  offline!: FriendResponse[];

  @ApiProperty({ example: 25 })
  totalCount!: number;
}

class FriendRequestSenderDto {
  @ApiProperty({ example: 'user_abc123' })
  uid!: string;

  @ApiProperty({ example: 'CoolPlayer' })
  nickname!: string;

  @ApiProperty({ example: 'avatar_01' })
  avatarId!: string;

  @ApiProperty({ example: 1500 })
  elo!: number;
}

class FriendRequestResponse {
  @ApiProperty({ example: 'req_abc123' })
  id!: string;

  @ApiProperty({ type: () => FriendRequestSenderDto })
  from!: FriendRequestSenderDto;

  @ApiProperty({ example: '2026-02-05T10:00:00Z' })
  createdAt!: string;
}

class UserSearchResponse {
  @ApiProperty({ example: 'user_abc123' })
  uid!: string;

  @ApiProperty({ example: 'CoolPlayer' })
  nickname!: string;

  @ApiProperty({ example: 'avatar_01' })
  avatarId!: string;

  @ApiProperty({ example: 1500 })
  elo!: number;

  @ApiProperty({
    enum: ['none', 'pending_sent', 'pending_received', 'friends', 'blocked'],
    example: 'none',
  })
  friendshipStatus!:
    | 'none'
    | 'pending_sent'
    | 'pending_received'
    | 'friends'
    | 'blocked';
}

// ============================================
// CONTROLLER
// ============================================

@ApiTags('Social')
@ApiBearerAuth('firebase-auth')
@Controller('social')
export class SocialController {
  constructor(
    @Inject(DI_TOKENS.FRIEND_SERVICE) private readonly friendService: unknown,
  ) {}

  @Get('friends')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get friends list',
    description:
      "Returns the authenticated user's friends, grouped by online status.",
  })
  @ApiResponse({
    status: 200,
    description: 'Friends list retrieved',
    type: FriendsListResponse,
  })
  async getFriends(): Promise<FriendsListResponse> {
    // TODO: Implement friends list
    throw new Error('Not implemented - SOCIAL_GET_FRIENDS');
  }

  @Get('friends/requests')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get pending friend requests',
    description: 'Returns incoming friend requests.',
  })
  @ApiResponse({
    status: 200,
    description: 'Friend requests retrieved',
    type: [FriendRequestResponse],
  })
  async getFriendRequests(): Promise<FriendRequestResponse[]> {
    // TODO: Implement friend requests
    throw new Error('Not implemented - SOCIAL_GET_REQUESTS');
  }

  @Post('friends/request')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Send friend request',
    description: 'Sends a friend request to another user.',
  })
  @ApiBody({ type: SendFriendRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Friend request sent',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request (already friends, blocked, etc.)',
  })
  async sendFriendRequest(@Body() dto: SendFriendRequestDto): Promise<void> {
    // TODO: Implement send friend request
    throw new Error('Not implemented - SOCIAL_SEND_REQUEST');
  }

  @Post('friends/accept/:requestId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Accept friend request',
    description: 'Accepts an incoming friend request.',
  })
  @ApiParam({
    name: 'requestId',
    description: 'Request ID',
    example: 'req_abc123',
  })
  @ApiResponse({
    status: 200,
    description: 'Friend request accepted',
    type: FriendResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Request not found',
  })
  async acceptFriendRequest(
    @Param('requestId') requestId: string,
  ): Promise<FriendResponse> {
    // TODO: Implement accept friend request
    throw new Error('Not implemented - SOCIAL_ACCEPT_REQUEST');
  }

  @Delete('friends/reject/:requestId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Reject friend request',
    description: 'Rejects an incoming friend request.',
  })
  @ApiParam({
    name: 'requestId',
    description: 'Request ID',
    example: 'req_abc123',
  })
  @ApiResponse({
    status: 204,
    description: 'Friend request rejected',
  })
  async rejectFriendRequest(
    @Param('requestId') requestId: string,
  ): Promise<void> {
    // TODO: Implement reject friend request
    throw new Error('Not implemented - SOCIAL_REJECT_REQUEST');
  }

  @Delete('friends/:uid')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove friend',
    description: 'Removes a friend from the friends list.',
  })
  @ApiParam({ name: 'uid', description: 'Friend UID', example: 'user_abc123' })
  @ApiResponse({
    status: 204,
    description: 'Friend removed',
  })
  async removeFriend(@Param('uid') uid: string): Promise<void> {
    // TODO: Implement remove friend
    throw new Error('Not implemented - SOCIAL_REMOVE_FRIEND');
  }

  @Get('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Search users',
    description: 'Searches for users by nickname.',
  })
  @ApiQuery({ name: 'q', required: true, type: String, example: 'Cool' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Search results',
    type: [UserSearchResponse],
  })
  async searchUsers(
    @Query('q') query: string,
    @Query('limit') limit?: number,
  ): Promise<UserSearchResponse[]> {
    // TODO: Implement user search
    throw new Error('Not implemented - SOCIAL_SEARCH');
  }

  @Post('block/:uid')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Block user',
    description:
      'Blocks a user. Blocked users cannot send friend requests or be matched with.',
  })
  @ApiParam({
    name: 'uid',
    description: 'User UID to block',
    example: 'user_abc123',
  })
  @ApiResponse({
    status: 204,
    description: 'User blocked',
  })
  async blockUser(@Param('uid') uid: string): Promise<void> {
    // TODO: Implement block user
    throw new Error('Not implemented - SOCIAL_BLOCK');
  }

  @Delete('block/:uid')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Unblock user',
    description: 'Unblocks a previously blocked user.',
  })
  @ApiParam({
    name: 'uid',
    description: 'User UID to unblock',
    example: 'user_abc123',
  })
  @ApiResponse({
    status: 204,
    description: 'User unblocked',
  })
  async unblockUser(@Param('uid') uid: string): Promise<void> {
    // TODO: Implement unblock user
    throw new Error('Not implemented - SOCIAL_UNBLOCK');
  }

  @Get('blocked')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get blocked users',
    description: 'Returns the list of blocked users.',
  })
  @ApiResponse({
    status: 200,
    description: 'Blocked users list',
    type: [UserSearchResponse],
  })
  async getBlockedUsers(): Promise<UserSearchResponse[]> {
    // TODO: Implement get blocked users
    throw new Error('Not implemented - SOCIAL_GET_BLOCKED');
  }

  @Post('report')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Report user',
    description:
      'Reports a user for violations. Reports are reviewed by moderation team.',
  })
  @ApiBody({ type: ReportUserDto })
  @ApiResponse({
    status: 201,
    description: 'Report submitted',
  })
  async reportUser(@Body() dto: ReportUserDto): Promise<void> {
    // TODO: Implement report user
    throw new Error('Not implemented - SOCIAL_REPORT');
  }
}
