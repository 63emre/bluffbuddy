/**
 * ==========================================================
 * PERSISTENCE MODULE INTERFACES
 * ==========================================================
 * BluffBuddy Online - Database/Repository Abstractions
 *
 * @owner DEV3 (Data)
 * @version v0.2.0
 * @see docs/v0.1.0/02-Architecture.md - Section 2.5 (DIP)
 * @see docs/v0.1.0/04-Database.md
 *
 * PURPOSE:
 * These interfaces allow DEV2 to mock repositories for testing.
 * DEV3 implements these with Firestore/Redis.
 *
 * RULES:
 * 1. All database operations return Promises
 * 2. ACID operations must use transactions (see IFirestoreService)
 * 3. Never expose database-specific types
 * ==========================================================
 */

import {
  IUserProfile,
  IMatchResult,
  ILeaderboardEntry,
  IServerGameState,
  IPlayerMatchResult,
} from '../entities';

// ============================================
// USER REPOSITORY INTERFACE
// ============================================

/**
 * User Repository Interface
 * DEV2 can mock this; DEV3 implements with Firestore
 *
 * @see docs/v0.1.0/04-Database.md - Section 2.2
 */
export interface IUserRepository {
  /**
   * Find user by Firebase UID
   * @param uid Firebase UID
   * @returns User profile or null
   */
  findById(uid: string): Promise<IUserProfile | null>;

  /**
   * Find user by nickname
   * @param nickname User's display name
   * @returns User profile or null
   */
  findByNickname(nickname: string): Promise<IUserProfile | null>;

  /**
   * Create a new user
   * @param user User data (without timestamps)
   * @returns Created user with timestamps
   */
  create(
    user: Omit<IUserProfile, 'createdAt' | 'lastSeen'>,
  ): Promise<IUserProfile>;

  /**
   * Update user profile
   * @param uid Firebase UID
   * @param data Partial update data
   * @returns Updated user
   */
  update(uid: string, data: Partial<IUserProfile>): Promise<IUserProfile>;

  /**
   * Update user stats after a game (ACID transaction)
   * @param uid Firebase UID
   * @param gameResult Game result data
   */
  updateStats(uid: string, gameResult: IPlayerMatchResult): Promise<void>;

  /**
   * Update last seen timestamp
   * @param uid Firebase UID
   */
  updateLastSeen(uid: string): Promise<void>;

  /**
   * Add friend to user's friend list
   * @param uid User's UID
   * @param friendUid Friend's UID
   */
  addFriend(uid: string, friendUid: string): Promise<void>;

  /**
   * Remove friend from user's friend list
   * @param uid User's UID
   * @param friendUid Friend's UID
   */
  removeFriend(uid: string, friendUid: string): Promise<void>;

  /**
   * Block a user
   * @param uid User's UID
   * @param blockedUid Blocked user's UID
   */
  blockUser(uid: string, blockedUid: string): Promise<void>;

  /**
   * Unblock a user
   * @param uid User's UID
   * @param blockedUid Blocked user's UID
   */
  unblockUser(uid: string, blockedUid: string): Promise<void>;

  /**
   * Check if user exists
   * @param uid Firebase UID
   * @returns True if exists
   */
  exists(uid: string): Promise<boolean>;

  /**
   * Batch get multiple users
   * @param uids Array of UIDs
   * @returns Map of uid to profile
   */
  findByIds(uids: string[]): Promise<Map<string, IUserProfile>>;
}

// ============================================
// MATCH REPOSITORY INTERFACE
// ============================================

/**
 * Match Repository Interface
 * Stores completed match data
 *
 * @see docs/v0.1.0/04-Database.md
 */
export interface IMatchRepository {
  /**
   * Save a completed match
   * @param match Match result data
   */
  save(match: IMatchResult): Promise<void>;

  /**
   * Find match by ID
   * @param matchId Match ID
   * @returns Match result or null
   */
  findById(matchId: string): Promise<IMatchResult | null>;

  /**
   * Find matches by player
   * @param uid Player's UID
   * @param limit Max results (default: 10)
   * @returns Array of match results
   */
  findByPlayer(uid: string, limit?: number): Promise<IMatchResult[]>;

  /**
   * Find recent matches
   * @param limit Max results (default: 20)
   * @returns Array of recent matches
   */
  findRecent(limit?: number): Promise<IMatchResult[]>;

  /**
   * Get player's match count
   * @param uid Player's UID
   * @returns Total matches played
   */
  getPlayerMatchCount(uid: string): Promise<number>;

  /**
   * Get player's win count
   * @param uid Player's UID
   * @returns Total matches won
   */
  getPlayerWinCount(uid: string): Promise<number>;
}

// ============================================
// LEADERBOARD REPOSITORY INTERFACE
// ============================================

/**
 * Leaderboard Repository Interface
 * Manages global rankings
 *
 * @see docs/v0.1.0/06-ELO-Rating.md
 */
export interface ILeaderboardRepository {
  /**
   * Get top players
   * @param limit Max results (default: 100)
   * @returns Sorted leaderboard entries
   */
  getTopPlayers(limit?: number): Promise<ILeaderboardEntry[]>;

  /**
   * Get player's global rank
   * @param uid Player's UID
   * @returns Rank number or null if unranked
   */
  getPlayerRank(uid: string): Promise<number | null>;

  /**
   * Get leaderboard around a player
   * @param uid Player's UID
   * @param range Players above/below (default: 5)
   * @returns Surrounding leaderboard entries
   */
  getAroundPlayer(uid: string, range?: number): Promise<ILeaderboardEntry[]>;

  /**
   * Update player's ELO score
   * @param uid Player's UID
   * @param newElo New ELO value
   */
  updateScore(uid: string, newElo: number): Promise<void>;

  /**
   * Get rank by ELO bracket
   * @param minElo Minimum ELO
   * @param maxElo Maximum ELO
   * @param limit Max results
   * @returns Entries in bracket
   */
  getByEloBracket(
    minElo: number,
    maxElo: number,
    limit?: number,
  ): Promise<ILeaderboardEntry[]>;
}

// ============================================
// GAME STATE REPOSITORY INTERFACE (Redis)
// ============================================

/**
 * Game State Repository Interface
 * For ephemeral state persistence in Redis
 *
 * @see docs/v0.1.0/01-Infrastructure.md - Redis
 */
export interface IGameStateRepository {
  /**
   * Save game state to Redis
   * @param roomId Room ID
   * @param state Server game state
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
   * @returns True if exists
   */
  exists(roomId: string): Promise<boolean>;

  /**
   * Set expiry on state (for cleanup)
   * @param roomId Room ID
   * @param seconds TTL in seconds
   */
  setExpiry(roomId: string, seconds: number): Promise<void>;

  /**
   * Get all active room IDs
   * @returns Array of room IDs
   */
  getActiveRoomIds(): Promise<string[]>;
}

// ============================================
// FIRESTORE SERVICE INTERFACE
// ============================================

/**
 * Firestore Service Interface
 * Low-level Firestore operations with transaction support
 *
 * CRITICAL: Use transactions for ELO/Wallet updates!
 * @see docs/v0.1.0/04-Database.md - ACID compliance
 */
export interface IFirestoreService {
  /**
   * Get a document
   * @param collection Collection name
   * @param docId Document ID
   */
  getDoc<T>(collection: string, docId: string): Promise<T | null>;

  /**
   * Set a document
   * @param collection Collection name
   * @param docId Document ID
   * @param data Document data
   */
  setDoc<T>(collection: string, docId: string, data: T): Promise<void>;

  /**
   * Update a document
   * @param collection Collection name
   * @param docId Document ID
   * @param data Partial data
   */
  updateDoc<T>(
    collection: string,
    docId: string,
    data: Partial<T>,
  ): Promise<void>;

  /**
   * Delete a document
   * @param collection Collection name
   * @param docId Document ID
   */
  deleteDoc(collection: string, docId: string): Promise<void>;

  /**
   * Run a transaction (ACID)
   * @param fn Transaction function
   */
  runTransaction<T>(
    fn: (transaction: FirestoreTransaction) => Promise<T>,
  ): Promise<T>;

  /**
   * Batch write operations
   * @param operations Array of write operations
   */
  batchWrite(operations: FirestoreBatchOperation[]): Promise<void>;
}

/**
 * Transaction context for atomic operations
 */
export interface FirestoreTransaction {
  get<T>(collection: string, docId: string): Promise<T | null>;
  set<T>(collection: string, docId: string, data: T): void;
  update<T>(collection: string, docId: string, data: Partial<T>): void;
  delete(collection: string, docId: string): void;
}

/**
 * Batch operation type
 */
export interface FirestoreBatchOperation {
  type: 'set' | 'update' | 'delete';
  collection: string;
  docId: string;
  data?: unknown;
}
