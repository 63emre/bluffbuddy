/**
 * ==========================================================
 * GAME STATE INTERFACES
 * ==========================================================
 * BluffBuddy Online - Game State Type Definitions
 * 
 * @owner DEV2 (Game Engine)
 * @iteration v0.1.0
 * @see docs/v0.1.0/03-GameEngine.md - State Management
 * 
 * CRITICAL: ServerGameState vs ClientGameView separation!
 * - ServerGameState: Full authoritative state (NEVER send to client)
 * - ClientGameView: Filtered view per player (safe to send)
 * 
 * DEV RESPONSIBILITIES:
 * - DEV2: All game state interfaces
 * ==========================================================
 */

// ----------------------------------------------------------
// ITERATION v0.1.0 - Full server/client state separation
// @see docs/v0.1.0/03-GameEngine.md - Section 2.3, 2.4
// ----------------------------------------------------------

import { 
  Card, 
  CardLocation, 
  OpenCenterState, 
  ServerPoolState, 
  ServerPenaltyStack,
  ClientPoolState,
  ClientPenaltySlotState 
} from './card.interface';
import { GamePhase, RoomType, CardRank } from './enums';

/**
 * Room State
 * Lobby state before game starts
 * @owner DEV2
 */
export interface RoomState {
  /** Unique room identifier */
  roomId: string;
  /** Room invite code (for private rooms) */
  inviteCode?: string;
  /** Room type */
  type: RoomType;
  /** Host player ID */
  hostId: string;
  /** Players in room */
  players: RoomPlayer[];
  /** Maximum players (always 4) */
  maxPlayers: number;
  /** Room creation timestamp */
  createdAt: string;
}

/**
 * Player in Room (pre-game)
 */
export interface RoomPlayer {
  /** Firebase UID */
  id: string;
  /** Display name */
  nickname: string;
  /** Avatar URL */
  avatarUrl?: string;
  /** Is player ready to start */
  isReady: boolean;
  /** Seat index (0-3) */
  seatIndex: number;
}

/**
 * Turn State
 * Current turn information
 * @owner DEV2
 */
export interface TurnState {
  /** Current player's turn */
  currentPlayerId: string;
  /** Current player's seat index */
  currentPlayerIndex: number;
  /** Remaining time in seconds */
  timeRemaining: number;
  /** Turn start timestamp (ISO string) */
  turnStartedAt: string;
  /** Is waiting for target selection (multiple match targets) */
  isAwaitingTarget: boolean;
  /** Valid target player IDs (if awaiting target) */
  validTargets?: string[];
  /** Pending move waiting for target selection */
  pendingMove?: PendingMove;
}

/**
 * Pending Move
 * When player needs to select a target
 */
export interface PendingMove {
  /** Card being played */
  card: Card;
  /** All valid match locations */
  matchOptions: MatchLocation[];
  /** Selection timeout timestamp */
  selectionDeadline: string;
}

/**
 * Match Location
 * Where a matching card was found
 */
export interface MatchLocation {
  /** Zone where match was found */
  zone: 'center' | 'pool' | 'penalty';
  /** Owner player ID (for penalty slots) */
  ownerId?: string;
  /** Matched cards */
  cards: Card[];
  /** Auto-selection priority (lower = higher priority) */
  priority: number;
}

/**
 * Round State
 * Per-round tracking
 * @owner DEV2
 */
export interface RoundState {
  /** Current round number (1, 2, or 3) */
  roundNumber: number;
  /** Dealing phase (1, 2, or 3) during dealing */
  dealPhase?: number;
  /** Cards played this round */
  cardsPlayedThisRound: number;
}

// ============================================================
// SERVER GAME STATE (Full Authoritative - NEVER SEND TO CLIENT)
// @see docs/v0.1.0/03-GameEngine.md - Section 2.3
// ============================================================

/**
 * Server Game State (Full Authoritative)
 * ⚠️ CRITICAL: This is the single source of truth
 * ⚠️ NEVER send this directly to clients!
 * 
 * @owner DEV2
 * @see docs/v0.1.0/03-GameEngine.md - Section 2.3
 */
export interface ServerGameState {
  /** Room ID this game belongs to */
  roomId: string;
  
  /** Current game phase */
  phase: GamePhase;
  
  /** Round information */
  round: RoundState;
  
  /** Turn information */
  turn: TurnState;
  
  // ----------------------------------------------------------
  // HIDDEN DATA (Server-only, never sent to clients)
  // ----------------------------------------------------------
  
  /** 
   * Remaining deck (cards not yet dealt)
   * Only relevant during DEALING phase
   */
  deck: Card[];
  
  /**
   * All player hands (HIDDEN from other players)
   * Key: playerId, Value: cards in hand
   */
  hands: Map<string, Card[]>;
  
  /**
   * Full pool state (ALL cards, not just top)
   * Needed for seal calculation
   */
  pool: ServerPoolState;
  
  /**
   * All penalty stacks (FULL data)
   * Key: playerId
   */
  penaltySlots: Map<string, ServerPenaltyStack>;
  
  // ----------------------------------------------------------
  // PUBLIC DATA (Visible to all)
  // ----------------------------------------------------------
  
  /** Open center cards (Açık Orta) - visible to all */
  openCenter: OpenCenterState;
  
  /** Player metadata (no hands) */
  players: ServerPlayerState[];
  
  /** Turn order (player IDs in counter-clockwise order) */
  turnOrder: string[];
  
  // ----------------------------------------------------------
  // TRACKING DATA (For seal algorithm)
  // @see docs/v0.1.0/03-GameEngine.md - Section 6
  // ----------------------------------------------------------
  
  /**
   * Card location tracking
   * Key: cardId (e.g., "Q-hearts")
   * Used for seal calculation
   */
  cardLocations: Map<string, CardLocation>;
  
  /**
   * Accessible card counts per rank
   * Key: CardRank, Value: count of accessible cards
   * Used for seal calculation
   */
  accessibleCounts: Map<CardRank, number>;
  
  // ----------------------------------------------------------
  // METADATA
  // ----------------------------------------------------------
  
  /** Game start timestamp */
  startedAt: string;
  
  /** Last state update timestamp */
  lastUpdatedAt: string;
  
  /** Action log for replay/debugging */
  actionLog: GameAction[];
}

/**
 * Server Player State
 * Player info stored in server state
 */
export interface ServerPlayerState {
  /** Firebase UID */
  id: string;
  /** Display name */
  nickname: string;
  /** Avatar URL */
  avatarUrl?: string;
  /** Seat index (0-3, counter-clockwise) */
  seatIndex: number;
  /** Connection status */
  isConnected: boolean;
  /** Last activity timestamp */
  lastActiveAt: string;
}

/**
 * Game Action (for replay log)
 */
export interface GameAction {
  /** Action type */
  type: 'play_card' | 'match' | 'no_match' | 'seal' | 'round_end' | 'game_end';
  /** Player who performed action */
  playerId: string;
  /** Action timestamp */
  timestamp: string;
  /** Action-specific data */
  data: Record<string, unknown>;
}

// ============================================================
// CLIENT GAME VIEW (Filtered - Safe to send to specific player)
// @see docs/v0.1.0/03-GameEngine.md - Section 2.4
// ============================================================

/**
 * Client Game View
 * Game state as seen by a specific player
 * ✅ Safe to send to that player
 * 
 * @owner DEV2
 * @see docs/v0.1.0/03-GameEngine.md - Section 2.4
 */
export interface ClientGameView {
  /** Room ID */
  roomId: string;
  
  /** Current phase */
  phase: GamePhase;
  
  /** Round info */
  round: RoundState;
  
  // ----------------------------------------------------------
  // PLAYER'S OWN DATA (Full visibility)
  // ----------------------------------------------------------
  
  /** Player's own hand (visible) */
  myHand: Card[];
  
  /** Player's own seat index */
  myIndex: number;
  
  /** Player's own ID */
  myId: string;
  
  // ----------------------------------------------------------
  // PUBLIC BOARD STATE
  // ----------------------------------------------------------
  
  /** Open center cards (Açık Orta) */
  openCenter: OpenCenterState;
  
  /** Pool top card only (rest hidden) */
  poolTopCard: Card | null;
  
  /** Pool card count */
  poolCount: number;
  
  // ----------------------------------------------------------
  // OTHER PLAYERS (Masked data)
  // ----------------------------------------------------------
  
  /** All players' public state (including self) */
  players: ClientPlayerState[];
  
  // ----------------------------------------------------------
  // TURN INFO
  // ----------------------------------------------------------
  
  /** Current turn state */
  turn: ClientTurnState;
  
  // ----------------------------------------------------------
  // SERVER TIME SYNC
  // ----------------------------------------------------------
  
  /** Server timestamp for clock sync */
  serverTime: string;
}

/**
 * Client Player State
 * What a player can see about other players
 */
export interface ClientPlayerState {
  /** Player ID */
  id: string;
  /** Display name */
  nickname: string;
  /** Avatar URL */
  avatarUrl?: string;
  /** Seat index (0-3) */
  seatIndex: number;
  /** Number of cards in hand (not the cards themselves!) */
  cardCount: number;
  /** Is player connected */
  isConnected: boolean;
  /** Player's penalty slot (visible portion only) */
  penaltySlot: ClientPenaltySlotState;
}

/**
 * Client Turn State
 * Turn info for client (may hide some details)
 */
export interface ClientTurnState {
  /** Current player's ID */
  currentPlayerId: string;
  /** Current player's seat index */
  currentPlayerIndex: number;
  /** Remaining time in seconds */
  timeRemaining: number;
  /** Is waiting for target selection */
  isAwaitingTarget: boolean;
  /** Valid targets (only if this is our turn and awaiting target) */
  validTargets?: string[];
}

// ============================================================
// PHASE TRANSITION SYSTEM
// @see docs/v0.1.0/03-GameEngine.md - Section 3.2
// ============================================================

/**
 * Phase Transition Definition
 * Defines valid state machine transitions
 */
export interface PhaseTransition {
  /** Source phase */
  from: GamePhase;
  /** Target phase */
  to: GamePhase;
  /** Condition function that must return true for transition */
  condition: (state: ServerGameState) => boolean;
  /** Optional action to execute on transition */
  action?: (state: ServerGameState) => void;
}

// ============================================================
// LEGACY ALIAS (for backward compatibility)
// ============================================================

/** @deprecated Use ServerGameState instead */
export type GameState = ServerGameState;
