/**
 * ==========================================================
 * SHARED CONTRACTS (Golden Source)
 * ==========================================================
 * BluffBuddy Online - Central Type Definitions for All Developers
 *
 * @owner All Developers (Shared Responsibility)
 * @version v0.1.0
 * @created February 2026
 *
 * PURPOSE:
 * This file is the "glue" that enables parallel development.
 * - DEV1 imports Socket events and error codes
 * - DEV2 imports game interfaces and repository interfaces for mocking
 * - DEV3 imports repository interfaces to implement
 *
 * RULES:
 * 1. ALL interface changes must be discussed in PR review
 * 2. Breaking changes require version bump
 * 3. Deprecate, don't delete (for backward compatibility)
 *
 * @see docs/v0.1.0/02-Architecture.md
 * @see docs/v0.1.0/03-GameEngine.md
 * @see docs/v0.1.0/05-Networking.md
 * ==========================================================
 */

// ============================================================
// SECTION 1: ENUMS (Game, Error, Events)
// ============================================================

/**
 * Game Phase States
 * @see docs/v0.1.0/03-GameEngine.md - Section 3
 */
export enum GamePhase {
  WAITING_FOR_PLAYERS = 'waiting_for_players',
  INITIALIZING = 'initializing',
  DEALING = 'dealing',
  PLAYER_TURN = 'player_turn',
  RESOLVING_MOVE = 'resolving_move',
  CHECK_SEALS = 'check_seals',
  ROUND_END = 'round_end',
  GAME_OVER = 'game_over',
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
  MATCH = 'match',
  NO_MATCH = 'no_match',
  MEMORY_PENALTY = 'memory_penalty',
  AWAITING_TARGET = 'awaiting_target',
}

/**
 * Card Zone Types
 * @see docs/v0.1.0/03-GameEngine.md - Section 4.1
 */
export enum CardZone {
  DECK = 'deck',
  HAND = 'hand',
  OPEN_CENTER = 'open_center',
  POOL = 'pool',
  PENALTY = 'penalty',
}

/**
 * Room Types
 */
export enum RoomType {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

/**
 * Match Queue Types
 */
export enum MatchType {
  CASUAL = 'casual',
  RANKED = 'ranked',
}

/**
 * Player Connection Status
 */
export enum ConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
}

/**
 * Error Codes (Machine-Readable)
 * @see docs/v0.1.0/02-Architecture.md - Section 7.1
 */
export enum ErrorCode {
  // Authentication
  ERR_NO_TOKEN = 'ERR_NO_TOKEN',
  ERR_INVALID_TOKEN = 'ERR_INVALID_TOKEN',
  ERR_TOKEN_EXPIRED = 'ERR_TOKEN_EXPIRED',
  ERR_UNAUTHORIZED = 'ERR_UNAUTHORIZED',

  // Rate Limiting
  ERR_RATE_LIMIT = 'ERR_RATE_LIMIT',
  ERR_BLOCKED = 'ERR_BLOCKED',

  // Room
  ERR_ROOM_NOT_FOUND = 'ERR_ROOM_NOT_FOUND',
  ERR_ROOM_FULL = 'ERR_ROOM_FULL',
  ERR_ALREADY_IN_ROOM = 'ERR_ALREADY_IN_ROOM',
  ERR_NOT_IN_ROOM = 'ERR_NOT_IN_ROOM',
  ERR_NOT_HOST = 'ERR_NOT_HOST',

  // Game Logic
  ERR_GAME_NOT_STARTED = 'ERR_GAME_NOT_STARTED',
  ERR_GAME_IN_PROGRESS = 'ERR_GAME_IN_PROGRESS',
  ERR_NOT_YOUR_TURN = 'ERR_NOT_YOUR_TURN',
  ERR_INVALID_MOVE = 'ERR_INVALID_MOVE',
  ERR_CARD_NOT_IN_HAND = 'ERR_CARD_NOT_IN_HAND',
  ERR_INVALID_TARGET = 'ERR_INVALID_TARGET',
  ERR_SELECTION_TIMEOUT = 'ERR_SELECTION_TIMEOUT',

  // Social
  ERR_USER_NOT_FOUND = 'ERR_USER_NOT_FOUND',
  ERR_ALREADY_FRIENDS = 'ERR_ALREADY_FRIENDS',
  ERR_FRIEND_REQUEST_PENDING = 'ERR_FRIEND_REQUEST_PENDING',
  ERR_USER_BLOCKED = 'ERR_USER_BLOCKED',
  ERR_PARTY_FULL = 'ERR_PARTY_FULL',
  ERR_NOT_PARTY_LEADER = 'ERR_NOT_PARTY_LEADER',

  // IAP
  ERR_INVALID_RECEIPT = 'ERR_INVALID_RECEIPT',
  ERR_RECEIPT_ALREADY_USED = 'ERR_RECEIPT_ALREADY_USED',
  ERR_INSUFFICIENT_FUNDS = 'ERR_INSUFFICIENT_FUNDS',

  // System
  ERR_INTERNAL = 'ERR_INTERNAL',
  ERR_MAINTENANCE = 'ERR_MAINTENANCE',
}

// ============================================================
// SECTION 2: SOCKET EVENTS (Naming Constants)
// @see docs/v0.1.0/05-Networking.md - Section 3
// ============================================================

/**
 * Socket Event Names - Single Source of Truth
 * Use these constants instead of hardcoded strings!
 */
export const SocketEvents = {
  // === Authentication ===
  AUTH_VERIFY: 'auth:verify',

  // === Connection (Server → Client) ===
  CONNECTED: 'connected',
  ERROR: 'error',
  KICKED: 'kicked',

  // === Room Events ===
  ROOM_CREATE: 'room:create',
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_READY: 'room:ready',
  ROOM_CREATED: 'room:created',
  ROOM_JOINED: 'room:joined',
  ROOM_PLAYER_JOINED: 'room:player:joined',
  ROOM_PLAYER_LEFT: 'room:player:left',
  ROOM_PLAYER_READY: 'room:player:ready',
  ROOM_PLAYER_DISCONNECTED: 'room:player:disconnected',

  // === Game Events ===
  GAME_PLAY: 'game:play',
  GAME_SELECT_TARGET: 'game:select_target',
  GAME_START: 'game:start',
  GAME_STATE: 'game:state',
  GAME_TURN: 'game:turn',
  GAME_PLAYED: 'game:played',
  GAME_MATCH: 'game:match',
  GAME_SEAL: 'game:seal',
  GAME_ROUND_END: 'game:round:end',
  GAME_END: 'game:end',
  GAME_AWAITING_TARGET: 'game:awaiting_target',

  // === Matchmaking ===
  MATCH_QUEUE: 'match:queue',
  MATCH_CANCEL: 'match:cancel',
  MATCH_SEARCHING: 'match:searching',
  MATCH_FOUND: 'match:found',
  MATCH_CANCELLED: 'match:cancelled',

  // === Social ===
  FRIEND_REQUEST_SEND: 'friend:request:send',
  FRIEND_REQUEST_RECEIVED: 'friend:request:received',
  FRIEND_REQUEST_RESPOND: 'friend:request:respond',
  FRIEND_ADDED: 'friend:added',
  FRIEND_REMOVED: 'friend:removed',

  // === Party ===
  PARTY_CREATE: 'party:create',
  PARTY_INVITE: 'party:invite',
  PARTY_JOIN: 'party:join',
  PARTY_LEAVE: 'party:leave',
  PARTY_UPDATED: 'party:updated',

  // === Chat (Quick Chat) ===
  CHAT_QUICK: 'chat:quick',
  CHAT_EMOJI: 'chat:emoji',

  // === Presence ===
  PRESENCE_UPDATE: 'presence:update',
} as const;

export type SocketEventName = (typeof SocketEvents)[keyof typeof SocketEvents];

// ============================================================
// SECTION 3: CARD & GAME STATE INTERFACES
// ============================================================

/**
 * Card Interface
 * @see docs/v0.1.0/03-GameEngine.md - Section 4.1
 */
export interface ICard {
  id: string;
  suit: CardSuit;
  rank: CardRank;
}

/**
 * Card Location (Server-side tracking)
 */
export interface ICardLocation {
  zone: CardZone;
  ownerId?: string;
  position?: number;
  isAccessible: boolean;
}

/**
 * Match Location - Where a match was found
 * @see docs/v0.1.0/03-GameEngine.md - Section 5.1
 */
export interface IMatchLocation {
  zone: 'center' | 'pool' | 'penalty';
  ownerId?: string;
  cards: ICard[];
  priority: number;
}

/**
 * Penalty Stack (Server State)
 */
export interface IPenaltyStack {
  ownerId: string;
  cards: ICard[];
  isSealed: boolean;
  sealedAtIndex?: number;
}

/**
 * Seal Event - Emitted when stack is sealed
 */
export interface ISealEvent {
  playerId: string;
  sealedRank: CardRank;
  sealedCards: ICard[];
  buriedCards: ICard[];
  lockedPenaltyPoints: number;
}

/**
 * Server Game State (Full Authoritative)
 * ⚠️ NEVER send this to clients!
 * @see docs/v0.1.0/03-GameEngine.md - Section 2.3
 */
export interface IServerGameState {
  roomId: string;
  phase: GamePhase;
  round: {
    roundNumber: number;
    dealPhase?: number;
  };
  turn: {
    currentPlayerId: string;
    currentPlayerIndex: number;
    timeRemaining: number;
    turnStartedAt: string;
    pendingMove?: {
      card: ICard;
      matchOptions: IMatchLocation[];
      selectionDeadline: string;
    };
  };
  deck: ICard[];
  hands: Map<string, ICard[]>;
  pool: { cards: ICard[] };
  penaltySlots: Map<string, IPenaltyStack>;
  openCenter: { cards: (ICard | null)[] };
  players: IServerPlayerState[];
  turnOrder: string[];
  actionLog: IGameAction[];
  cardLocations: Map<string, ICardLocation>;
}

/**
 * Client Game View (Masked State)
 * This is safe to send to clients
 * @see docs/v0.1.0/03-GameEngine.md - Section 2.4
 */
export interface IClientGameView {
  roomId: string;
  phase: GamePhase;
  round: number;
  myHand: ICard[];
  myIndex: number;
  opponents: IClientPlayerState[];
  openCenter: (ICard | null)[];
  poolTopCard: ICard | null;
  penaltySlots: IClientPenaltySlot[];
  currentPlayerId: string;
  turnTimeRemaining: number;
  isAwaitingMyTarget?: boolean;
  validTargets?: IMatchLocation[];
}

/**
 * Server Player State (Internal)
 */
export interface IServerPlayerState {
  id: string;
  odindexerId: string;
  nickname: string;
  avatarUrl?: string;
  seatIndex: number;
  isConnected: boolean;
  isReady: boolean;
}

/**
 * Client Player State (Masked - for opponents)
 */
export interface IClientPlayerState {
  id: string;
  nickname: string;
  avatarUrl?: string;
  cardCount: number;
  isConnected: boolean;
  seatIndex: number;
}

/**
 * Client Penalty Slot View
 */
export interface IClientPenaltySlot {
  playerId: string;
  topCards: ICard[];
  buriedCount: number;
  isSealed: boolean;
}

/**
 * Game Action (for replay/audit)
 */
export interface IGameAction {
  actionId: string;
  playerId: string;
  actionType: 'play_card' | 'select_target' | 'timeout';
  timestamp: string;
  card?: ICard;
  targetPlayerId?: string;
  result?: PlayResult;
}

// ============================================================
// SECTION 4: USER & PROFILE INTERFACES
// ============================================================

/**
 * User Profile (Database Document)
 * @see docs/v0.1.0/04-Database.md - Section 2.2
 */
export interface IUserProfile {
  /** Firebase UID */
  uid: string;
  /** Display name */
  nickname: string;
  /** Email address */
  email: string;
  /** Avatar URL (Cloudflare R2) */
  avatarUrl?: string;
  /** Current ELO rating */
  elo: number;
  /** Player rank tier */
  rank: PlayerRank;
  /** Total games played */
  gamesPlayed: number;
  /** Total games won (1st place) */
  gamesWon: number;
  /** Wallet balance */
  wallet: {
    coins: number;
    gems: number;
  };
  /** Friend list (UIDs) */
  friendIds: string[];
  /** Blocked users (UIDs) */
  blockedIds: string[];
  /** Account creation timestamp */
  createdAt: string;
  /** Last online timestamp */
  lastSeen: string;
  /** Ban status */
  isBanned: boolean;
  /** Ban reason (if banned) */
  banReason?: string;
}

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
 * Match Result (Database Document)
 */
export interface IMatchResult {
  matchId: string;
  roomId: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  matchType: MatchType;
  players: IPlayerMatchResult[];
  rounds: IRoundResult[];
}

/**
 * Player's result in a match
 */
export interface IPlayerMatchResult {
  odindexerId: string;
  odindexerName: string;
  placement: number;
  totalPenaltyPoints: number;
  eloChange: number;
  newElo: number;
}

/**
 * Single round result
 */
export interface IRoundResult {
  roundNumber: number;
  scores: { odindexerId: string; penaltyPoints: number }[];
}

// ============================================================
// SECTION 5: REPOSITORY INTERFACES (for DI/Mocking)
// This is the KEY section for parallel development!
// ============================================================

/**
 * User Repository Interface
 * DEV2 can mock this; DEV3 implements with Firestore
 * @see docs/v0.1.0/02-Architecture.md - Section 2.5 (DIP)
 */
export interface IUserRepository {
  findById(uid: string): Promise<IUserProfile | null>;
  findByNickname(nickname: string): Promise<IUserProfile | null>;
  create(
    user: Omit<IUserProfile, 'createdAt' | 'lastSeen'>,
  ): Promise<IUserProfile>;
  update(uid: string, data: Partial<IUserProfile>): Promise<IUserProfile>;
  updateStats(uid: string, gameResult: IPlayerMatchResult): Promise<void>;
  updateLastSeen(uid: string): Promise<void>;
  addFriend(uid: string, friendUid: string): Promise<void>;
  removeFriend(uid: string, friendUid: string): Promise<void>;
  blockUser(uid: string, blockedUid: string): Promise<void>;
  unblockUser(uid: string, blockedUid: string): Promise<void>;
}

/**
 * Match Repository Interface
 * DEV2 calls this to save game results
 */
export interface IMatchRepository {
  save(match: IMatchResult): Promise<void>;
  findById(matchId: string): Promise<IMatchResult | null>;
  findByPlayer(uid: string, limit?: number): Promise<IMatchResult[]>;
  findRecent(limit?: number): Promise<IMatchResult[]>;
}

/**
 * Leaderboard Repository Interface
 */
export interface ILeaderboardRepository {
  getTopPlayers(limit?: number): Promise<ILeaderboardEntry[]>;
  getPlayerRank(uid: string): Promise<number | null>;
  getAroundPlayer(uid: string, range?: number): Promise<ILeaderboardEntry[]>;
  updateScore(uid: string, newElo: number): Promise<void>;
}

/**
 * Leaderboard Entry
 */
export interface ILeaderboardEntry {
  rank: number;
  odindexerId: string;
  odindexerName: string;
  avatarUrl?: string;
  elo: number;
  playerRank: PlayerRank;
}

/**
 * Game State Repository Interface (Redis)
 * For state persistence/recovery
 */
export interface IGameStateRepository {
  saveState(roomId: string, state: IServerGameState): Promise<void>;
  loadState(roomId: string): Promise<IServerGameState | null>;
  deleteState(roomId: string): Promise<void>;
  exists(roomId: string): Promise<boolean>;
  setExpiry(roomId: string, seconds: number): Promise<void>;
}

// ============================================================
// SECTION 6: SOCKET PAYLOAD INTERFACES
// @see docs/v0.1.0/05-Networking.md - Section 3.4
// ============================================================

// --- Client → Server Payloads ---

export interface PlayCardPayload {
  cardId: string;
}

export interface SelectTargetPayload {
  zone: 'center' | 'pool' | 'penalty';
  ownerId?: string;
  slotIndex?: number;
}

export interface CreateRoomPayload {
  type: RoomType;
}

export interface JoinRoomPayload {
  roomId?: string;
  inviteCode?: string;
}

export interface QueueMatchPayload {
  matchType: MatchType;
  partyId?: string;
}

export interface QuickChatPayload {
  messageId: string; // Predefined message ID
}

export interface EmojiReactionPayload {
  emoji: string;
  targetPlayerId?: string;
}

// --- Server → Client Payloads ---

export interface ConnectedPayload {
  userId: string;
  serverTime: string;
}

export interface ErrorPayload {
  code: ErrorCode;
  message?: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface RoomCreatedPayload {
  roomId: string;
  inviteCode: string;
}

export interface RoomJoinedPayload {
  roomId: string;
  players: IClientPlayerState[];
  hostId: string;
}

export interface GameStartPayload {
  roomId: string;
  players: IClientPlayerState[];
  turnOrder: string[];
  firstPlayerId: string;
}

export interface CardPlayedPayload {
  playerId: string;
  card: ICard;
  result: PlayResult;
  matchedFrom?: IMatchLocation;
  targetPlayerId?: string;
  newPoolTopCard?: ICard | null;
}

export interface SealPayload {
  playerId: string;
  sealedRank: CardRank;
  stackSize: number;
  lockedPoints: number;
}

export interface RoundEndPayload {
  roundNumber: number;
  scores: { playerId: string; penaltyPoints: number }[];
  nextRound?: number;
}

export interface GameEndPayload {
  matchId: string;
  duration: number;
  results: IPlayerMatchResult[];
}

export interface AwaitingTargetPayload {
  playerId: string;
  card: ICard;
  validTargets: IMatchLocation[];
  timeoutSeconds: number;
}

// ============================================================
// SECTION 7: SERVICE INTERFACES (for DI)
// ============================================================

/**
 * Game Engine Interface
 * The core game logic service
 */
export interface IGameEngine {
  createGame(roomId: string, players: IServerPlayerState[]): IServerGameState;
  playCard(
    state: IServerGameState,
    playerId: string,
    cardId: string,
  ): CardPlayedPayload;
  selectTarget(
    state: IServerGameState,
    playerId: string,
    target: SelectTargetPayload,
  ): CardPlayedPayload;
  handleTimeout(state: IServerGameState, playerId: string): void;
  getMaskedState(state: IServerGameState, forPlayerId: string): IClientGameView;
  calculateFinalScores(state: IServerGameState): IPlayerMatchResult[];
}

/**
 * Seal Service Interface
 */
export interface ISealService {
  initializeAccessibility(): void;
  onCardBuried(card: ICard): void;
  onCardExposed(card: ICard): void;
  getAccessibleCount(rank: CardRank): number;
  isPileSealed(stack: IPenaltyStack, state: IServerGameState): boolean;
  checkAndApplySeals(state: IServerGameState): ISealEvent[];
}

/**
 * Matchmaking Service Interface
 */
export interface IMatchmakingService {
  addToQueue(userId: string, type: MatchType, partyId?: string): void;
  removeFromQueue(userId: string): void;
  getQueuePosition(userId: string): number | null;
  processQueue(): { matched: string[][]; roomIds: string[] };
}

// ============================================================
// SECTION 8: DEPENDENCY INJECTION TOKENS
// Use these when registering providers in NestJS modules
// ============================================================

export const DI_TOKENS = {
  USER_REPOSITORY: 'IUserRepository',
  MATCH_REPOSITORY: 'IMatchRepository',
  LEADERBOARD_REPOSITORY: 'ILeaderboardRepository',
  GAME_STATE_REPOSITORY: 'IGameStateRepository',
  GAME_ENGINE: 'IGameEngine',
  SEAL_SERVICE: 'ISealService',
  MATCHMAKING_SERVICE: 'IMatchmakingService',
} as const;

// ============================================================
// SECTION 9: CONSTANTS
// ============================================================

/**
 * Card Penalty Values
 * @see docs/v0.1.0/10-GameRules.md - Section 2
 */
export const CARD_PENALTIES: Record<CardRank, number> = {
  [CardRank.THREE]: 30, // ⚠️ HIGHEST - The danger card!
  [CardRank.JACK]: 20,
  [CardRank.QUEEN]: 15,
  [CardRank.ACE]: 11,
  [CardRank.KING]: 10,
  [CardRank.TEN]: 10,
  [CardRank.NINE]: 9,
  [CardRank.EIGHT]: 8,
  [CardRank.SEVEN]: 7,
  [CardRank.SIX]: 6,
  [CardRank.FIVE]: 5,
  [CardRank.FOUR]: 4,
  [CardRank.TWO]: 2,
};

/**
 * Game Configuration
 */
export const GAME_CONFIG = {
  /** Maximum players per game */
  MAX_PLAYERS: 4,
  /** Number of rounds per game */
  ROUNDS_PER_GAME: 3,
  /** Cards per dealing phase */
  CARDS_PER_DEAL: 4,
  /** Open center card count */
  OPEN_CENTER_SIZE: 4,
  /** Turn timeout in seconds */
  TURN_TIMEOUT_SECONDS: 30,
  /** Target selection timeout in seconds */
  TARGET_SELECTION_TIMEOUT: 10,
  /** Reconnection window in seconds */
  RECONNECT_WINDOW_SECONDS: 60,
} as const;

/**
 * ELO Configuration
 * @see docs/v0.1.0/06-ELO-Rating.md
 */
export const ELO_CONFIG = {
  /** Starting ELO for new players */
  STARTING_ELO: 1000,
  /** K-factor for ELO calculation */
  K_FACTOR: 32,
  /** Rank thresholds */
  RANK_THRESHOLDS: {
    [PlayerRank.BRONZE]: 0,
    [PlayerRank.SILVER]: 1000,
    [PlayerRank.GOLD]: 1200,
    [PlayerRank.PLATINUM]: 1400,
    [PlayerRank.DIAMOND]: 1600,
    [PlayerRank.MASTER]: 1800,
    [PlayerRank.GRANDMASTER]: 2000,
  },
} as const;
