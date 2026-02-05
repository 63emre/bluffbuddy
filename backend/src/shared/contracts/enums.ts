/**
 * ==========================================================
 * SHARED ENUMS
 * ==========================================================
 * BluffBuddy Online - All Enumeration Types
 *
 * @owner ALL DEVELOPERS
 * @version v0.2.0
 * @see docs/v0.1.0/03-GameEngine.md
 *
 * RULES:
 * 1. Enum values should be lowercase with underscores
 * 2. Add JSDoc comments for clarity
 * 3. Breaking changes require version bump
 * ==========================================================
 */

// ============================================
// GAME STATE ENUMS
// ============================================

/**
 * Game Phase States
 * @see docs/v0.1.0/03-GameEngine.md - Section 3
 */
export enum GamePhase {
  /** Waiting for players to join */
  WAITING_FOR_PLAYERS = 'waiting_for_players',
  /** Setting up initial game state */
  INITIALIZING = 'initializing',
  /** Cards are being dealt */
  DEALING = 'dealing',
  /** Active player's turn */
  PLAYER_TURN = 'player_turn',
  /** Server is processing a move */
  RESOLVING_MOVE = 'resolving_move',
  /** Checking for seal conditions */
  CHECK_SEALS = 'check_seals',
  /** Round has ended, calculating scores */
  ROUND_END = 'round_end',
  /** Game is finished */
  GAME_OVER = 'game_over',
  /** Game is paused (player disconnected) */
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
  /** Card matched another card */
  MATCH = 'match',
  /** No match found, card goes to center */
  NO_MATCH = 'no_match',
  /** Player forgot a match, receives penalty */
  MEMORY_PENALTY = 'memory_penalty',
  /** Multiple match targets, awaiting player selection */
  AWAITING_TARGET = 'awaiting_target',
}

/**
 * Card Zone Types
 * @see docs/v0.1.0/03-GameEngine.md - Section 4.1
 */
export enum CardZone {
  /** Undealt deck */
  DECK = 'deck',
  /** Player's hand */
  HAND = 'hand',
  /** Open center cards */
  OPEN_CENTER = 'open_center',
  /** Captured cards pool */
  POOL = 'pool',
  /** Penalty stack */
  PENALTY = 'penalty',
}

// ============================================
// ROOM & MATCH ENUMS
// ============================================

/**
 * Room Types
 */
export enum RoomType {
  /** Publicly joinable room */
  PUBLIC = 'public',
  /** Invite-only room */
  PRIVATE = 'private',
}

/**
 * Match Queue Types
 */
export enum MatchType {
  /** Unranked, no ELO change */
  CASUAL = 'casual',
  /** Ranked, affects ELO */
  RANKED = 'ranked',
}

/**
 * Player Connection Status
 */
export enum ConnectionStatus {
  /** Player is connected */
  CONNECTED = 'connected',
  /** Player is disconnected */
  DISCONNECTED = 'disconnected',
  /** Player is attempting to reconnect */
  RECONNECTING = 'reconnecting',
}

// ============================================
// USER & RATING ENUMS
// ============================================

/**
 * Player Rank Tiers
 * @see docs/v0.1.0/06-ELO-Rating.md
 */
export enum PlayerRank {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond',
  MASTER = 'master',
  GRANDMASTER = 'grandmaster',
}

/**
 * User Account Status
 */
export enum AccountStatus {
  /** Normal active account */
  ACTIVE = 'active',
  /** Temporarily suspended */
  SUSPENDED = 'suspended',
  /** Permanently banned */
  BANNED = 'banned',
}

// ============================================
// ERROR CODES
// ============================================

/**
 * Error Codes (Machine-Readable)
 * @see docs/v0.1.0/02-Architecture.md - Section 7.1
 */
export enum ErrorCode {
  // Authentication (1xx)
  ERR_NO_TOKEN = 'ERR_NO_TOKEN',
  ERR_INVALID_TOKEN = 'ERR_INVALID_TOKEN',
  ERR_TOKEN_EXPIRED = 'ERR_TOKEN_EXPIRED',
  ERR_UNAUTHORIZED = 'ERR_UNAUTHORIZED',

  // Rate Limiting (2xx)
  ERR_RATE_LIMIT = 'ERR_RATE_LIMIT',
  ERR_BLOCKED = 'ERR_BLOCKED',

  // Room (3xx)
  ERR_ROOM_NOT_FOUND = 'ERR_ROOM_NOT_FOUND',
  ERR_ROOM_FULL = 'ERR_ROOM_FULL',
  ERR_ALREADY_IN_ROOM = 'ERR_ALREADY_IN_ROOM',
  ERR_NOT_IN_ROOM = 'ERR_NOT_IN_ROOM',
  ERR_NOT_HOST = 'ERR_NOT_HOST',

  // Game Logic (4xx)
  ERR_GAME_NOT_STARTED = 'ERR_GAME_NOT_STARTED',
  ERR_GAME_IN_PROGRESS = 'ERR_GAME_IN_PROGRESS',
  ERR_NOT_YOUR_TURN = 'ERR_NOT_YOUR_TURN',
  ERR_INVALID_MOVE = 'ERR_INVALID_MOVE',
  ERR_CARD_NOT_IN_HAND = 'ERR_CARD_NOT_IN_HAND',
  ERR_INVALID_TARGET = 'ERR_INVALID_TARGET',
  ERR_SELECTION_TIMEOUT = 'ERR_SELECTION_TIMEOUT',

  // Social (5xx)
  ERR_USER_NOT_FOUND = 'ERR_USER_NOT_FOUND',
  ERR_ALREADY_FRIENDS = 'ERR_ALREADY_FRIENDS',
  ERR_FRIEND_REQUEST_PENDING = 'ERR_FRIEND_REQUEST_PENDING',
  ERR_USER_BLOCKED = 'ERR_USER_BLOCKED',
  ERR_PARTY_FULL = 'ERR_PARTY_FULL',
  ERR_NOT_PARTY_LEADER = 'ERR_NOT_PARTY_LEADER',

  // IAP/Economy (6xx)
  ERR_INVALID_RECEIPT = 'ERR_INVALID_RECEIPT',
  ERR_RECEIPT_ALREADY_USED = 'ERR_RECEIPT_ALREADY_USED',
  ERR_INSUFFICIENT_FUNDS = 'ERR_INSUFFICIENT_FUNDS',

  // System (9xx)
  ERR_INTERNAL = 'ERR_INTERNAL',
  ERR_MAINTENANCE = 'ERR_MAINTENANCE',
  ERR_SERVICE_UNAVAILABLE = 'ERR_SERVICE_UNAVAILABLE',
}
