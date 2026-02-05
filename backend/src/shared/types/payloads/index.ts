/**
 * ==========================================================
 * SOCKET PAYLOAD INTERFACES
 * ==========================================================
 * BluffBuddy Online - Client ↔ Server Payload Definitions
 *
 * @owner DEV1 (Infrastructure) + DEV2 (Game Engine)
 * @iteration v0.1.0
 * @see docs/v0.1.0/05-Networking.md - Section 3.4
 * @see docs/GameLogic.md - Section 10 (DTO Yapıları)
 *
 * DEV RESPONSIBILITIES:
 * - DEV1: Auth, Error, and Connection payloads
 * - DEV2: Game and Room payloads
 * - DEV3: Social and Chat payloads
 * ==========================================================
 */

// ----------------------------------------------------------
// ITERATION v0.1.0 - Base payload interfaces from docs
// TODO v0.1.1: Add payload validation decorators
// TODO v0.2.0: Add binary payload support for optimization
// ----------------------------------------------------------

import { Card } from '../game/card.interface';
import {
  PublicPlayerState,
  PlayerGameResult,
  Player,
} from '../game/player.interface';
import { RoomState, ClientGameView, TurnState } from '../game/state.interface';
import {
  GamePhase,
  RoomType,
  MatchType,
  MatchZone,
  PlayResult,
} from '../game/enums';

// ============================================================
// AUTHENTICATION PAYLOADS
// @owner DEV1
// ============================================================

/**
 * Auth Verify Payload (Client → Server)
 *
 * @example
 * ```json
 * {
 *   "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 * ```
 */
export interface AuthVerifyPayload {
  /** Firebase ID token */
  token: string;
}

/**
 * Auth Verified Response (Server → Client)
 *
 * @example
 * ```json
 * {
 *   "userId": "abc123xyz",
 *   "nickname": "BluffMaster"
 * }
 * ```
 */
export interface AuthVerifiedPayload {
  /** Authenticated user ID */
  userId: string;
  /** User's nickname */
  nickname: string;
}

// ============================================================
// CONNECTION PAYLOADS
// @owner DEV1
// ============================================================

/**
 * Connected Payload (Server → Client)
 *
 * @example
 * ```json
 * {
 *   "userId": "abc123xyz",
 *   "serverTime": "2026-02-04T15:30:00.000Z"
 * }
 * ```
 */
export interface ConnectedPayload {
  /** User ID */
  userId: string;
  /** Server timestamp for clock sync */
  serverTime: string;
}

/**
 * Error Payload (Server → Client)
 *
 * @example
 * ```json
 * {
 *   "code": "ERR_NOT_YOUR_TURN",
 *   "message": "Sıra sizde değil",
 *   "timestamp": "2026-02-04T15:30:00.000Z",
 *   "details": { "currentPlayerId": "player456" }
 * }
 * ```
 */
export interface ErrorPayload {
  /** Error code (e.g., "ERR_NOT_YOUR_TURN") */
  code: string;
  /** Human-readable message */
  message?: string;
  /** Server timestamp */
  timestamp: string;
  /** Additional error details */
  details?: Record<string, unknown>;
}

/**
 * Kicked Payload (Server → Client)
 *
 * @example
 * ```json
 * {
 *   "reason": "AFK timeout"
 * }
 * ```
 */
export interface KickedPayload {
  /** Kick reason */
  reason: string;
}

// ============================================================
// ROOM PAYLOADS
// @owner DEV2
// ============================================================

/**
 * Create Room Payload (Client → Server)
 *
 * @example
 * ```json
 * {
 *   "type": "private"
 * }
 * ```
 */
export interface CreateRoomPayload {
  /** Room type */
  type: RoomType;
}

/**
 * Join Room Payload (Client → Server)
 *
 * @example
 * ```json
 * {
 *   "roomId": "room_abc123"
 * }
 * ```
 */
export interface JoinRoomPayload {
  /** Room ID or invite code */
  roomId: string;
}

/**
 * Room Created Payload (Server → Client)
 *
 * @example
 * ```json
 * {
 *   "roomId": "room_abc123",
 *   "inviteCode": "BLUFF42"
 * }
 * ```
 */
export interface RoomCreatedPayload {
  /** Created room ID */
  roomId: string;
  /** Invite code (for private rooms) */
  inviteCode?: string;
}

/**
 * Room Joined Payload (Server → Client)
 *
 * @example
 * ```json
 * {
 *   "roomId": "room_abc123",
 *   "inviteCode": "BLUFF42",
 *   "type": "private",
 *   "hostId": "player123",
 *   "players": [
 *     { "id": "player123", "nickname": "Host", "cardCount": 0, "isReady": true, "connectionStatus": "connected", "penaltySlot": { "topCards": [], "buriedCount": 0, "isSealed": false }, "seatIndex": 0 }
 *   ],
 *   "maxPlayers": 4,
 *   "createdAt": "2026-02-04T15:30:00.000Z"
 * }
 * ```
 */
export interface RoomJoinedPayload extends RoomState {}

/**
 * Player Joined Room Payload (Server → Client)
 *
 * @example
 * ```json
 * {
 *   "player": {
 *     "id": "player456",
 *     "nickname": "NewPlayer",
 *     "cardCount": 0,
 *     "isReady": false,
 *     "connectionStatus": "connected",
 *     "penaltySlot": { "topCards": [], "buriedCount": 0, "isSealed": false },
 *     "seatIndex": 1
 *   }
 * }
 * ```
 */
export interface PlayerJoinedPayload {
  /** Player who joined */
  player: PublicPlayerState;
}

/**
 * Player Left Room Payload (Server → Client)
 *
 * @example
 * ```json
 * {
 *   "playerId": "player456",
 *   "reason": "disconnected"
 * }
 * ```
 */
export interface PlayerLeftPayload {
  /** ID of player who left */
  playerId: string;
  /** Reason for leaving */
  reason?: 'left' | 'kicked' | 'disconnected';
}

/**
 * Player Ready Status Changed Payload (Server → Client)
 *
 * @example
 * ```json
 * {
 *   "playerId": "player456",
 *   "ready": true
 * }
 * ```
 */
export interface PlayerReadyPayload {
  /** Player ID */
  playerId: string;
  /** New ready status */
  ready: boolean;
}

// ============================================================
// GAME PAYLOADS
// @owner DEV2
// ============================================================

/**
 * Play Card Payload (Client → Server)
 *
 * @example
 * ```json
 * {
 *   "cardId": "Q-hearts",
 *   "targetSlotOwnerId": "player789"
 * }
 * ```
 */
export interface PlayCardPayload {
  /** Card ID to play (e.g., "Q-hearts") */
  cardId: string;
  /** Optional: Direct penalty to specific player */
  targetSlotOwnerId?: string;
}

/**
 * Select Target Payload (Client → Server)
 * Used when multiple penalty targets are available
 *
 * @example
 * ```json
 * {
 *   "playerId": "player789"
 * }
 * ```
 */
export interface SelectTargetPayload {
  /** Target player ID */
  playerId: string;
}

/**
 * Game Start Payload (Server → Client)
 *
 * @example
 * ```json
 * {
 *   "gameState": {
 *     "roomId": "room_abc123",
 *     "phase": "dealing",
 *     "round": { "roundNumber": 1, "dealPhase": 1, "cardsPlayedThisRound": 0 },
 *     "myHand": [{ "id": "Q-hearts", "suit": "hearts", "rank": "Q" }],
 *     "myIndex": 0,
 *     "openCenter": { "cards": [{ "id": "K-spades", "suit": "spades", "rank": "K" }, null, null, null] },
 *     "poolTopCard": null,
 *     "players": [],
 *     "turn": { "currentPlayerId": "player123", "timeRemaining": 30, "turnStartedAt": "2026-02-04T15:30:00.000Z", "isAwaitingTarget": false },
 *     "serverTime": "2026-02-04T15:30:00.000Z"
 *   }
 * }
 * ```
 */
export interface GameStartPayload {
  /** Initial game state view */
  gameState: ClientGameView;
}

/**
 * Game State Update Payload (Server → Client)
 * @see GameStartPayload for example structure
 */
export interface GameStatePayload extends ClientGameView {}

/**
 * Turn Started Payload (Server → Client)
 *
 * @example
 * ```json
 * {
 *   "playerId": "player123",
 *   "timeLimit": 30,
 *   "serverTime": "2026-02-04T15:30:00.000Z"
 * }
 * ```
 */
export interface TurnPayload {
  /** Player whose turn it is */
  playerId: string;
  /** Time limit in seconds */
  timeLimit: number;
  /** Server timestamp */
  serverTime: string;
}

/**
 * Match Source Information
 * Describes where matched cards came from
 *
 * @example
 * ```json
 * {
 *   "zone": "penalty",
 *   "ownerId": "player456",
 *   "cards": [
 *     { "id": "J-spades", "suit": "spades", "rank": "J" },
 *     { "id": "J-hearts", "suit": "hearts", "rank": "J" }
 *   ]
 * }
 * ```
 */
export interface MatchSource {
  /** Zone type where match occurred */
  zone: MatchZone;
  /** Owner of the penalty slot (if zone is penalty) */
  ownerId?: string;
  /** Cards that matched */
  cards: Card[];
}

/**
 * Card Played Result Payload (Server → Client)
 *
 * @example
 * ```json
 * {
 *   "playerId": "player123",
 *   "card": { "id": "Q-hearts", "suit": "hearts", "rank": "Q" },
 *   "result": "match",
 *   "matchedFrom": [
 *     { "zone": "center", "cards": [{ "id": "Q-diamonds", "suit": "diamonds", "rank": "Q" }] }
 *   ],
 *   "targetPlayerId": "player456"
 * }
 * ```
 */
export interface CardPlayedPayload {
  /** Player who played the card */
  playerId: string;
  /** The card that was played */
  card: Card;
  /** Result of the play */
  result: PlayResult;
  /** Where matches came from (if any) */
  matchedFrom?: MatchSource[];
  /** Who received the penalty card (if no match) */
  targetPlayerId?: string;
}

/**
 * Match Result Payload (Server → Client)
 * Detailed match information
 *
 * @example
 * ```json
 * {
 *   "playerId": "player123",
 *   "cardsCollected": [
 *     { "id": "K-spades", "suit": "spades", "rank": "K" },
 *     { "id": "K-hearts", "suit": "hearts", "rank": "K" }
 *   ],
 *   "sources": [
 *     { "zone": "center", "cards": [{ "id": "K-spades", "suit": "spades", "rank": "K" }] },
 *     { "zone": "pool", "cards": [{ "id": "K-hearts", "suit": "hearts", "rank": "K" }] }
 *   ]
 * }
 * ```
 */
export interface MatchResultPayload {
  /** Player who made the match */
  playerId: string;
  /** Total cards collected */
  cardsCollected: Card[];
  /** Sources of matched cards */
  sources: MatchSource[];
}

/**
 * Stack Sealed Payload (Server → Client)
 * Mühür event
 *
 * @example
 * ```json
 * {
 *   "playerId": "player456",
 *   "sealedRank": "K",
 *   "stackSize": 6
 * }
 * ```
 */
export interface SealPayload {
  /** Player who sealed their stack */
  playerId: string;
  /** Rank of the sealed cards */
  sealedRank: string;
  /** Size of sealed stack */
  stackSize: number;
}

/**
 * Awaiting Target Selection Payload (Server → Client)
 * When player must choose among multiple valid targets
 *
 * @example
 * ```json
 * {
 *   "playerId": "player123",
 *   "validTargets": ["player456", "player789"],
 *   "timeLimit": 10,
 *   "serverTime": "2026-02-04T15:30:00.000Z"
 * }
 * ```
 */
export interface AwaitingTargetPayload {
  /** Player who needs to select */
  playerId: string;
  /** Valid target player IDs */
  validTargets: string[];
  /** Time to select (seconds) */
  timeLimit: number;
  /** Server timestamp */
  serverTime: string;
}

/**
 * Round End Payload (Server → Client)
 *
 * @example
 * ```json
 * {
 *   "roundNumber": 1,
 *   "scores": [
 *     { "playerId": "player123", "penaltyPoints": 14 },
 *     { "playerId": "player456", "penaltyPoints": 42 }
 *   ],
 *   "nextRound": 2
 * }
 * ```
 */
export interface RoundEndPayload {
  /** Round that ended */
  roundNumber: number;
  /** Scores after this round */
  scores: {
    playerId: string;
    penaltyPoints: number;
  }[];
  /** Next round number (null if game over) */
  nextRound: number | null;
}

/**
 * Game End Payload (Server → Client)
 *
 * @example
 * ```json
 * {
 *   "results": [
 *     { "playerId": "player123", "nickname": "Zeynep", "placement": 1, "penaltyPoints": 14, "eloChange": 25, "newElo": 1025 },
 *     { "playerId": "player456", "nickname": "Mert", "placement": 2, "penaltyPoints": 42, "eloChange": 10, "newElo": 1010 },
 *     { "playerId": "player789", "nickname": "Ali", "placement": 3, "penaltyPoints": 49, "eloChange": -5, "newElo": 995 },
 *     { "playerId": "player012", "nickname": "Ayşe", "placement": 4, "penaltyPoints": 90, "eloChange": -30, "newElo": 970 }
 *   ],
 *   "matchId": "match_xyz789",
 *   "duration": 542
 * }
 * ```
 */
export interface GameEndPayload {
  /** Final results */
  results: PlayerGameResult[];
  /** Match ID for history */
  matchId: string;
  /** Game duration in seconds */
  duration: number;
}

// ============================================================
// MATCHMAKING PAYLOADS
// @owner DEV2
// ============================================================

/**
 * Queue for Match Payload (Client → Server)
 *
 * @example
 * ```json
 * {
 *   "type": "ranked"
 * }
 * ```
 */
export interface QueueMatchPayload {
  /** Match type */
  type: MatchType;
}

/**
 * Searching Payload (Server → Client)
 *
 * @example
 * ```json
 * {
 *   "position": 12,
 *   "estimatedWait": 45
 * }
 * ```
 */
export interface SearchingPayload {
  /** Position in queue */
  position: number;
  /** Estimated wait time in seconds */
  estimatedWait?: number;
}

/**
 * Match Found Payload (Server → Client)
 *
 * @example
 * ```json
 * {
 *   "roomId": "room_matched_abc"
 * }
 * ```
 */
export interface MatchFoundPayload {
  /** Room ID to join */
  roomId: string;
}

// ============================================================
// SOCIAL PAYLOADS
// @owner DEV3
// ============================================================

/**
 * Friend Add Payload (Client → Server)
 *
 * @example
 * ```json
 * {
 *   "target": "BluffMaster"
 * }
 * ```
 */
export interface FriendAddPayload {
  /** Target user ID or nickname */
  target: string;
}

/**
 * Friend Request Received Payload (Server → Client)
 *
 * @example
 * ```json
 * {
 *   "requestId": "req_abc123",
 *   "from": { "id": "player456", "nickname": "NewFriend" },
 *   "sentAt": "2026-02-04T15:30:00.000Z"
 * }
 * ```
 */
export interface FriendRequestPayload {
  /** Request ID */
  requestId: string;
  /** Who sent the request */
  from: Player;
  /** Timestamp */
  sentAt: string;
}

/**
 * Friend Accept/Decline Payload (Client → Server)
 *
 * @example
 * ```json
 * {
 *   "requestId": "req_abc123"
 * }
 * ```
 */
export interface FriendRespondPayload {
  /** Request ID */
  requestId: string;
}

/**
 * Party Invite Payload (Client → Server)
 *
 * @example
 * ```json
 * {
 *   "userId": "player456"
 * }
 * ```
 */
export interface PartyInvitePayload {
  /** User ID to invite */
  userId: string;
}

/**
 * Party Invite Received Payload (Server → Client)
 *
 * @example
 * ```json
 * {
 *   "inviteId": "inv_xyz789",
 *   "from": { "id": "player123", "nickname": "PartyLeader" },
 *   "partyId": "party_abc123"
 * }
 * ```
 */
export interface PartyInviteReceivedPayload {
  /** Invite ID */
  inviteId: string;
  /** Who sent the invite */
  from: Player;
  /** Party ID */
  partyId: string;
}

// ============================================================
// CHAT PAYLOADS
// @owner DEV3
// ============================================================

/**
 * Chat Message Payload (Client → Server)
 *
 * @example
 * ```json
 * {
 *   "messageId": "MSG_GOOD_GAME"
 * }
 * ```
 *
 * Önceden tanımlı mesajlar:
 * - MSG_GOOD_GAME: "İyi oyunlar!"
 * - MSG_NICE_MOVE: "Güzel hamle!"
 * - MSG_WAIT: "Bekle biraz"
 * - MSG_THANKS: "Teşekkürler"
 * - MSG_SORRY: "Üzgünüm"
 */
export interface ChatMessagePayload {
  /** Quick chat message ID (predefined messages) */
  messageId: string;
}

/**
 * Chat Message Received Payload (Server → Client)
 *
 * @example
 * ```json
 * {
 *   "from": { "id": "player456", "nickname": "Opponent" },
 *   "messageId": "MSG_NICE_MOVE",
 *   "timestamp": "2026-02-04T15:30:00.000Z"
 * }
 * ```
 */
export interface ChatMessageReceivedPayload {
  /** Sender info */
  from: Player;
  /** Message ID */
  messageId: string;
  /** Timestamp */
  timestamp: string;
}

/**
 * Emoji Reaction Payload (Client → Server)
 *
 * @example
 * ```json
 * {
 *   "emojiId": "EMOJI_LAUGH"
 * }
 * ```
 */
export interface ChatReactionPayload {
  /** Emoji ID */
  emojiId: string;
}

/**
 * Emoji Reaction Received Payload (Server → Client)
 *
 * @example
 * ```json
 * {
 *   "from": { "id": "player456", "nickname": "Opponent" },
 *   "emojiId": "EMOJI_LAUGH",
 *   "timestamp": "2026-02-04T15:30:00.000Z"
 * }
 * ```
 */
export interface ChatReactionReceivedPayload {
  /** Sender info */
  from: Player;
  /** Emoji ID */
  emojiId: string;
  /** Timestamp */
  timestamp: string;
}
