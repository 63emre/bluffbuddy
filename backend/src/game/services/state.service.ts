/**
 * ==========================================================
 * STATE SERVICE
 * ==========================================================
 * BluffBuddy Online - Game State Management Service
 *
 * @owner DEV2 (Game Engine) + DEV1 (Redis Integration)
 * @iteration v0.1.0
 * @see docs/v0.1.0/04-Database.md - 3-Layer Storage
 * @see docs/v0.1.0/03-GameEngine.md - Section 2, 3, 8
 *
 * DEV RESPONSIBILITIES:
 * - DEV2: State manipulation logic + ClientView filtering
 * - DEV1: Redis persistence integration
 *
 * SERVICE RESPONSIBILITIES:
 * - In-memory state storage (hot)
 * - ServerState → ClientView conversion (CRITICAL for security)
 * - Phase transition management (FSM)
 * - Redis sync (warm) - MANDATORY
 * - State serialization/deserialization
 * - Atomic state updates
 * - State recovery on crash
 * ==========================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  ServerGameState,
  ClientGameView,
  ClientPlayerState,
  ClientTurnState,
  PhaseTransition,
  RoomState,
} from '../../shared/types/game/state.interface';
import {
  Card,
  ClientPenaltySlotState,
  ServerPenaltyStack,
} from '../../shared/types/game/card.interface';
import { GamePhase, CardRank } from '../../shared/types/game/enums';

// ----------------------------------------------------------
// PHASE TRANSITION DEFINITIONS (FSM)
// @see docs/v0.1.0/03-GameEngine.md - Section 3.2
// ----------------------------------------------------------

/**
 * All valid phase transitions in the game
 */
const PHASE_TRANSITIONS: PhaseTransition[] = [
  {
    from: GamePhase.WAITING_FOR_PLAYERS,
    to: GamePhase.INITIALIZING,
    condition: (s) => s.players.length === 4,
  },
  {
    from: GamePhase.INITIALIZING,
    to: GamePhase.DEALING,
    condition: (s) => s.openCenter.cards.every((c) => c !== null),
  },
  {
    from: GamePhase.DEALING,
    to: GamePhase.PLAYER_TURN,
    condition: (s) => {
      // All players have cards dealt
      for (const [, hand] of s.hands) {
        if (hand.length === 0) return false;
      }
      return true;
    },
  },
  {
    from: GamePhase.PLAYER_TURN,
    to: GamePhase.RESOLVING_MOVE,
    condition: (s) => s.turn.pendingMove !== null,
  },
  {
    from: GamePhase.RESOLVING_MOVE,
    to: GamePhase.CHECK_SEALS,
    condition: () => true, // Always transition after move resolved
  },
  {
    from: GamePhase.CHECK_SEALS,
    to: GamePhase.PLAYER_TURN,
    condition: (s) => !isRoundOver(s),
  },
  {
    from: GamePhase.CHECK_SEALS,
    to: GamePhase.ROUND_END,
    condition: (s) => isRoundOver(s),
  },
  {
    from: GamePhase.ROUND_END,
    to: GamePhase.DEALING,
    condition: (s) => s.round.roundNumber < 3,
  },
  {
    from: GamePhase.ROUND_END,
    to: GamePhase.GAME_OVER,
    condition: (s) => s.round.roundNumber >= 3,
  },
];

/**
 * Check if round is over (all hands empty)
 */
function isRoundOver(state: ServerGameState): boolean {
  for (const [, hand] of state.hands) {
    if (hand.length > 0) return false;
  }
  return true;
}

/**
 * StateService
 * Game state management service for BluffBuddy
 *
 * @see docs/v0.1.0/04-Database.md
 * @see docs/v0.1.0/03-GameEngine.md - Section 8 (State Masking)
 */
@Injectable()
export class StateService {
  private readonly logger = new Logger(StateService.name);

  // ----------------------------------------------------------
  // LAYER 1: In-Memory Storage (Hot)
  // ----------------------------------------------------------

  /** Active game states, keyed by roomId */
  private gameStates: Map<string, ServerGameState> = new Map();

  /** Active room states (pre-game), keyed by roomId */
  private roomStates: Map<string, RoomState> = new Map();

  // ============================================================
  // GAME STATE CRUD OPERATIONS
  // ============================================================

  /**
   * Get full server state for a room
   * ⚠️ INTERNAL USE ONLY - Never return this to clients!
   */
  getServerState(roomId: string): ServerGameState | null {
    return this.gameStates.get(roomId) || null;
  }

  /**
   * Set game state
   */
  setGameState(roomId: string, state: ServerGameState): void {
    state.lastUpdatedAt = new Date().toISOString();
    this.gameStates.set(roomId, state);

    // TODO v0.1.2: Async sync to Redis
    // this.syncToRedis(roomId);
  }

  /**
   * Delete game state (game ended)
   */
  deleteGameState(roomId: string): void {
    this.gameStates.delete(roomId);
    this.roomStates.delete(roomId);

    // TODO v0.1.2: Delete from Redis
  }

  /**
   * Check if game exists
   */
  hasGameState(roomId: string): boolean {
    return this.gameStates.has(roomId);
  }

  /**
   * Get all active game IDs
   */
  getActiveGameIds(): string[] {
    return Array.from(this.gameStates.keys());
  }

  // ============================================================
  // ROOM STATE CRUD (Pre-Game)
  // ============================================================

  getRoomState(roomId: string): RoomState | null {
    return this.roomStates.get(roomId) || null;
  }

  setRoomState(roomId: string, state: RoomState): void {
    this.roomStates.set(roomId, state);
  }

  deleteRoomState(roomId: string): void {
    this.roomStates.delete(roomId);
  }

  // ============================================================
  // CLIENT VIEW GENERATION (CRITICAL FOR SECURITY)
  // @see docs/v0.1.0/03-GameEngine.md - Section 8
  // ============================================================

  /**
   * Generate ClientGameView for a specific player
   * ⚠️ This is the ONLY way to send state to clients!
   *
   * Filters out:
   * - Other players' hands
   * - Pool cards (except top)
   * - Penalty stack buried cards
   * - Internal tracking data
   *
   * @param roomId Room to get state for
   * @param playerId Player requesting the view
   * @returns Filtered client view or null if not found
   */
  getViewForPlayer(roomId: string, playerId: string): ClientGameView | null {
    const state = this.gameStates.get(roomId);
    if (!state) {
      return null;
    }

    // Find player's seat index
    const player = state.players.find((p) => p.id === playerId);
    if (!player) {
      return null;
    }

    // Get player's own hand
    const myHand = state.hands.get(playerId) || [];

    // Build masked player states
    const players: ClientPlayerState[] = state.players.map((p) => {
      const penaltyStack = state.penaltySlots.get(p.id);
      return {
        id: p.id,
        nickname: p.nickname,
        avatarUrl: p.avatarUrl,
        seatIndex: p.seatIndex,
        cardCount: state.hands.get(p.id)?.length || 0, // Only count, not cards!
        isConnected: p.isConnected,
        penaltySlot: this.maskPenaltySlot(penaltyStack),
      };
    });

    // Build masked turn state
    const turn: ClientTurnState = {
      currentPlayerId: state.turn.currentPlayerId,
      currentPlayerIndex: state.turn.currentPlayerIndex,
      timeRemaining: state.turn.timeRemaining,
      isAwaitingTarget: state.turn.isAwaitingTarget,
      // Only show valid targets if it's this player's turn
      validTargets:
        state.turn.currentPlayerId === playerId
          ? state.turn.validTargets
          : undefined,
    };

    // Get pool top card only
    const poolCards = state.pool.cards;
    const poolTopCard =
      poolCards.length > 0 ? poolCards[poolCards.length - 1] : null;

    return {
      roomId: state.roomId,
      phase: state.phase,
      round: state.round,

      // Player's own data
      myHand,
      myIndex: player.seatIndex,
      myId: playerId,

      // Public board
      openCenter: state.openCenter,
      poolTopCard,
      poolCount: poolCards.length,

      // Other players (masked)
      players,

      // Turn info
      turn,

      // Server time
      serverTime: new Date().toISOString(),
    };
  }

  /**
   * Mask penalty slot for client view
   * Only shows top card group and buried count
   */
  private maskPenaltySlot(stack?: ServerPenaltyStack): ClientPenaltySlotState {
    if (!stack || stack.cards.length === 0) {
      return {
        ownerId: stack?.ownerId || '',
        topCards: [],
        buriedCount: 0,
        isSealed: false,
      };
    }

    // Get top group (consecutive cards of same rank from top)
    const topCards: Card[] = [];
    const topRank = stack.cards[stack.cards.length - 1].rank;

    for (let i = stack.cards.length - 1; i >= 0; i--) {
      if (stack.cards[i].rank === topRank) {
        topCards.unshift(stack.cards[i]); // Add to front to maintain order
      } else {
        break;
      }
    }

    const buriedCount = stack.cards.length - topCards.length;

    return {
      ownerId: stack.ownerId,
      topCards,
      buriedCount,
      isSealed: stack.isSealed,
    };
  }

  // ============================================================
  // PHASE TRANSITION (FSM)
  // @see docs/v0.1.0/03-GameEngine.md - Section 3.2
  // ============================================================

  /**
   * Try to transition to next phase
   * Returns true if transition occurred
   */
  tryPhaseTransition(roomId: string): boolean {
    const state = this.gameStates.get(roomId);
    if (!state) return false;

    const currentPhase = state.phase;

    // Find valid transition from current phase
    for (const transition of PHASE_TRANSITIONS) {
      if (transition.from === currentPhase && transition.condition(state)) {
        this.logger.log(
          `Phase transition: ${transition.from} → ${transition.to} (room: ${roomId})`,
        );

        state.phase = transition.to;
        state.lastUpdatedAt = new Date().toISOString();

        // Execute action if defined
        if (transition.action) {
          transition.action(state);
        }

        return true;
      }
    }

    return false;
  }

  /**
   * Get valid next phases from current state
   */
  getValidTransitions(roomId: string): GamePhase[] {
    const state = this.gameStates.get(roomId);
    if (!state) return [];

    return PHASE_TRANSITIONS.filter(
      (t) => t.from === state.phase && t.condition(state),
    ).map((t) => t.to);
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================

  /**
   * Create initial accessibility counts (all 4 of each rank)
   */
  createInitialAccessibilityCounts(): Map<CardRank, number> {
    const counts = new Map<CardRank, number>();
    const allRanks: CardRank[] = [
      CardRank.ACE,
      CardRank.TWO,
      CardRank.THREE,
      CardRank.FOUR,
      CardRank.FIVE,
      CardRank.SIX,
      CardRank.SEVEN,
      CardRank.EIGHT,
      CardRank.NINE,
      CardRank.TEN,
      CardRank.JACK,
      CardRank.QUEEN,
      CardRank.KING,
    ];

    for (const rank of allRanks) {
      counts.set(rank, 4);
    }

    return counts;
  }

  /**
   * Get stats about active games (for monitoring)
   */
  getStats(): { activeGames: number; activePlayers: number } {
    let activePlayers = 0;
    for (const state of this.gameStates.values()) {
      activePlayers += state.players.filter((p) => p.isConnected).length;
    }

    return {
      activeGames: this.gameStates.size,
      activePlayers,
    };
  }

  // ============================================================
  // REDIS INTEGRATION (TODO v0.1.2)
  // ============================================================

  // TODO v0.1.2: Implement Redis sync
  // async syncToRedis(roomId: string): Promise<void> { }
  // async loadFromRedis(roomId: string): Promise<ServerGameState | null> { }
  // async hydrateAllStates(): Promise<void> { }
}
