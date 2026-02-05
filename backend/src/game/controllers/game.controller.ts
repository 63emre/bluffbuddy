/**
 * ==========================================================
 * GAME CONTROLLER
 * ==========================================================
 * BluffBuddy Online - Game HTTP Endpoints
 *
 * @owner DEV2 (Game Engine)
 * @version v0.2.0
 *
 * CONTROLLER RESPONSIBILITIES:
 * - Room listing and discovery
 * - Quick match initiation
 * - Game replay retrieval
 *
 * NOTE: Real-time game operations use WebSocket (GameGateway).
 * This controller handles HTTP-based queries and initiations.
 * ==========================================================
 */

import {
  Controller,
  Get,
  Post,
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

class QuickMatchRequest {
  @ApiProperty({ enum: ['casual', 'ranked'], example: 'ranked' })
  matchType!: 'casual' | 'ranked';

  @ApiProperty({
    type: [String],
    required: false,
    example: ['eu-west', 'us-east'],
  })
  regions?: string[];
}

class CreateRoomRequest {
  @ApiProperty({ enum: ['public', 'private'], example: 'private' })
  visibility!: 'public' | 'private';

  @ApiProperty({ minimum: 2, maximum: 4, example: 4 })
  maxPlayers!: number;

  @ApiProperty({ required: false, example: 'Friends Only' })
  name?: string;

  @ApiProperty({ required: false, example: 'secret123' })
  password?: string;
}

// ============================================
// RESPONSE DTOs
// ============================================

class PlayerInfoDto {
  @ApiProperty({ example: 'user_123' })
  uid!: string;

  @ApiProperty({ example: 'Player1' })
  nickname!: string;

  @ApiProperty({ example: 'avatar_01' })
  avatarId!: string;

  @ApiProperty({ example: true })
  isReady!: boolean;
}

class RoomSettingsDto {
  @ApiProperty({ enum: ['public', 'private'] })
  visibility!: 'public' | 'private';

  @ApiProperty({ example: 4 })
  maxPlayers!: number;

  @ApiProperty({ example: false })
  hasPassword!: boolean;
}

class RoomInfoResponse {
  @ApiProperty({ example: 'room_abc123' })
  roomId!: string;

  @ApiProperty({ example: 'ABCD12' })
  roomCode!: string;

  @ApiProperty({ example: 'Casual Game' })
  name!: string;

  @ApiProperty({ type: () => ({ uid: String, nickname: String }) })
  host!: { uid: string; nickname: string };

  @ApiProperty({ type: [PlayerInfoDto] })
  players!: PlayerInfoDto[];

  @ApiProperty({ type: () => RoomSettingsDto })
  settings!: RoomSettingsDto;

  @ApiProperty({ enum: ['waiting', 'starting', 'in_game'] })
  status!: 'waiting' | 'starting' | 'in_game';

  @ApiProperty({ example: '2026-02-05T10:00:00Z' })
  createdAt!: string;
}

class PaginationDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 100 })
  total!: number;
}

class RoomListResponse {
  @ApiProperty({ type: [RoomInfoResponse] })
  rooms!: RoomInfoResponse[];

  @ApiProperty({ type: () => PaginationDto })
  pagination!: PaginationDto;
}

class QuickMatchResponse {
  @ApiProperty({ example: true })
  found!: boolean;

  @ApiProperty({ required: false, example: 15 })
  estimatedWaitTime?: number;

  @ApiProperty({ required: false, example: 5 })
  queuePosition?: number;

  @ApiProperty({ required: false, type: () => RoomInfoResponse })
  room?: RoomInfoResponse;
}

class TurnDataDto {
  @ApiProperty({ example: 1 })
  turnNumber!: number;

  @ApiProperty({ example: 'user_123' })
  playerId!: string;

  @ApiProperty({ example: 'play_card' })
  action!: string;

  @ApiProperty({ example: 1707130800000 })
  timestamp!: number;
}

class PlayerResultDto {
  @ApiProperty({ example: 'user_123' })
  uid!: string;

  @ApiProperty({ example: 'Player1' })
  nickname!: string;

  @ApiProperty({ example: 150 })
  finalScore!: number;

  @ApiProperty({ example: 1 })
  placement!: number;
}

class GameReplayResponse {
  @ApiProperty({ example: 'match_abc123' })
  matchId!: string;

  @ApiProperty({ type: [PlayerResultDto] })
  players!: PlayerResultDto[];

  @ApiProperty({ example: 420 })
  duration!: number;

  @ApiProperty({ type: [TurnDataDto] })
  turns!: TurnDataDto[];

  @ApiProperty({ example: '2026-02-05T10:00:00Z' })
  playedAt!: string;
}

// ============================================
// CONTROLLER
// ============================================

@ApiTags('Game')
@ApiBearerAuth('firebase-auth')
@Controller('game')
export class GameController {
  constructor(
    @Inject(DI_TOKENS.ROOM_SERVICE) private readonly roomService: unknown,
    @Inject(DI_TOKENS.MATCHMAKING_SERVICE)
    private readonly matchmakingService: unknown,
  ) {}

  @Get('rooms')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List public rooms',
    description: 'Returns a list of public rooms that can be joined.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'status', required: false, enum: ['waiting', 'starting'] })
  @ApiResponse({
    status: 200,
    description: 'Room list retrieved',
    type: RoomListResponse,
  })
  async listRooms(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ): Promise<RoomListResponse> {
    // TODO: Implement room listing
    throw new Error('Not implemented - GAME_LIST_ROOMS');
  }

  @Get('rooms/:roomCode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get room by code',
    description:
      'Returns room information by room code (for joining via link).',
  })
  @ApiParam({ name: 'roomCode', description: 'Room code', example: 'ABCD12' })
  @ApiResponse({
    status: 200,
    description: 'Room found',
    type: RoomInfoResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Room not found',
  })
  async getRoomByCode(
    @Param('roomCode') roomCode: string,
  ): Promise<RoomInfoResponse> {
    // TODO: Implement room lookup
    throw new Error('Not implemented - GAME_GET_ROOM');
  }

  @Post('rooms')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a room',
    description: `
Creates a new game room. The creator becomes the host.

**Note:** After creating a room, connect to the WebSocket gateway
to receive real-time updates about players joining.
    `,
  })
  @ApiBody({ type: CreateRoomRequest })
  @ApiResponse({
    status: 201,
    description: 'Room created',
    type: RoomInfoResponse,
  })
  async createRoom(@Body() dto: CreateRoomRequest): Promise<RoomInfoResponse> {
    // TODO: Implement room creation
    throw new Error('Not implemented - GAME_CREATE_ROOM');
  }

  @Post('quick-match')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Start quick match',
    description: `
Initiates matchmaking to find a game.

**Flow:**
1. Client calls this endpoint to enter the queue
2. Server attempts to find a match immediately
3. If match found, returns room info
4. If not found, returns queue position and estimated wait
5. Client connects to WebSocket to receive match notification

**WebSocket Event:**
When a match is found, client receives 'match:found' event.
    `,
  })
  @ApiBody({ type: QuickMatchRequest })
  @ApiResponse({
    status: 200,
    description: 'Matchmaking started',
    type: QuickMatchResponse,
  })
  async quickMatch(
    @Body() dto: QuickMatchRequest,
  ): Promise<QuickMatchResponse> {
    // TODO: Implement quick match
    throw new Error('Not implemented - GAME_QUICK_MATCH');
  }

  @Post('quick-match/cancel')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Cancel matchmaking',
    description: 'Removes the player from the matchmaking queue.',
  })
  @ApiResponse({
    status: 204,
    description: 'Matchmaking cancelled',
  })
  async cancelQuickMatch(): Promise<void> {
    // TODO: Implement cancel matchmaking
    throw new Error('Not implemented - GAME_CANCEL_MATCH');
  }

  @Get('replay/:matchId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get game replay',
    description: 'Returns replay data for a completed match.',
  })
  @ApiParam({
    name: 'matchId',
    description: 'Match ID',
    example: 'match_abc123',
  })
  @ApiResponse({
    status: 200,
    description: 'Replay retrieved',
    type: GameReplayResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Match not found',
  })
  async getReplay(
    @Param('matchId') matchId: string,
  ): Promise<GameReplayResponse> {
    // TODO: Implement replay retrieval
    throw new Error('Not implemented - GAME_GET_REPLAY');
  }
}
