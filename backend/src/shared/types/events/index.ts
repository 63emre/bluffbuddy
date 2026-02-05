/**
 * ==========================================================
 * SOCKET.IO EVENT CONSTANTS
 * ==========================================================
 * BluffBuddy Online - Socket Event Name Definitions
 *
 * @owner DEV1 (Infrastructure) + DEV2 (Game Engine)
 * @iteration v0.1.0
 * @see docs/v0.1.0/05-Networking.md - Section 3
 *
 * DEV RESPONSIBILITIES:
 * - DEV1: Connection, Auth, and System events
 * - DEV2: Game, Room, and Matchmaking events
 * - DEV3: Social and Chat events
 * ==========================================================
 */

// ----------------------------------------------------------
// ITERATION v0.1.0 - Base event names extracted from docs
// TODO v0.1.1: Add versioning support for backward compatibility
// TODO v0.1.2: Add event deprecation markers
// ----------------------------------------------------------

/**
 * Authentication Events
 * @owner DEV1
 */
export const AUTH_EVENTS = {
  /** Client verifies connection token */
  VERIFY: 'auth:verify',
} as const;

/**
 * Connection Events (Server → Client)
 * @owner DEV1
 */
export const CONNECTION_EVENTS = {
  /** Connection confirmed */
  CONNECTED: 'connected',
  /** Generic error occurred */
  ERROR: 'error',
  /** Forcefully disconnected */
  KICKED: 'kicked',
} as const;

/**
 * Room Events
 * @owner DEV2
 */
export const ROOM_EVENTS = {
  // Client → Server
  /** Create a new game room */
  CREATE: 'room:create',
  /** Join an existing room */
  JOIN: 'room:join',
  /** Leave current room */
  LEAVE: 'room:leave',
  /** Toggle ready status */
  READY: 'room:ready',

  // Server → Client
  /** Room successfully created */
  CREATED: 'room:created',
  /** Successfully joined room */
  JOINED: 'room:joined',
  /** Another player joined */
  PLAYER_JOINED: 'room:player:joined',
  /** A player left */
  PLAYER_LEFT: 'room:player:left',
  /** Player ready status changed */
  PLAYER_READY: 'room:player:ready',
} as const;

/**
 * Game Events
 * @owner DEV2
 */
export const GAME_EVENTS = {
  // Client → Server
  /** Play a card from hand */
  PLAY: 'game:play',
  /** Select penalty target (when multiple targets exist) */
  TARGET: 'game:target',
  /** Rejoin an active game after disconnect */
  REJOIN: 'game:rejoin',
  /** Request current game state */
  SYNC: 'game:sync',

  // Server → Client
  /** Game has started */
  START: 'game:start',
  /** Full game state update */
  STATE: 'game:state',
  /** Turn has started */
  TURN: 'game:turn',
  /** A card was played */
  PLAYED: 'game:played',
  /** A match occurred */
  MATCH: 'game:match',
  /** Stack was sealed (Mühür) */
  SEAL: 'game:seal',
  /** Round ended */
  ROUND_END: 'game:round:end',
  /** Game finished */
  END: 'game:end',
} as const;

/**
 * Matchmaking Events
 * @owner DEV2
 */
export const MATCH_EVENTS = {
  // Client → Server
  /** Enter matchmaking queue */
  QUEUE: 'match:queue',
  /** Cancel matchmaking */
  CANCEL: 'match:cancel',

  // Server → Client
  /** Currently searching */
  SEARCHING: 'match:searching',
  /** Match found */
  FOUND: 'match:found',
  /** Matchmaking was cancelled */
  CANCELLED: 'match:cancelled',
} as const;

/**
 * Social Events
 * @owner DEV3
 */
export const SOCIAL_EVENTS = {
  // Friend events
  /** Send friend request */
  FRIEND_ADD: 'social:friend:add',
  /** Accept friend request */
  FRIEND_ACCEPT: 'social:friend:accept',
  /** Decline friend request */
  FRIEND_DECLINE: 'social:friend:decline',
  /** Remove friend */
  FRIEND_REMOVE: 'social:friend:remove',

  // Party events
  /** Invite to party */
  PARTY_INVITE: 'social:party:invite',
  /** Accept party invite */
  PARTY_ACCEPT: 'social:party:accept',
  /** Leave party */
  PARTY_LEAVE: 'social:party:leave',
} as const;

/**
 * Chat Events
 * @owner DEV3
 */
export const CHAT_EVENTS = {
  /** Send quick chat message */
  MESSAGE: 'chat:message',
  /** Send emoji reaction */
  REACTION: 'chat:reaction',
} as const;

// ----------------------------------------------------------
// Type Helpers
// ----------------------------------------------------------

/** Extract all event names as union type */
export type AuthEventName = (typeof AUTH_EVENTS)[keyof typeof AUTH_EVENTS];
export type ConnectionEventName =
  (typeof CONNECTION_EVENTS)[keyof typeof CONNECTION_EVENTS];
export type RoomEventName = (typeof ROOM_EVENTS)[keyof typeof ROOM_EVENTS];
export type GameEventName = (typeof GAME_EVENTS)[keyof typeof GAME_EVENTS];
export type MatchEventName = (typeof MATCH_EVENTS)[keyof typeof MATCH_EVENTS];
export type SocialEventName =
  (typeof SOCIAL_EVENTS)[keyof typeof SOCIAL_EVENTS];
export type ChatEventName = (typeof CHAT_EVENTS)[keyof typeof CHAT_EVENTS];

/** All socket events */
export type SocketEventName =
  | AuthEventName
  | ConnectionEventName
  | RoomEventName
  | GameEventName
  | MatchEventName
  | SocialEventName
  | ChatEventName;
