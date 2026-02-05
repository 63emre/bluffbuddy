/**
 * ==========================================================
 * DEPENDENCY INJECTION TOKENS
 * ==========================================================
 * BluffBuddy Online - Centralized DI Token Registry
 *
 * @owner ALL DEVELOPERS
 * @version v0.2.0
 * @see docs/v0.1.0/02-Architecture.md - Section 4
 *
 * USAGE:
 * ```typescript
 * // In module providers:
 * { provide: DI_TOKENS.GAME_ENGINE, useClass: GameService }
 *
 * // In service constructor:
 * constructor(@Inject(DI_TOKENS.GAME_ENGINE) private gameEngine: IGameEngine)
 * ```
 *
 * RULES:
 * 1. All interface-based injections MUST use these tokens
 * 2. Token names should match interface names (without 'I' prefix)
 * 3. Adding a new token requires PR review
 * ==========================================================
 */

/**
 * Dependency Injection Tokens
 * Use Symbol for runtime uniqueness and type safety
 */
export const DI_TOKENS = {
  // ============================================
  // GAME MODULE INTERFACES (DEV2)
  // ============================================

  /** Core game logic engine */
  GAME_ENGINE: Symbol.for('IGameEngine'),

  /** Seal detection algorithm service */
  SEAL_SERVICE: Symbol.for('ISealService'),

  /** Card matching logic service */
  MATCHING_SERVICE: Symbol.for('IMatchingService'),

  /** Scoring calculation service */
  SCORING_SERVICE: Symbol.for('IScoringService'),

  /** Room lifecycle management */
  ROOM_SERVICE: Symbol.for('IRoomService'),

  /** Matchmaking queue service */
  MATCHMAKING_SERVICE: Symbol.for('IMatchmakingService'),

  /** Game state management */
  STATE_SERVICE: Symbol.for('IStateService'),

  /** Turn timer management */
  TIMER_SERVICE: Symbol.for('ITimerService'),

  // ============================================
  // PERSISTENCE MODULE INTERFACES (DEV3)
  // ============================================

  /** User data repository */
  USER_REPOSITORY: Symbol.for('IUserRepository'),

  /** Match history repository */
  MATCH_REPOSITORY: Symbol.for('IMatchRepository'),

  /** Leaderboard data repository */
  LEADERBOARD_REPOSITORY: Symbol.for('ILeaderboardRepository'),

  /** Game state persistence (Redis) */
  GAME_STATE_REPOSITORY: Symbol.for('IGameStateRepository'),

  /** Firestore connection service */
  FIRESTORE_SERVICE: Symbol.for('IFirestoreService'),

  // ============================================
  // INFRASTRUCTURE MODULE INTERFACES (DEV1)
  // ============================================

  /** Redis client service */
  REDIS_SERVICE: Symbol.for('IRedisService'),

  /** State hydration/recovery service */
  HYDRATION_SERVICE: Symbol.for('IHydrationService'),

  /** Pub/Sub messaging service */
  PUBSUB_SERVICE: Symbol.for('IPubSubService'),

  /** Configuration service */
  CONFIG_SERVICE: Symbol.for('IConfigService'),

  /** Smart Logger service (cost-optimized) */
  LOGGER_SERVICE: Symbol.for('ISmartLoggerService'),

  /** CLS Context service (AsyncLocalStorage) */
  CLS_CONTEXT_SERVICE: Symbol.for('IClsContextService'),

  // ============================================
  // AUTH MODULE INTERFACES (DEV3)
  // ============================================

  /** Authentication service */
  AUTH_SERVICE: Symbol.for('IAuthService'),

  /** User profile service */
  USER_SERVICE: Symbol.for('IUserService'),

  /** Session management service */
  SESSION_SERVICE: Symbol.for('ISessionService'),

  // ============================================
  // SOCIAL MODULE INTERFACES (DEV3)
  // ============================================

  /** Friend system service */
  FRIEND_SERVICE: Symbol.for('IFriendService'),

  /** Party/group service */
  PARTY_SERVICE: Symbol.for('IPartyService'),

  /** Chat/messaging service */
  CHAT_SERVICE: Symbol.for('IChatService'),

  /** Online presence service */
  PRESENCE_SERVICE: Symbol.for('IPresenceService'),

  // ============================================
  // RATING MODULE INTERFACES (DEV2 + DEV3)
  // ============================================

  /** ELO calculation service */
  ELO_SERVICE: Symbol.for('IEloService'),

  /** Bot detection service */
  BOT_DETECTION_SERVICE: Symbol.for('IBotDetectionService'),

  // ============================================
  // ECONOMY MODULE INTERFACES (DEV3)
  // ============================================

  /** Virtual currency wallet service */
  WALLET_SERVICE: Symbol.for('IWalletService'),

  /** Transaction processing service */
  TRANSACTION_SERVICE: Symbol.for('ITransactionService'),

  /** In-app purchase verification service */
  PURCHASE_SERVICE: Symbol.for('IPurchaseService'),

  /** Rewards (daily, ads) service */
  REWARD_SERVICE: Symbol.for('IRewardService'),

  /** Leaderboard query service */
  LEADERBOARD_SERVICE: Symbol.for('ILeaderboardService'),
} as const;

/**
 * Type helper to extract token types
 */
export type DITokenKey = keyof typeof DI_TOKENS;
export type DITokenValue = (typeof DI_TOKENS)[DITokenKey];
