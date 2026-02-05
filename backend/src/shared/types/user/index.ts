/**
 * ==========================================================
 * USER TYPES
 * ==========================================================
 * BluffBuddy Online - User Type Definitions
 *
 * @owner DEV3 (Social/Auth)
 * @version v0.1.0
 *
 * NOTE: Canonical interfaces are in contracts.ts
 * This file re-exports and adds implementation-specific types.
 * ==========================================================
 */

// Re-export from contracts (single source of truth)
export {
  IUserProfile,
  PlayerRank,
  IMatchResult,
  IPlayerMatchResult,
  IRoundResult,
  ILeaderboardEntry,
} from '../../contracts';

// ============================================================
// ADDITIONAL IMPLEMENTATION-SPECIFIC TYPES
// ============================================================

/**
 * User Session (Socket connection tracking)
 * @owner DEV1
 */
export interface UserSession {
  /** Firebase UID */
  userId: string;
  /** Socket ID */
  socketId: string;
  /** Session creation time */
  connectedAt: Date;
  /** Current room (if any) */
  roomId?: string;
  /** IP address (for rate limiting) */
  ipAddress: string;
}

/**
 * User Preferences (client-side settings synced to server)
 * @owner DEV3
 */
export interface UserPreferences {
  /** Sound effects enabled */
  soundEnabled: boolean;
  /** Music enabled */
  musicEnabled: boolean;
  /** Vibration enabled (mobile) */
  vibrationEnabled: boolean;
  /** Quick chat enabled */
  quickChatEnabled: boolean;
  /** Notification settings */
  notifications: {
    friendRequests: boolean;
    partyInvites: boolean;
    matchFound: boolean;
  };
}

/**
 * User Statistics (detailed game stats)
 * @owner DEV3
 */
export interface UserStats {
  /** Total games played */
  gamesPlayed: number;
  /** Games won (1st place) */
  gamesWon: number;
  /** Games in top 2 */
  gamesTop2: number;
  /** Total penalty points accumulated (all-time) */
  totalPenaltyPoints: number;
  /** Best ELO achieved */
  peakElo: number;
  /** Current win streak */
  currentWinStreak: number;
  /** Best win streak ever */
  bestWinStreak: number;
  /** Seals created */
  sealsCreated: number;
  /** Times sealed by others */
  timesSealed: number;
}

/**
 * Online Status for presence system
 * @owner DEV3
 */
export type OnlineStatus =
  | 'online'
  | 'in_game'
  | 'in_menu'
  | 'away'
  | 'offline';

/**
 * Presence Info (for friends list)
 */
export interface PresenceInfo {
  status: OnlineStatus;
  lastSeen?: Date;
  currentActivity?: string;
  currentRoomId?: string;
}
