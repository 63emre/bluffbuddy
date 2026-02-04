/**
 * ==========================================================
 * PLAYER INTERFACES
 * ==========================================================
 * BluffBuddy Online - Player Type Definitions
 * 
 * @owner DEV2 (Game Engine) + DEV3 (Social Features)
 * @iteration v0.1.0
 * @see docs/v0.1.0/03-GameEngine.md - Section 3
 * 
 * DEV RESPONSIBILITIES:
 * - DEV2: In-game player state interfaces
 * - DEV3: Player profile and social interfaces
 * ==========================================================
 */

// ----------------------------------------------------------
// ITERATION v0.1.0 - Core player interfaces
// TODO v0.1.1: Add player statistics tracking
// TODO v0.2.0: Add player customization (avatars, card backs)
// ----------------------------------------------------------

import { Card, PenaltySlotState } from './card.interface';
import { ConnectionStatus } from './enums';

/**
 * Base Player Interface
 * Core player identity
 * @owner DEV3
 */
export interface Player {
  /** Firebase UID */
  id: string;
  /** Display name */
  nickname: string;
  /** Avatar URL (optional) */
  avatarUrl?: string;
}

/**
 * Player in Game Room (Public View)
 * What other players can see about you
 * @owner DEV2
 */
export interface PublicPlayerState extends Player {
  /** Number of cards in hand (hidden) */
  cardCount: number;
  /** Is player ready to start */
  isReady: boolean;
  /** Connection status */
  connectionStatus: ConnectionStatus;
  /** Player's penalty slot state */
  penaltySlot: PenaltySlotState;
  /** Player seat index (0-3, counter-clockwise) */
  seatIndex: number;
}

/**
 * Player's Own View
 * Full state visible only to the player themselves
 * @owner DEV2
 */
export interface PrivatePlayerState extends PublicPlayerState {
  /** Player's hand (visible only to them) */
  hand: Card[];
}

/**
 * Player Game Result
 * Final standings after game ends
 * @owner DEV2
 */
export interface PlayerGameResult {
  /** Player ID */
  playerId: string;
  /** Player nickname */
  nickname: string;
  /** Final placement (1-4) */
  placement: number;
  /** Total penalty points accumulated */
  penaltyPoints: number;
  /** ELO change from this game */
  eloChange: number;
  /** New ELO after game */
  newElo: number;
}

/**
 * Player Profile (for social features)
 * @owner DEV3
 */
export interface PlayerProfile extends Player {
  /** Current ELO rating */
  elo: number;
  /** Total games played */
  gamesPlayed: number;
  /** Total games won (1st place) */
  gamesWon: number;
  /** Win rate percentage */
  winRate: number;
  /** Online status */
  isOnline: boolean;
  /** Last seen timestamp (ISO string) */
  lastSeen?: string;
}

/**
 * Friend List Entry
 * @owner DEV3
 */
export interface Friend extends Player {
  /** Is friend currently online */
  isOnline: boolean;
  /** Friendship established date */
  friendSince: string;
  /** Current status message (optional) */
  statusMessage?: string;
}

/**
 * Friend Request
 * @owner DEV3
 */
export interface FriendRequest {
  /** Request ID */
  id: string;
  /** Who sent the request */
  from: Player;
  /** Request timestamp */
  sentAt: string;
}
