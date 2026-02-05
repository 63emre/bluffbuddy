/**
 * ==========================================================
 * GAME MODULE INTERFACES
 * ==========================================================
 * BluffBuddy Online - Game Engine Abstractions
 *
 * @owner DEV2 (Game Engine)
 * @version v0.2.0
 * @see docs/v0.1.0/02-Architecture.md - Section 2.4, 2.5
 * @see docs/v0.1.0/03-GameEngine.md
 *
 * PURPOSE:
 * These interfaces define the PUBLIC API of the Game module.
 * DEV1/DEV3 can mock these for testing without knowing internals.
 *
 * RULES:
 * 1. Interfaces should be small and focused (ISP)
 * 2. High-level modules depend on these, not implementations
 * 3. Breaking changes require version bump
 * ==========================================================
 */

import {
  ICard,
  IServerGameState,
  IClientGameView,
  IServerPlayerState,
  IPenaltyStack,
  ISealEvent,
  IMatchLocation,
  IPlayerMatchResult,
} from '../entities';
import { CardPlayedPayload, SelectTargetPayload } from '../payloads';
import { CardRank, MatchType } from '../enums';

// ============================================
// CORE GAME ENGINE INTERFACE
// ============================================

/**
 * Game Engine Interface
 * The core game logic orchestrator
 *
 * @see docs/v0.1.0/03-GameEngine.md
 */
export interface IGameEngine {
  /**
   * Initialize a new game with players
   * @param roomId Unique room identifier
   * @param players Array of participating players
   * @returns Initial server game state
   */
  createGame(roomId: string, players: IServerPlayerState[]): IServerGameState;

  /**
   * Process a card play action
   * @param state Current game state
   * @param playerId Acting player's ID
   * @param cardId Card being played
   * @returns Result of the play action
   */
  playCard(
    state: IServerGameState,
    playerId: string,
    cardId: string,
  ): CardPlayedPayload;

  /**
   * Process target selection (when multiple matches exist)
   * @param state Current game state
   * @param playerId Acting player's ID
   * @param target Selected target location
   * @returns Result of the selection
   */
  selectTarget(
    state: IServerGameState,
    playerId: string,
    target: SelectTargetPayload,
  ): CardPlayedPayload;

  /**
   * Handle player timeout (auto-pass)
   * @param state Current game state
   * @param playerId Player who timed out
   */
  handleTimeout(state: IServerGameState, playerId: string): void;

  /**
   * Create masked view of game state for a specific player
   * @param state Full server state
   * @param forPlayerId Player to create view for
   * @returns Masked client-safe view
   */
  getMaskedState(state: IServerGameState, forPlayerId: string): IClientGameView;

  /**
   * Calculate final scores and placements
   * @param state Completed game state
   * @returns Array of player results with ELO changes
   */
  calculateFinalScores(state: IServerGameState): IPlayerMatchResult[];
}

// ============================================
// SEAL SERVICE INTERFACE
// ============================================

/**
 * Seal (Mühür) Service Interface
 * Handles the seal detection algorithm
 *
 * @see docs/v0.1.0/03-GameEngine.md - Seal Algorithm
 */
export interface ISealService {
  /**
   * Initialize card accessibility tracking
   */
  initializeAccessibility(): void;

  /**
   * Track when a card becomes buried (inaccessible)
   * @param card The buried card
   */
  onCardBuried(card: ICard): void;

  /**
   * Track when a card becomes exposed (accessible)
   * @param card The exposed card
   */
  onCardExposed(card: ICard): void;

  /**
   * Get count of accessible cards for a rank
   * @param rank Card rank to check
   * @returns Number of accessible cards of that rank
   */
  getAccessibleCount(rank: CardRank): number;

  /**
   * Check if a penalty pile is sealed
   * @param stack Penalty stack to check
   * @param state Current game state
   * @returns True if stack is sealed
   */
  isPileSealed(stack: IPenaltyStack, state: IServerGameState): boolean;

  /**
   * Check all penalty stacks and apply seals
   * @param state Current game state
   * @returns Array of seal events that occurred
   */
  checkAndApplySeals(state: IServerGameState): ISealEvent[];
}

// ============================================
// MATCHING SERVICE INTERFACE
// ============================================

/**
 * Matching Service Interface
 * Handles card match detection logic
 */
export interface IMatchingService {
  /**
   * Find all possible match locations for a card
   * @param card Card being played
   * @param state Current game state
   * @returns Array of valid match locations
   */
  findMatches(card: ICard, state: IServerGameState): IMatchLocation[];

  /**
   * Validate if a target selection is valid
   * @param card Card being played
   * @param target Selected target
   * @param state Current game state
   * @returns True if valid selection
   */
  validateTarget(
    card: ICard,
    target: SelectTargetPayload,
    state: IServerGameState,
  ): boolean;

  /**
   * Execute match and update state
   * @param card Card being played
   * @param target Match target
   * @param state Current game state
   */
  executeMatch(
    card: ICard,
    target: IMatchLocation,
    state: IServerGameState,
  ): void;
}

// ============================================
// SCORING SERVICE INTERFACE
// ============================================

/**
 * Scoring Service Interface
 * Handles penalty point calculations
 */
export interface IScoringService {
  /**
   * Calculate penalty points for a set of cards
   * @param cards Cards to calculate
   * @returns Total penalty points
   */
  calculatePenalty(cards: ICard[]): number;

  /**
   * Calculate round scores for all players
   * @param state Game state at round end
   * @returns Map of playerId to penalty points
   */
  calculateRoundScores(state: IServerGameState): Map<string, number>;

  /**
   * Calculate final game rankings
   * @param roundScores All round scores
   * @returns Sorted array of player results
   */
  calculateFinalRankings(
    roundScores: Map<string, number>[],
    players: IServerPlayerState[],
  ): IPlayerMatchResult[];
}

// ============================================
// ROOM SERVICE INTERFACE
// ============================================

/**
 * Room Service Interface
 * Manages game room lifecycle
 */
export interface IRoomService {
  /**
   * Create a new game room
   * @param hostId Host player's ID
   * @param isPrivate Whether room is private
   * @returns Room ID and invite code
   */
  createRoom(
    hostId: string,
    isPrivate: boolean,
  ): Promise<{ roomId: string; inviteCode: string }>;

  /**
   * Join an existing room
   * @param playerId Player joining
   * @param roomId Room to join
   * @returns True if join successful
   */
  joinRoom(playerId: string, roomId: string): Promise<boolean>;

  /**
   * Leave a room
   * @param playerId Player leaving
   * @param roomId Room to leave
   */
  leaveRoom(playerId: string, roomId: string): Promise<void>;

  /**
   * Get room by ID
   * @param roomId Room ID
   * @returns Room state or null
   */
  getRoom(roomId: string): Promise<IServerGameState | null>;

  /**
   * Set player ready status
   * @param playerId Player ID
   * @param roomId Room ID
   * @param isReady Ready status
   */
  setPlayerReady(
    playerId: string,
    roomId: string,
    isReady: boolean,
  ): Promise<void>;

  /**
   * Check if room can start game
   * @param roomId Room ID
   * @returns True if all players ready
   */
  canStartGame(roomId: string): Promise<boolean>;
}

// ============================================
// MATCHMAKING SERVICE INTERFACE
// ============================================

/**
 * Matchmaking Service Interface
 * Handles player queue and matching
 */
export interface IMatchmakingService {
  /**
   * Add player to matchmaking queue
   * @param userId Player's user ID
   * @param type Match type (casual/ranked)
   * @param partyId Optional party ID
   */
  addToQueue(userId: string, type: MatchType, partyId?: string): Promise<void>;

  /**
   * Remove player from queue
   * @param userId Player's user ID
   */
  removeFromQueue(userId: string): Promise<void>;

  /**
   * Get player's position in queue
   * @param userId Player's user ID
   * @returns Position or null if not in queue
   */
  getQueuePosition(userId: string): Promise<number | null>;

  /**
   * Process queue and create matches
   * @returns Created match info
   */
  processQueue(): Promise<{ matched: string[][]; roomIds: string[] }>;

  /**
   * Get estimated wait time
   * @param type Match type
   * @returns Estimated seconds
   */
  getEstimatedWaitTime(type: MatchType): Promise<number>;
}

// ============================================
// STATE SERVICE INTERFACE
// ============================================

/**
 * State Service Interface
 * Manages game state persistence
 */
export interface IStateService {
  /**
   * Save game state to Redis
   * @param roomId Room ID
   * @param state Game state
   */
  saveState(roomId: string, state: IServerGameState): Promise<void>;

  /**
   * Load game state from Redis
   * @param roomId Room ID
   * @returns State or null
   */
  loadState(roomId: string): Promise<IServerGameState | null>;

  /**
   * Delete game state
   * @param roomId Room ID
   */
  deleteState(roomId: string): Promise<void>;

  /**
   * Check if state exists
   * @param roomId Room ID
   */
  exists(roomId: string): Promise<boolean>;
}

// ============================================
// TIMER SERVICE INTERFACE
// ============================================

/**
 * Timer Service Interface
 * Manages turn timers and timeouts
 */
export interface ITimerService {
  /**
   * Start a turn timer
   * @param roomId Room ID
   * @param playerId Current player
   * @param seconds Timer duration
   * @param onTimeout Callback when timer expires
   */
  startTurnTimer(
    roomId: string,
    playerId: string,
    seconds: number,
    onTimeout: () => void,
  ): void;

  /**
   * Cancel an active timer
   * @param roomId Room ID
   */
  cancelTimer(roomId: string): void;

  /**
   * Get remaining time
   * @param roomId Room ID
   * @returns Remaining seconds or 0
   */
  getRemainingTime(roomId: string): number;

  /**
   * Pause timer (for disconnection handling)
   * @param roomId Room ID
   */
  pauseTimer(roomId: string): void;

  /**
   * Resume paused timer
   * @param roomId Room ID
   */
  resumeTimer(roomId: string): void;
}
