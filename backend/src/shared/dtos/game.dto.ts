/**
 * ==========================================================
 * GAME DTOs (Data Transfer Objects)
 * ==========================================================
 * BluffBuddy Online - Validated Request/Response Objects
 *
 * @owner DEV1 (Gateway) + DEV2 (Game Engine)
 * @version v0.1.0
 * @see docs/v0.1.0/05-Networking.md - Section 3.4
 *
 * These DTOs use class-validator decorators for automatic
 * payload validation in NestJS gateways and controllers.
 * ==========================================================
 */

import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { CardSuit, CardRank, RoomType, MatchType } from '../contracts';

// ============================================================
// ROOM DTOs
// ============================================================

/**
 * Create Room Request DTO
 * @event room:create
 */
export class CreateRoomDto {
  @IsEnum(RoomType)
  type!: RoomType;
}

/**
 * Join Room Request DTO
 * @event room:join
 */
export class JoinRoomDto {
  @IsOptional()
  @IsString()
  roomId?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z0-9]{6}$/, { message: 'Invalid invite code format' })
  inviteCode?: string;
}

// ============================================================
// GAME ACTION DTOs
// ============================================================

/**
 * Play Card Request DTO
 * @event game:play
 */
export class PlayCardDto {
  @IsString()
  @Matches(/^([2-9JQKA]|10)-(hearts|diamonds|clubs|spades)$/, {
    message: 'Invalid card ID format. Expected: "rank-suit" (e.g., "Q-hearts")',
  })
  cardId!: string;
}

/**
 * Select Target Request DTO
 * When multiple match targets exist, player must choose
 * @event game:select_target
 */
export class SelectTargetDto {
  @IsString()
  @Matches(/^(center|pool|penalty)$/)
  zone!: 'center' | 'pool' | 'penalty';

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(3)
  slotIndex?: number;
}

// ============================================================
// MATCHMAKING DTOs
// ============================================================

/**
 * Queue for Match Request DTO
 * @event match:queue
 */
export class QueueMatchDto {
  @IsEnum(MatchType)
  matchType!: MatchType;

  @IsOptional()
  @IsString()
  partyId?: string;
}

// ============================================================
// CHAT DTOs
// ============================================================

/**
 * Quick Chat Message DTO
 * Predefined messages only (no free text in v0.1.0)
 * @event chat:quick
 */
export class QuickChatDto {
  @IsString()
  @Matches(/^(greeting|good_luck|well_played|oops|thanks|gg)$/, {
    message: 'Invalid quick chat message ID',
  })
  messageId!: string;
}

/**
 * Emoji Reaction DTO
 * @event chat:emoji
 */
export class EmojiReactionDto {
  @IsString()
  @Matches(/^(laugh|cry|angry|thinking|fire|clap)$/, {
    message: 'Invalid emoji ID',
  })
  emoji!: string;

  @IsOptional()
  @IsString()
  targetPlayerId?: string;
}

// ============================================================
// AUTH DTOs
// ============================================================

/**
 * Auth Verify DTO
 * @event auth:verify
 */
export class AuthVerifyDto {
  @IsString()
  token!: string;
}

// ============================================================
// RESPONSE DTOs (Type aliases for documentation)
// ============================================================

/**
 * Card DTO (for responses)
 */
export interface CardDto {
  id: string;
  suit: CardSuit;
  rank: CardRank;
}

/**
 * Player State DTO (opponent view)
 */
export interface PlayerStateDto {
  id: string;
  nickname: string;
  cardCount: number;
  isConnected: boolean;
  seatIndex: number;
}

/**
 * Penalty Slot DTO
 */
export interface PenaltySlotDto {
  playerId: string;
  topCards: CardDto[];
  buriedCount: number;
  isSealed: boolean;
}
