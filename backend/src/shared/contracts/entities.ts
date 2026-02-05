/**
 * ==========================================================
 * ENTITY INTERFACES
 * ==========================================================
 * BluffBuddy Online - Domain Entity Definitions
 *
 * @owner ALL DEVELOPERS
 * @version v0.2.0
 * @see docs/v0.1.0/03-GameEngine.md
 * @see docs/v0.1.0/04-Database.md
 *
 * RULES:
 * 1. Entities are data structures, NOT behavior
 * 2. Use readonly where appropriate for immutability
 * 3. Prefix with 'I' for interfaces
 * ==========================================================
 */

import {
  CardSuit,
  CardRank,
  CardZone,
  GamePhase,
  PlayResult,
  MatchType,
  PlayerRank,
  ConnectionStatus,
} from './enums';

// ============================================
// CARD ENTITIES
// ============================================

/**
 * Card Interface
 * @see docs/v0.1.0/03-GameEngine.md - Section 4.1
 */
export interface ICard {
  readonly id: string;
  readonly suit: CardSuit;
  readonly rank: CardRank;
}

/**
 * Card Location (Server-side tracking)
 */
export interface ICardLocation {
  zone: CardZone;
  ownerId?: string;
  position?: number;
  isAccessible: boolean;
}

/**
 * Match Location - Where a match was found
 * @see docs/v0.1.0/03-GameEngine.md - Section 5.1
 */
export interface IMatchLocation {
  zone: 'center' | 'pool' | 'penalty';
  ownerId?: string;
  cards: ICard[];
  priority: number;
}

/**
 * Penalty Stack (Server State)
 */
export interface IPenaltyStack {
  ownerId: string;
  cards: ICard[];
  isSealed: boolean;
  sealedAtIndex?: number;
}

/**
 * Seal Event - Emitted when stack is sealed
 */
export interface ISealEvent {
  playerId: string;
  sealedRank: CardRank;
  sealedCards: ICard[];
  buriedCards: ICard[];
  lockedPenaltyPoints: number;
}

// ============================================
// GAME STATE ENTITIES
// ============================================

/**
 * Server Game State (Full Authoritative)
 * ⚠️ NEVER send this to clients!
 * @see docs/v0.1.0/03-GameEngine.md - Section 2.3
 */
export interface IServerGameState {
  readonly roomId: string;
  phase: GamePhase;
  round: {
    roundNumber: number;
    dealPhase?: number;
  };
  turn: {
    currentPlayerId: string;
    currentPlayerIndex: number;
    timeRemaining: number;
    turnStartedAt: string;
    pendingMove?: {
      card: ICard;
      matchOptions: IMatchLocation[];
      selectionDeadline: string;
    };
  };
  deck: ICard[];
  hands: Map<string, ICard[]>;
  pool: { cards: ICard[] };
  penaltySlots: Map<string, IPenaltyStack>;
  openCenter: { cards: (ICard | null)[] };
  players: IServerPlayerState[];
  turnOrder: string[];
  actionLog: IGameAction[];
  cardLocations: Map<string, ICardLocation>;
}

/**
 * Client Game View (Masked State)
 * This is safe to send to clients
 * @see docs/v0.1.0/03-GameEngine.md - Section 2.4
 */
export interface IClientGameView {
  readonly roomId: string;
  readonly phase: GamePhase;
  readonly round: number;
  readonly myHand: ICard[];
  readonly myIndex: number;
  readonly opponents: IClientPlayerState[];
  readonly openCenter: (ICard | null)[];
  readonly poolTopCard: ICard | null;
  readonly penaltySlots: IClientPenaltySlot[];
  readonly currentPlayerId: string;
  readonly turnTimeRemaining: number;
  readonly isAwaitingMyTarget?: boolean;
  readonly validTargets?: IMatchLocation[];
}

/**
 * Server Player State (Internal)
 */
export interface IServerPlayerState {
  id: string;
  odindexerId: string;
  nickname: string;
  avatarUrl?: string;
  seatIndex: number;
  isConnected: boolean;
  isReady: boolean;
}

/**
 * Client Player State (Masked - for opponents)
 */
export interface IClientPlayerState {
  readonly id: string;
  readonly nickname: string;
  readonly avatarUrl?: string;
  readonly cardCount: number;
  readonly isConnected: boolean;
  readonly seatIndex: number;
}

/**
 * Client Penalty Slot View
 */
export interface IClientPenaltySlot {
  readonly playerId: string;
  readonly topCards: ICard[];
  readonly buriedCount: number;
  readonly isSealed: boolean;
}

/**
 * Game Action (for replay/audit)
 */
export interface IGameAction {
  readonly actionId: string;
  readonly playerId: string;
  readonly actionType: 'play_card' | 'select_target' | 'timeout';
  readonly timestamp: string;
  card?: ICard;
  targetPlayerId?: string;
  result?: PlayResult;
}

// ============================================
// USER ENTITIES
// ============================================

/**
 * User Profile (Database Document)
 * @see docs/v0.1.0/04-Database.md - Section 2.2
 */
export interface IUserProfile {
  /** Firebase UID */
  readonly uid: string;
  /** Display name */
  nickname: string;
  /** Email address */
  email: string;
  /** Avatar URL (Cloudflare R2) */
  avatarUrl?: string;
  /** Current ELO rating */
  elo: number;
  /** Player rank tier */
  rank: PlayerRank;
  /** Total games played */
  gamesPlayed: number;
  /** Total games won (1st place) */
  gamesWon: number;
  /** Wallet balance */
  wallet: {
    coins: number;
    gems: number;
  };
  /** Friend list (UIDs) */
  friendIds: string[];
  /** Blocked users (UIDs) */
  blockedIds: string[];
  /** Account creation timestamp */
  readonly createdAt: string;
  /** Last online timestamp */
  lastSeen: string;
  /** Ban status */
  isBanned: boolean;
  /** Ban reason (if banned) */
  banReason?: string;
}

/**
 * Session data stored in Redis
 */
export interface IUserSession {
  readonly uid: string;
  readonly socketId: string;
  readonly roomId?: string;
  readonly connectedAt: string;
  connectionStatus: ConnectionStatus;
  lastActivity: string;
}

// ============================================
// MATCH ENTITIES
// ============================================

/**
 * Match Result (Database Document)
 */
export interface IMatchResult {
  readonly matchId: string;
  readonly roomId: string;
  readonly startedAt: string;
  readonly endedAt: string;
  readonly durationSeconds: number;
  readonly matchType: MatchType;
  readonly players: IPlayerMatchResult[];
  readonly rounds: IRoundResult[];
}

/**
 * Player's result in a match
 */
export interface IPlayerMatchResult {
  readonly odindexerId: string;
  readonly odindexerName: string;
  readonly placement: number;
  readonly totalPenaltyPoints: number;
  readonly eloChange: number;
  readonly newElo: number;
}

/**
 * Single round result
 */
export interface IRoundResult {
  readonly roundNumber: number;
  readonly scores: { odindexerId: string; penaltyPoints: number }[];
}

// ============================================
// LEADERBOARD ENTITIES
// ============================================

/**
 * Leaderboard Entry
 */
export interface ILeaderboardEntry {
  readonly rank: number;
  readonly odindexerId: string;
  readonly odindexerName: string;
  readonly avatarUrl?: string;
  readonly elo: number;
  readonly playerRank: PlayerRank;
}

// ============================================
// PARTY/SOCIAL ENTITIES
// ============================================

/**
 * Party (pre-game lobby group)
 */
export interface IParty {
  readonly partyId: string;
  readonly leaderId: string;
  readonly memberIds: string[];
  readonly invitedIds: string[];
  readonly createdAt: string;
  readonly maxSize: number;
}

/**
 * Friend Request
 */
export interface IFriendRequest {
  readonly requestId: string;
  readonly fromUserId: string;
  readonly toUserId: string;
  readonly status: 'pending' | 'accepted' | 'rejected';
  readonly createdAt: string;
}
