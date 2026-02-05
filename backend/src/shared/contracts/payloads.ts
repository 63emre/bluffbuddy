/**
 * ==========================================================
 * PAYLOAD INTERFACES
 * ==========================================================
 * BluffBuddy Online - Socket.io Payload Definitions
 *
 * @owner DEV1 (Infrastructure) + DEV2 (Game)
 * @version v0.2.0
 * @see docs/v0.1.0/05-Networking.md - Section 3.4
 *
 * RULES:
 * 1. Client → Server payloads are request-like (inputs)
 * 2. Server → Client payloads are response-like (outputs)
 * 3. All payloads should be validated with DTOs
 * ==========================================================
 */

import { ErrorCode, MatchType, RoomType, PlayResult, CardRank } from './enums';
import {
  ICard,
  IClientPlayerState,
  IMatchLocation,
  IPlayerMatchResult,
} from './entities';

// ============================================
// CLIENT → SERVER PAYLOADS
// ============================================

/**
 * Play a card from hand
 */
export interface PlayCardPayload {
  readonly cardId: string;
}

/**
 * Select a target when multiple matches exist
 */
export interface SelectTargetPayload {
  readonly zone: 'center' | 'pool' | 'penalty';
  readonly ownerId?: string;
  readonly slotIndex?: number;
}

/**
 * Create a new room
 */
export interface CreateRoomPayload {
  readonly type: RoomType;
}

/**
 * Join an existing room
 */
export interface JoinRoomPayload {
  readonly roomId?: string;
  readonly inviteCode?: string;
}

/**
 * Join matchmaking queue
 */
export interface QueueMatchPayload {
  readonly matchType: MatchType;
  readonly partyId?: string;
}

/**
 * Send a quick chat message
 */
export interface QuickChatPayload {
  /** Predefined message ID */
  readonly messageId: string;
}

/**
 * Send an emoji reaction
 */
export interface EmojiReactionPayload {
  readonly emoji: string;
  readonly targetPlayerId?: string;
}

// ============================================
// SERVER → CLIENT PAYLOADS
// ============================================

/**
 * Connection successful
 */
export interface ConnectedPayload {
  readonly userId: string;
  readonly serverTime: string;
}

/**
 * Error response
 */
export interface ErrorPayload {
  readonly code: ErrorCode;
  readonly message?: string;
  readonly timestamp: string;
  readonly details?: Record<string, unknown>;
}

/**
 * Room created successfully
 */
export interface RoomCreatedPayload {
  readonly roomId: string;
  readonly inviteCode: string;
}

/**
 * Player joined room
 */
export interface RoomJoinedPayload {
  readonly roomId: string;
  readonly players: IClientPlayerState[];
  readonly hostId: string;
}

/**
 * Game starting
 */
export interface GameStartPayload {
  readonly roomId: string;
  readonly players: IClientPlayerState[];
  readonly turnOrder: string[];
  readonly firstPlayerId: string;
}

/**
 * Card was played
 */
export interface CardPlayedPayload {
  readonly playerId: string;
  readonly card: ICard;
  readonly result: PlayResult;
  readonly matchedFrom?: IMatchLocation;
  readonly targetPlayerId?: string;
  readonly newPoolTopCard?: ICard | null;
}

/**
 * Stack was sealed (Mühür)
 */
export interface SealPayload {
  readonly playerId: string;
  readonly sealedRank: CardRank;
  readonly stackSize: number;
  readonly lockedPoints: number;
}

/**
 * Round ended
 */
export interface RoundEndPayload {
  readonly roundNumber: number;
  readonly scores: { playerId: string; penaltyPoints: number }[];
  readonly nextRound?: number;
}

/**
 * Game ended
 */
export interface GameEndPayload {
  readonly matchId: string;
  readonly duration: number;
  readonly results: IPlayerMatchResult[];
}

/**
 * Awaiting target selection from player
 */
export interface AwaitingTargetPayload {
  readonly playerId: string;
  readonly card: ICard;
  readonly validTargets: IMatchLocation[];
  readonly timeoutSeconds: number;
}

/**
 * Match found in queue
 */
export interface MatchFoundPayload {
  readonly roomId: string;
  readonly players: IClientPlayerState[];
  readonly countdown: number;
}

/**
 * Turn notification
 */
export interface TurnPayload {
  readonly playerId: string;
  readonly turnNumber: number;
  readonly timeRemaining: number;
}

/**
 * Player status change in room
 */
export interface PlayerStatusPayload {
  readonly playerId: string;
  readonly status:
    | 'joined'
    | 'left'
    | 'ready'
    | 'not_ready'
    | 'disconnected'
    | 'reconnected';
  readonly timestamp: string;
}
