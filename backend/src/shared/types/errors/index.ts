/**
 * ==========================================================
 * ERROR CODES
 * ==========================================================
 * BluffBuddy Online - Standardized Error Code Definitions
 *
 * @owner DEV1 (Infrastructure)
 * @iteration v0.1.0
 * @see docs/v0.1.0/05-Networking.md - Section 6
 *
 * DEV RESPONSIBILITIES:
 * - DEV1: Error code definitions and handling strategy
 * ==========================================================
 */

// ----------------------------------------------------------
// ITERATION v0.1.0 - Base error codes
// TODO v0.1.1: Add error severity levels
// TODO v0.2.0: Add i18n error message keys
// ----------------------------------------------------------

/**
 * Authentication Error Codes
 */
export const AUTH_ERRORS = {
  /** Token is missing */
  TOKEN_MISSING: 'ERR_TOKEN_MISSING',
  /** Token is invalid or expired */
  TOKEN_INVALID: 'ERR_TOKEN_INVALID',
  /** User not found in database */
  USER_NOT_FOUND: 'ERR_USER_NOT_FOUND',
  /** User is banned */
  USER_BANNED: 'ERR_USER_BANNED',
  /** Multiple connections not allowed */
  DUPLICATE_CONNECTION: 'ERR_DUPLICATE_CONNECTION',
} as const;

/**
 * Room Error Codes
 */
export const ROOM_ERRORS = {
  /** Room not found */
  NOT_FOUND: 'ERR_ROOM_NOT_FOUND',
  /** Room is full */
  FULL: 'ERR_ROOM_FULL',
  /** Not in any room */
  NOT_IN_ROOM: 'ERR_NOT_IN_ROOM',
  /** Already in a room */
  ALREADY_IN_ROOM: 'ERR_ALREADY_IN_ROOM',
  /** Invalid invite code */
  INVALID_CODE: 'ERR_INVALID_CODE',
  /** Cannot create more rooms */
  CREATE_LIMIT: 'ERR_ROOM_CREATE_LIMIT',
} as const;

/**
 * Game Error Codes
 */
export const GAME_ERRORS = {
  /** Not your turn */
  NOT_YOUR_TURN: 'ERR_NOT_YOUR_TURN',
  /** Invalid card */
  INVALID_CARD: 'ERR_INVALID_CARD',
  /** Card not in hand */
  CARD_NOT_IN_HAND: 'ERR_CARD_NOT_IN_HAND',
  /** Game not started */
  NOT_STARTED: 'ERR_GAME_NOT_STARTED',
  /** Game already started */
  ALREADY_STARTED: 'ERR_GAME_ALREADY_STARTED',
  /** Invalid target */
  INVALID_TARGET: 'ERR_INVALID_TARGET',
  /** Target selection timeout */
  TARGET_TIMEOUT: 'ERR_TARGET_TIMEOUT',
  /** Cannot leave during game */
  CANNOT_LEAVE: 'ERR_CANNOT_LEAVE_DURING_GAME',
} as const;

/**
 * Matchmaking Error Codes
 */
export const MATCH_ERRORS = {
  /** Already in queue */
  ALREADY_QUEUED: 'ERR_ALREADY_QUEUED',
  /** Not in queue */
  NOT_IN_QUEUE: 'ERR_NOT_IN_QUEUE',
  /** Matchmaking disabled */
  DISABLED: 'ERR_MATCHMAKING_DISABLED',
  /** ELO too low for ranked */
  ELO_RESTRICTED: 'ERR_ELO_RESTRICTED',
} as const;

/**
 * Social Error Codes
 */
export const SOCIAL_ERRORS = {
  /** User not found */
  USER_NOT_FOUND: 'ERR_SOCIAL_USER_NOT_FOUND',
  /** Already friends */
  ALREADY_FRIENDS: 'ERR_ALREADY_FRIENDS',
  /** Request already sent */
  REQUEST_EXISTS: 'ERR_REQUEST_EXISTS',
  /** Cannot add self */
  CANNOT_ADD_SELF: 'ERR_CANNOT_ADD_SELF',
  /** Friend request not found */
  REQUEST_NOT_FOUND: 'ERR_REQUEST_NOT_FOUND',
  /** User blocked you */
  BLOCKED: 'ERR_USER_BLOCKED',
  /** Friend limit reached */
  FRIEND_LIMIT: 'ERR_FRIEND_LIMIT',
} as const;

/**
 * Rate Limit Error Codes
 */
export const RATE_LIMIT_ERRORS = {
  /** Too many requests */
  TOO_MANY_REQUESTS: 'ERR_RATE_LIMIT',
  /** Chat rate limited */
  CHAT_LIMIT: 'ERR_CHAT_RATE_LIMIT',
  /** Action cooldown */
  COOLDOWN: 'ERR_COOLDOWN',
} as const;

/**
 * System Error Codes
 */
export const SYSTEM_ERRORS = {
  /** Internal server error */
  INTERNAL: 'ERR_INTERNAL',
  /** Service unavailable */
  UNAVAILABLE: 'ERR_SERVICE_UNAVAILABLE',
  /** Server maintenance */
  MAINTENANCE: 'ERR_MAINTENANCE',
  /** Invalid payload */
  INVALID_PAYLOAD: 'ERR_INVALID_PAYLOAD',
} as const;

// Type helpers
export type AuthErrorCode = (typeof AUTH_ERRORS)[keyof typeof AUTH_ERRORS];
export type RoomErrorCode = (typeof ROOM_ERRORS)[keyof typeof ROOM_ERRORS];
export type GameErrorCode = (typeof GAME_ERRORS)[keyof typeof GAME_ERRORS];
export type MatchErrorCode = (typeof MATCH_ERRORS)[keyof typeof MATCH_ERRORS];
export type SocialErrorCode =
  (typeof SOCIAL_ERRORS)[keyof typeof SOCIAL_ERRORS];
export type RateLimitErrorCode =
  (typeof RATE_LIMIT_ERRORS)[keyof typeof RATE_LIMIT_ERRORS];
export type SystemErrorCode =
  (typeof SYSTEM_ERRORS)[keyof typeof SYSTEM_ERRORS];

/** All error codes union */
export type ErrorCode =
  | AuthErrorCode
  | RoomErrorCode
  | GameErrorCode
  | MatchErrorCode
  | SocialErrorCode
  | RateLimitErrorCode
  | SystemErrorCode;
