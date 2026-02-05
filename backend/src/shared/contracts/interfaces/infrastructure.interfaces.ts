/**
 * ==========================================================
 * INFRASTRUCTURE MODULE INTERFACES
 * ==========================================================
 * BluffBuddy Online - Infrastructure Abstractions
 *
 * @owner DEV1 (Infrastructure)
 * @version v0.2.0
 * @see docs/v0.1.0/01-Infrastructure.md
 *
 * PURPOSE:
 * These interfaces abstract infrastructure concerns.
 * DEV2/DEV3 use these without knowing Redis/Firebase details.
 *
 * RULES:
 * 1. Keep infrastructure concerns isolated
 * 2. Abstract connection details
 * ==========================================================
 */

import { IServerGameState } from '../entities';

// ============================================
// REDIS SERVICE INTERFACE
// ============================================

/**
 * Redis Service Interface
 * Low-level Redis operations
 *
 * @see docs/v0.1.0/01-Infrastructure.md - Redis
 */
export interface IRedisService {
  // --- String Operations ---

  /**
   * Get a string value
   * @param key Redis key
   */
  get(key: string): Promise<string | null>;

  /**
   * Set a string value
   * @param key Redis key
   * @param value Value to set
   * @param ttlSeconds Optional TTL
   */
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;

  /**
   * Delete a key
   * @param key Redis key
   */
  del(key: string): Promise<void>;

  /**
   * Check if key exists
   * @param key Redis key
   */
  exists(key: string): Promise<boolean>;

  /**
   * Set key expiry
   * @param key Redis key
   * @param seconds TTL in seconds
   */
  expire(key: string, seconds: number): Promise<void>;

  // --- Hash Operations ---

  /**
   * Get hash field
   * @param key Redis key
   * @param field Hash field
   */
  hget(key: string, field: string): Promise<string | null>;

  /**
   * Set hash field
   * @param key Redis key
   * @param field Hash field
   * @param value Value
   */
  hset(key: string, field: string, value: string): Promise<void>;

  /**
   * Get all hash fields
   * @param key Redis key
   */
  hgetall(key: string): Promise<Record<string, string>>;

  /**
   * Delete hash field
   * @param key Redis key
   * @param field Hash field
   */
  hdel(key: string, field: string): Promise<void>;

  // --- List Operations ---

  /**
   * Push to list head
   * @param key Redis key
   * @param value Value
   */
  lpush(key: string, value: string): Promise<number>;

  /**
   * Pop from list head
   * @param key Redis key
   */
  lpop(key: string): Promise<string | null>;

  /**
   * Push to list tail
   * @param key Redis key
   * @param value Value
   */
  rpush(key: string, value: string): Promise<number>;

  /**
   * Pop from list tail
   * @param key Redis key
   */
  rpop(key: string): Promise<string | null>;

  /**
   * Get list range
   * @param key Redis key
   * @param start Start index
   * @param stop End index
   */
  lrange(key: string, start: number, stop: number): Promise<string[]>;

  /**
   * Remove from list
   * @param key Redis key
   * @param count Count to remove
   * @param value Value to remove
   */
  lrem(key: string, count: number, value: string): Promise<number>;

  // --- Set Operations ---

  /**
   * Add to set
   * @param key Redis key
   * @param member Member to add
   */
  sadd(key: string, member: string): Promise<number>;

  /**
   * Remove from set
   * @param key Redis key
   * @param member Member to remove
   */
  srem(key: string, member: string): Promise<number>;

  /**
   * Get all set members
   * @param key Redis key
   */
  smembers(key: string): Promise<string[]>;

  /**
   * Check set membership
   * @param key Redis key
   * @param member Member to check
   */
  sismember(key: string, member: string): Promise<boolean>;

  // --- Sorted Set Operations ---

  /**
   * Add to sorted set
   * @param key Redis key
   * @param score Score
   * @param member Member
   */
  zadd(key: string, score: number, member: string): Promise<number>;

  /**
   * Get sorted set range by score
   * @param key Redis key
   * @param min Min score
   * @param max Max score
   */
  zrangebyscore(key: string, min: number, max: number): Promise<string[]>;

  /**
   * Get sorted set range by rank
   * @param key Redis key
   * @param start Start rank
   * @param stop End rank
   */
  zrange(key: string, start: number, stop: number): Promise<string[]>;

  /**
   * Get member rank
   * @param key Redis key
   * @param member Member
   */
  zrank(key: string, member: string): Promise<number | null>;

  /**
   * Remove from sorted set
   * @param key Redis key
   * @param member Member
   */
  zrem(key: string, member: string): Promise<number>;

  // --- Pub/Sub ---

  /**
   * Publish to channel
   * @param channel Channel name
   * @param message Message
   */
  publish(channel: string, message: string): Promise<number>;

  /**
   * Subscribe to channel
   * @param channel Channel name
   * @param callback Message callback
   */
  subscribe(
    channel: string,
    callback: (message: string) => void,
  ): Promise<void>;

  /**
   * Unsubscribe from channel
   * @param channel Channel name
   */
  unsubscribe(channel: string): Promise<void>;

  // --- Utility ---

  /**
   * Get keys by pattern
   * @param pattern Key pattern
   */
  keys(pattern: string): Promise<string[]>;

  /**
   * Ping server
   */
  ping(): Promise<string>;

  /**
   * Close connection
   */
  disconnect(): Promise<void>;
}

// ============================================
// HYDRATION SERVICE INTERFACE
// ============================================

/**
 * Hydration Service Interface
 * Handles crash recovery and state restoration
 *
 * @see docs/v0.1.0/01-Infrastructure.md - State Recovery
 */
export interface IHydrationService {
  /**
   * Restore all active game states after restart
   * @returns Restored room IDs
   */
  hydrateAllGames(): Promise<string[]>;

  /**
   * Restore a specific game state
   * @param roomId Room ID
   * @returns Restored state or null
   */
  hydrateGame(roomId: string): Promise<IServerGameState | null>;

  /**
   * Check if there are games to restore
   * @returns True if pending hydration
   */
  hasPendingHydration(): Promise<boolean>;

  /**
   * Mark game as hydrated
   * @param roomId Room ID
   */
  markHydrated(roomId: string): Promise<void>;

  /**
   * Get list of games needing hydration
   * @returns Room IDs
   */
  getPendingHydrationList(): Promise<string[]>;
}

// ============================================
// PUB/SUB SERVICE INTERFACE
// ============================================

/**
 * Pub/Sub Message
 */
export interface IPubSubMessage<T = unknown> {
  readonly channel: string;
  readonly type: string;
  readonly payload: T;
  readonly timestamp: string;
  readonly source?: string;
}

/**
 * Pub/Sub Service Interface
 * For inter-process communication (horizontal scaling)
 *
 * @see docs/v0.1.0/01-Infrastructure.md - Scaling
 */
export interface IPubSubService {
  /**
   * Publish a message
   * @param channel Channel name
   * @param type Message type
   * @param payload Message payload
   */
  publish<T>(channel: string, type: string, payload: T): Promise<void>;

  /**
   * Subscribe to a channel
   * @param channel Channel name
   * @param handler Message handler
   * @returns Unsubscribe function
   */
  subscribe<T>(
    channel: string,
    handler: (message: IPubSubMessage<T>) => void,
  ): () => void;

  /**
   * Subscribe to a specific message type
   * @param channel Channel name
   * @param type Message type
   * @param handler Message handler
   * @returns Unsubscribe function
   */
  subscribeToType<T>(
    channel: string,
    type: string,
    handler: (message: IPubSubMessage<T>) => void,
  ): () => void;

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll(): Promise<void>;
}

// ============================================
// CONFIG SERVICE INTERFACE
// ============================================

/**
 * Config Service Interface
 * Environment configuration access
 */
export interface IConfigService {
  /**
   * Get a string config value
   * @param key Config key
   * @param defaultValue Default if not set
   */
  get<T = string>(key: string, defaultValue?: T): T;

  /**
   * Get a number config value
   * @param key Config key
   * @param defaultValue Default if not set
   */
  getNumber(key: string, defaultValue?: number): number;

  /**
   * Get a boolean config value
   * @param key Config key
   * @param defaultValue Default if not set
   */
  getBoolean(key: string, defaultValue?: boolean): boolean;

  /**
   * Check if in production mode
   */
  isProduction(): boolean;

  /**
   * Check if in development mode
   */
  isDevelopment(): boolean;

  /**
   * Get Redis config
   */
  getRedisConfig(): { host: string; port: number; password?: string };

  /**
   * Get Firebase config
   */
  getFirebaseConfig(): {
    projectId: string;
    privateKey: string;
    clientEmail: string;
  };

  /**
   * Get game config
   */
  getGameConfig(): {
    maxPlayers: number;
    roundsPerGame: number;
    turnTimeoutSeconds: number;
    reconnectWindowSeconds: number;
  };
}

// ============================================
// AUTH SERVICE INTERFACE
// ============================================

/**
 * Decoded Firebase Token
 */
export interface IDecodedToken {
  readonly uid: string;
  readonly email?: string;
  readonly name?: string;
  readonly picture?: string;
  readonly email_verified?: boolean;
}

/**
 * Auth Service Interface
 * Firebase authentication
 */
export interface IAuthService {
  /**
   * Verify Firebase ID token
   * @param token Firebase ID token
   * @returns Decoded token or null
   */
  verifyToken(token: string): Promise<IDecodedToken | null>;

  /**
   * Create custom token for user
   * @param uid User's UID
   * @param claims Additional claims
   * @returns Custom token
   */
  createCustomToken(
    uid: string,
    claims?: Record<string, unknown>,
  ): Promise<string>;

  /**
   * Revoke user's tokens
   * @param uid User's UID
   */
  revokeTokens(uid: string): Promise<void>;

  /**
   * Check if user is banned
   * @param uid User's UID
   * @returns True if banned
   */
  isUserBanned(uid: string): Promise<boolean>;
}

// ============================================
// USER SERVICE INTERFACE
// ============================================

/**
 * User Service Interface
 * User profile operations
 */
export interface IUserService {
  /**
   * Get user profile
   * @param uid User's UID
   */
  getProfile(uid: string): Promise<import('../entities').IUserProfile | null>;

  /**
   * Create user profile
   * @param uid User's UID
   * @param data Profile data
   */
  createProfile(
    uid: string,
    data: Partial<import('../entities').IUserProfile>,
  ): Promise<void>;

  /**
   * Update user profile
   * @param uid User's UID
   * @param data Partial update
   */
  updateProfile(
    uid: string,
    data: Partial<import('../entities').IUserProfile>,
  ): Promise<void>;

  /**
   * Check nickname availability
   * @param nickname Desired nickname
   * @returns True if available
   */
  isNicknameAvailable(nickname: string): Promise<boolean>;
}

// ============================================
// SESSION SERVICE INTERFACE
// ============================================

/**
 * Session Service Interface
 * User session management (Redis)
 */
export interface ISessionService {
  /**
   * Create a session
   * @param uid User's UID
   * @param socketId Socket connection ID
   */
  createSession(uid: string, socketId: string): Promise<void>;

  /**
   * Get session
   * @param uid User's UID
   */
  getSession(uid: string): Promise<import('../entities').IUserSession | null>;

  /**
   * Update session
   * @param uid User's UID
   * @param data Partial update
   */
  updateSession(
    uid: string,
    data: Partial<import('../entities').IUserSession>,
  ): Promise<void>;

  /**
   * Delete session
   * @param uid User's UID
   */
  deleteSession(uid: string): Promise<void>;

  /**
   * Get user by socket ID
   * @param socketId Socket ID
   */
  getUserBySocketId(socketId: string): Promise<string | null>;

  /**
   * Refresh session activity
   * @param uid User's UID
   */
  refreshActivity(uid: string): Promise<void>;
}
