/**
 * ==========================================================
 * SOCKET EVENT CONSTANTS
 * ==========================================================
 * BluffBuddy Online - Centralized Socket Event Names
 *
 * @owner DEV1 (Infrastructure)
 * @version v0.2.0
 * @see docs/v0.1.0/05-Networking.md - Section 3
 *
 * RULES:
 * 1. Use these constants EVERYWHERE - no hardcoded strings!
 * 2. Format: CATEGORY:ACTION or CATEGORY:NOUN:VERB
 * 3. Client → Server events use imperative (create, join, play)
 * 4. Server → Client events use past tense (created, joined, played)
 * ==========================================================
 */

/**
 * Socket Event Names - Single Source of Truth
 *
 * @example
 * ```typescript
 * // In Gateway:
 * @SubscribeMessage(SocketEvents.GAME_PLAY)
 * handlePlay() {}
 *
 * // Emitting:
 * client.emit(SocketEvents.GAME_STATE, payload);
 * ```
 */
export const SocketEvents = {
  // ============================================
  // AUTHENTICATION EVENTS
  // ============================================
  AUTH_VERIFY: 'auth:verify',
  AUTH_VERIFIED: 'auth:verified',
  AUTH_ERROR: 'auth:error',

  // ============================================
  // CONNECTION EVENTS (Server → Client)
  // ============================================
  CONNECTED: 'connected',
  ERROR: 'error',
  KICKED: 'kicked',
  RECONNECTED: 'reconnected',

  // ============================================
  // ROOM EVENTS
  // ============================================
  // Client → Server
  ROOM_CREATE: 'room:create',
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_READY: 'room:ready',
  ROOM_START: 'room:start',

  // Server → Client
  ROOM_CREATED: 'room:created',
  ROOM_JOINED: 'room:joined',
  ROOM_LEFT: 'room:left',
  ROOM_PLAYER_JOINED: 'room:player:joined',
  ROOM_PLAYER_LEFT: 'room:player:left',
  ROOM_PLAYER_READY: 'room:player:ready',
  ROOM_PLAYER_DISCONNECTED: 'room:player:disconnected',
  ROOM_PLAYER_RECONNECTED: 'room:player:reconnected',

  // ============================================
  // GAME EVENTS
  // ============================================
  // Client → Server
  GAME_PLAY: 'game:play',
  GAME_SELECT_TARGET: 'game:select_target',

  // Server → Client
  GAME_START: 'game:start',
  GAME_STATE: 'game:state',
  GAME_TURN: 'game:turn',
  GAME_PLAYED: 'game:played',
  GAME_MATCH: 'game:match',
  GAME_SEAL: 'game:seal',
  GAME_ROUND_END: 'game:round:end',
  GAME_END: 'game:end',
  GAME_AWAITING_TARGET: 'game:awaiting_target',
  GAME_TIMEOUT: 'game:timeout',
  GAME_PAUSED: 'game:paused',
  GAME_RESUMED: 'game:resumed',

  // ============================================
  // MATCHMAKING EVENTS
  // ============================================
  // Client → Server
  MATCH_QUEUE: 'match:queue',
  MATCH_CANCEL: 'match:cancel',

  // Server → Client
  MATCH_SEARCHING: 'match:searching',
  MATCH_FOUND: 'match:found',
  MATCH_CANCELLED: 'match:cancelled',
  MATCH_FAILED: 'match:failed',

  // ============================================
  // SOCIAL EVENTS
  // ============================================
  // Client → Server
  FRIEND_REQUEST_SEND: 'friend:request:send',
  FRIEND_REQUEST_RESPOND: 'friend:request:respond',
  FRIEND_REMOVE: 'friend:remove',

  // Server → Client
  FRIEND_REQUEST_RECEIVED: 'friend:request:received',
  FRIEND_ADDED: 'friend:added',
  FRIEND_REMOVED: 'friend:removed',
  FRIEND_ONLINE: 'friend:online',
  FRIEND_OFFLINE: 'friend:offline',

  // ============================================
  // PARTY EVENTS
  // ============================================
  // Client → Server
  PARTY_CREATE: 'party:create',
  PARTY_INVITE: 'party:invite',
  PARTY_JOIN: 'party:join',
  PARTY_LEAVE: 'party:leave',
  PARTY_KICK: 'party:kick',

  // Server → Client
  PARTY_CREATED: 'party:created',
  PARTY_INVITED: 'party:invited',
  PARTY_UPDATED: 'party:updated',
  PARTY_DISBANDED: 'party:disbanded',

  // ============================================
  // CHAT EVENTS
  // ============================================
  // Client → Server
  CHAT_QUICK: 'chat:quick',
  CHAT_EMOJI: 'chat:emoji',

  // Server → Client
  CHAT_MESSAGE: 'chat:message',
  CHAT_REACTION: 'chat:reaction',

  // ============================================
  // PRESENCE EVENTS
  // ============================================
  PRESENCE_UPDATE: 'presence:update',
  PRESENCE_STATUS: 'presence:status',
} as const;

/**
 * Type for socket event names
 */
export type SocketEventName = (typeof SocketEvents)[keyof typeof SocketEvents];

/**
 * Namespace definitions
 */
export const SocketNamespaces = {
  GAME: '/game',
  SOCIAL: '/social',
  MATCHMAKING: '/matchmaking',
} as const;

export type SocketNamespace =
  (typeof SocketNamespaces)[keyof typeof SocketNamespaces];
