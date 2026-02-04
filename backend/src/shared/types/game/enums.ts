/**
 * ==========================================================
 * GAME DOMAIN ENUMS
 * ==========================================================
 * BluffBuddy Online - Game-related Enumeration Types
 * 
 * @owner DEV2 (Game Engine)
 * @iteration v0.1.0
 * @see docs/v0.1.0/03-GameEngine.md
 * 
 * DEV RESPONSIBILITIES:
 * - DEV2: All game enums and constants
 * ==========================================================
 */

// ----------------------------------------------------------
// ITERATION v0.1.0 - Core game enums
// TODO v0.1.1: Add card animation states
// TODO v0.2.0: Add tournament-specific phases
// ----------------------------------------------------------

/**
 * Game Phase States
 * @see docs/v0.1.0/03-GameEngine.md - Section 3
 */
export enum GamePhase {
  /** Waiting for players in lobby */
  WAITING_FOR_PLAYERS = 'waiting_for_players',
  /** Setting up game (shuffle, initial setup) */
  INITIALIZING = 'initializing',
  /** Dealing cards phase */
  DEALING = 'dealing',
  /** Player's turn - waiting for card play */
  PLAYER_TURN = 'player_turn',
  /** Resolving the played card (match detection) */
  RESOLVING_MOVE = 'resolving_move',
  /** Checking for seal conditions after move */
  CHECK_SEALS = 'check_seals',
  /** Round ended, calculating scores */
  ROUND_END = 'round_end',
  /** Game finished */
  GAME_OVER = 'game_over',
  /** Game paused (disconnect/reconnect window) */
  PAUSED = 'paused',
}

/**
 * Card Suits
 */
export enum CardSuit {
  HEARTS = 'hearts',
  DIAMONDS = 'diamonds',
  CLUBS = 'clubs',
  SPADES = 'spades',
}

/**
 * Card Ranks
 */
export enum CardRank {
  ACE = 'A',
  TWO = '2',
  THREE = '3',
  FOUR = '4',
  FIVE = '5',
  SIX = '6',
  SEVEN = '7',
  EIGHT = '8',
  NINE = '9',
  TEN = '10',
  JACK = 'J',
  QUEEN = 'Q',
  KING = 'K',
}

/**
 * Card Play Result
 */
export enum PlayResult {
  /** Card matched - collected */
  MATCH = 'match',
  /** No match - card goes to penalty */
  NO_MATCH = 'no_match',
}

/**
 * Card Zone Types
 * Where a card can be located in the game
 * @see docs/v0.1.0/03-GameEngine.md - Section 4.1
 */
export enum CardZone {
  /** Not yet dealt (in deck) */
  DECK = 'deck',
  /** In a player's hand */
  HAND = 'hand',
  /** On the board center (Açık Orta) */
  OPEN_CENTER = 'open_center',
  /** In the discard pile (Havuz) */
  POOL = 'pool',
  /** In a penalty slot (Ceza Slotu) */
  PENALTY = 'penalty',
}

/**
 * Match Source Zone Types
 * Where a matching card came from
 */
export enum MatchZone {
  /** Açık Orta - Open center cards */
  CENTER = 'center',
  /** Havuz - Pool/deck */
  POOL = 'pool',
  /** Ceza Slotu - Other player's penalty slot */
  PENALTY = 'penalty',
}

/**
 * Room Types
 */
export enum RoomType {
  /** Public room - anyone can join */
  PUBLIC = 'public',
  /** Private room - invite only */
  PRIVATE = 'private',
}

/**
 * Match Types for Matchmaking
 */
export enum MatchType {
  /** Casual unranked game */
  CASUAL = 'casual',
  /** Ranked competitive game */
  RANKED = 'ranked',
}

/**
 * Player Connection Status
 */
export enum ConnectionStatus {
  /** Player is online and active */
  CONNECTED = 'connected',
  /** Player disconnected, waiting for reconnect */
  DISCONNECTED = 'disconnected',
  /** Player reconnecting */
  RECONNECTING = 'reconnecting',
}

/**
 * Disconnect Reason Codes
 */
export enum DisconnectReason {
  /** Normal logout */
  LOGOUT = 'logout',
  /** Network timeout */
  TIMEOUT = 'timeout',
  /** Server kicked player */
  KICKED = 'kicked',
  /** Multiple connections detected */
  DUPLICATE = 'duplicate',
  /** Server shutdown */
  SERVER_SHUTDOWN = 'server_shutdown',
}

// ----------------------------------------------------------
// CARD VALUE CONSTANTS
// @see docs/v0.1.0/10-GameRules.md - Card Values
// ----------------------------------------------------------

/**
 * Card Penalty Point Values
 * Buddy Bluff scoring system
 */
export const CARD_VALUES: Record<CardRank, number> = {
  [CardRank.ACE]: 11,
  [CardRank.TWO]: 2,
  [CardRank.THREE]: 30,  // "Üçlü" special rule
  [CardRank.FOUR]: 4,
  [CardRank.FIVE]: 5,
  [CardRank.SIX]: 6,
  [CardRank.SEVEN]: 7,
  [CardRank.EIGHT]: 8,
  [CardRank.NINE]: 9,
  [CardRank.TEN]: 10,
  [CardRank.JACK]: 20,   // "Vale" special value
  [CardRank.QUEEN]: 15,  // "Kız" special value
  [CardRank.KING]: 10,   // "Papaz" same as 10
} as const;

/**
 * Game Constants
 */
export const GAME_CONSTANTS = {
  /** Number of players per game */
  PLAYER_COUNT: 4,
  /** Cards dealt per player */
  CARDS_PER_PLAYER: 12,
  /** Cards dealt per round during dealing */
  CARDS_PER_DEAL_ROUND: 4,
  /** Number of dealing rounds (3 × 4 = 12) */
  DEAL_ROUNDS: 3,
  /** Open center card count */
  CENTER_CARD_COUNT: 4,
  /** Turn time limit in seconds */
  TURN_TIME_LIMIT: 30,
  /** Target selection time limit in seconds (when multiple match targets) */
  TARGET_SELECTION_TIME: 10,
  /** Reconnection window in seconds */
  RECONNECT_WINDOW: 60,
} as const;
