/**
 * ==========================================================
 * CONSTANTS - SOCKET EVENTS
 * ==========================================================
 * BluffBuddy Online - WebSocket Event Names
 *
 * @owner DEV1 (Infrastructure)
 * @version v0.1.0
 *
 * NOTE: The canonical event definitions are in contracts.ts
 * This file re-exports them for backward compatibility.
 *
 * @see src/shared/contracts.ts - SocketEvents
 * ==========================================================
 */

// Re-export from contracts (single source of truth)
export { SocketEvents } from '../contracts';

// Legacy aliases for backward compatibility
import { SocketEvents } from '../contracts';

/** @deprecated Use SocketEvents instead */
export const GAME_EVENTS = {
  PLAY: SocketEvents.GAME_PLAY,
  SELECT_TARGET: SocketEvents.GAME_SELECT_TARGET,
  START: SocketEvents.GAME_START,
  STATE: SocketEvents.GAME_STATE,
  TURN: SocketEvents.GAME_TURN,
  PLAYED: SocketEvents.GAME_PLAYED,
  MATCH: SocketEvents.GAME_MATCH,
  SEAL: SocketEvents.GAME_SEAL,
  ROUND_END: SocketEvents.GAME_ROUND_END,
  END: SocketEvents.GAME_END,
  AWAITING_TARGET: SocketEvents.GAME_AWAITING_TARGET,
} as const;

/** @deprecated Use SocketEvents instead */
export const ROOM_EVENTS = {
  CREATE: SocketEvents.ROOM_CREATE,
  JOIN: SocketEvents.ROOM_JOIN,
  LEAVE: SocketEvents.ROOM_LEAVE,
  READY: SocketEvents.ROOM_READY,
  CREATED: SocketEvents.ROOM_CREATED,
  JOINED: SocketEvents.ROOM_JOINED,
  PLAYER_JOINED: SocketEvents.ROOM_PLAYER_JOINED,
  PLAYER_LEFT: SocketEvents.ROOM_PLAYER_LEFT,
  PLAYER_READY: SocketEvents.ROOM_PLAYER_READY,
  PLAYER_DISCONNECTED: SocketEvents.ROOM_PLAYER_DISCONNECTED,
} as const;

/** @deprecated Use SocketEvents instead */
export const SOCIAL_EVENTS = {
  FRIEND_REQUEST_SEND: SocketEvents.FRIEND_REQUEST_SEND,
  FRIEND_REQUEST_RECEIVED: SocketEvents.FRIEND_REQUEST_RECEIVED,
  FRIEND_REQUEST_RESPOND: SocketEvents.FRIEND_REQUEST_RESPOND,
  FRIEND_ADDED: SocketEvents.FRIEND_ADDED,
  FRIEND_REMOVED: SocketEvents.FRIEND_REMOVED,
  PARTY_CREATE: SocketEvents.PARTY_CREATE,
  PARTY_INVITE: SocketEvents.PARTY_INVITE,
  PARTY_JOIN: SocketEvents.PARTY_JOIN,
  PARTY_LEAVE: SocketEvents.PARTY_LEAVE,
  PARTY_UPDATED: SocketEvents.PARTY_UPDATED,
  CHAT_QUICK: SocketEvents.CHAT_QUICK,
  CHAT_EMOJI: SocketEvents.CHAT_EMOJI,
  PRESENCE_UPDATE: SocketEvents.PRESENCE_UPDATE,
} as const;

/** @deprecated Use SocketEvents instead */
export const SYSTEM_EVENTS = {
  CONNECTED: SocketEvents.CONNECTED,
  ERROR: SocketEvents.ERROR,
  KICKED: SocketEvents.KICKED,
  AUTH_VERIFY: SocketEvents.AUTH_VERIFY,
} as const;

/** @deprecated Use SocketEvents instead */
export const MATCHMAKING_EVENTS = {
  QUEUE: SocketEvents.MATCH_QUEUE,
  CANCEL: SocketEvents.MATCH_CANCEL,
  SEARCHING: SocketEvents.MATCH_SEARCHING,
  FOUND: SocketEvents.MATCH_FOUND,
  CANCELLED: SocketEvents.MATCH_CANCELLED,
} as const;
