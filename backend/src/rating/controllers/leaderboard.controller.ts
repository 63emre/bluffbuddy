/**
 * ==========================================================
 * LEADERBOARD CONTROLLER
 * ==========================================================
 * BluffBuddy Online - Leaderboard HTTP Endpoints
 *
 * @owner DEV3 (Social/Data) + DEV2 (Rating)
 * @version v0.2.0
 *
 * CONTROLLER RESPONSIBILITIES:
 * - Global ELO leaderboard
 * - Weekly/Seasonal leaderboards
 * - Player rank lookup
 * - Match history
 *
 * LEADERBOARD TYPES:
 * - Global: All-time ELO rankings
 * - Weekly: Resets every Monday
 * - Friends: Leaderboard among friends
 * ==========================================================
 */

import {
  Controller,
  Get,
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
  ApiProperty,
} from '@nestjs/swagger';
import { DI_TOKENS } from '@contracts';

// ============================================
// RESPONSE DTOs
// ============================================

class LeaderboardEntryResponse {
  @ApiProperty({ example: 1 })
  rank!: number;

  @ApiProperty({ example: 'abc123' })
  uid!: string;

  @ApiProperty({ example: 'BluffKing' })
  nickname!: string;

  @ApiProperty({ example: 'avatar_01' })
  avatarId!: string;

  @ApiProperty({ example: 1850 })
  elo!: number;

  @ApiProperty({ example: 'Diamond' })
  tier!: string;

  @ApiProperty({ example: 42 })
  gamesPlayed!: number;

  @ApiProperty({ example: 65.2 })
  winRate!: number;
}

class LeaderboardResponse {
  @ApiProperty({ enum: ['global', 'weekly', 'friends'], example: 'global' })
  type!: 'global' | 'weekly' | 'friends';

  @ApiProperty({ example: '2026-W06', nullable: true })
  period!: string | null;

  @ApiProperty({ type: [LeaderboardEntryResponse] })
  entries!: LeaderboardEntryResponse[];

  @ApiProperty({ type: () => LeaderboardEntryResponse, nullable: true })
  currentUserRank!: LeaderboardEntryResponse | null;

  @ApiProperty({ example: '2026-02-05T12:00:00Z' })
  updatedAt!: string;
}

class PlayerRankResponse {
  @ApiProperty({ example: 1234 })
  globalRank!: number;

  @ApiProperty({ example: 50000 })
  totalPlayers!: number;

  @ApiProperty({ example: 2.5 })
  percentile!: number;

  @ApiProperty({ example: 1650 })
  elo!: number;

  @ApiProperty({ example: 'Gold' })
  tier!: string;

  @ApiProperty({ example: 75 })
  tierProgress!: number;

  @ApiProperty({ example: 1700 })
  nextTierElo!: number;
}

class OpponentDto {
  @ApiProperty({ example: 'user_123' })
  uid!: string;

  @ApiProperty({ example: 'Opponent1' })
  nickname!: string;

  @ApiProperty({ example: 1500 })
  elo!: number;
}

class MatchHistoryEntryResponse {
  @ApiProperty({ example: 'match_abc123' })
  matchId!: string;

  @ApiProperty({ enum: ['win', 'loss', 'draw'], example: 'win' })
  result!: 'win' | 'loss' | 'draw';

  @ApiProperty({ example: 25 })
  eloChange!: number;

  @ApiProperty({ example: 1 })
  placement!: number;

  @ApiProperty({ type: [OpponentDto] })
  opponents!: OpponentDto[];

  @ApiProperty({ example: '2026-02-05T10:30:00Z' })
  playedAt!: string;

  @ApiProperty({ example: 420 })
  duration!: number;
}

class PaginationDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 100 })
  total!: number;

  @ApiProperty({ example: true })
  hasMore!: boolean;
}

class MatchStatsDto {
  @ApiProperty({ example: 100 })
  totalGames!: number;

  @ApiProperty({ example: 60 })
  wins!: number;

  @ApiProperty({ example: 40 })
  losses!: number;

  @ApiProperty({ example: 60.0 })
  winRate!: number;

  @ApiProperty({ example: 1.8 })
  avgPlacement!: number;
}

class MatchHistoryResponse {
  @ApiProperty({ type: [MatchHistoryEntryResponse] })
  matches!: MatchHistoryEntryResponse[];

  @ApiProperty({ type: () => PaginationDto })
  pagination!: PaginationDto;

  @ApiProperty({ type: () => MatchStatsDto })
  stats!: MatchStatsDto;
}

// ============================================
// CONTROLLER
// ============================================

@ApiTags('Rating')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(
    @Inject(DI_TOKENS.ELO_SERVICE) private readonly eloService: unknown,
    @Inject(DI_TOKENS.LEADERBOARD_REPOSITORY)
    private readonly leaderboardRepo: unknown,
  ) {}

  @Get('global')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get global leaderboard',
    description: 'Returns the top players by all-time ELO rating.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 100 })
  @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
  @ApiResponse({
    status: 200,
    description: 'Global leaderboard retrieved',
    type: LeaderboardResponse,
  })
  async getGlobalLeaderboard(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<LeaderboardResponse> {
    // TODO: Implement global leaderboard
    throw new Error('Not implemented - LEADERBOARD_GLOBAL');
  }

  @Get('weekly')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get weekly leaderboard',
    description:
      'Returns the top players for the current week (resets Monday 00:00 UTC).',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 100 })
  @ApiQuery({
    name: 'week',
    required: false,
    type: String,
    example: '2026-W06',
  })
  @ApiResponse({
    status: 200,
    description: 'Weekly leaderboard retrieved',
    type: LeaderboardResponse,
  })
  async getWeeklyLeaderboard(
    @Query('limit') limit?: number,
    @Query('week') week?: string,
  ): Promise<LeaderboardResponse> {
    // TODO: Implement weekly leaderboard
    throw new Error('Not implemented - LEADERBOARD_WEEKLY');
  }

  @Get('friends')
  @ApiBearerAuth('firebase-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get friends leaderboard',
    description: 'Returns leaderboard of the current user and their friends.',
  })
  @ApiResponse({
    status: 200,
    description: 'Friends leaderboard retrieved',
    type: LeaderboardResponse,
  })
  async getFriendsLeaderboard(): Promise<LeaderboardResponse> {
    // TODO: Implement friends leaderboard
    throw new Error('Not implemented - LEADERBOARD_FRIENDS');
  }

  @Get('rank/:uid')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get player rank',
    description: 'Returns detailed rank information for a specific player.',
  })
  @ApiParam({ name: 'uid', description: 'Player UID', example: 'abc123' })
  @ApiResponse({
    status: 200,
    description: 'Player rank retrieved',
    type: PlayerRankResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Player not found',
  })
  async getPlayerRank(@Param('uid') uid: string): Promise<PlayerRankResponse> {
    // TODO: Implement player rank
    throw new Error('Not implemented - LEADERBOARD_RANK');
  }

  @Get('history/:uid')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get match history',
    description: 'Returns paginated match history for a player.',
  })
  @ApiParam({ name: 'uid', description: 'Player UID', example: 'abc123' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Match history retrieved',
    type: MatchHistoryResponse,
  })
  async getMatchHistory(
    @Param('uid') uid: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<MatchHistoryResponse> {
    // TODO: Implement match history
    throw new Error('Not implemented - LEADERBOARD_HISTORY');
  }
}
