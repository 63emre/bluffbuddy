/**
 * ==========================================================
 * CARD INTERFACES
 * ==========================================================
 * BluffBuddy Online - Card Type Definitions
 * 
 * @owner DEV2 (Game Engine)
 * @iteration v0.1.0
 * @see docs/v0.1.0/03-GameEngine.md - Section 2
 * 
 * DEV RESPONSIBILITIES:
 * - DEV2: Card model and related interfaces
 * ==========================================================
 */

// ----------------------------------------------------------
// ITERATION v0.1.0 - Core card interfaces
// UPDATED: Added CardLocation, ServerPoolState, ServerPenaltyStack
// @see docs/v0.1.0/03-GameEngine.md - Section 4
// ----------------------------------------------------------

import { CardSuit, CardRank, CardZone } from './enums';

/**
 * Card Interface
 * Represents a single playing card
 * @see docs/v0.1.0/03-GameEngine.md - Section 4.1
 */
export interface Card {
  /** Unique card identifier (e.g., "Q-hearts") */
  id: string;
  /** Card suit */
  suit: CardSuit;
  /** Card rank */
  rank: CardRank;
}

/**
 * Masked Card Interface
 * Used for cards that should be hidden from a player
 * (e.g., other players' hands)
 */
export interface MaskedCard {
  /** Card ID is hidden */
  id: null;
  /** Card is face-down */
  isFaceDown: true;
}

/**
 * Card Location (Server-side tracking)
 * Tracks where every card is in the game
 * @see docs/v0.1.0/03-GameEngine.md - Section 4.1
 */
export interface CardLocation {
  /** Which zone the card is in */
  zone: CardZone;
  /** Player ID if in hand or penalty slot */
  ownerId?: string;
  /** Index position in stack (0 = bottom, last = top) */
  position?: number;
  /** Can this card be matched/taken right now? */
  isAccessible: boolean;
}

// ============================================================
// SERVER-SIDE STATE (Full Information)
// These are used only on the server - never sent to clients
// ============================================================

/**
 * Server Pool State (Havuz) - FULL
 * Server keeps ALL cards in pool for seal calculation
 * @see docs/v0.1.0/03-GameEngine.md - Section 2.3
 */
export interface ServerPoolState {
  /** All cards in pool, index 0 = bottom, last = top */
  cards: Card[];
}

/**
 * Server Penalty Stack - FULL
 * Complete penalty slot data (server-side)
 * @see docs/v0.1.0/03-GameEngine.md - Section 5.3
 */
export interface ServerPenaltyStack {
  /** Player who owns this penalty slot */
  ownerId: string;
  /** All cards in stack, index 0 = bottom, last = top */
  cards: Card[];
  /** Whether this stack is sealed (Mühür) */
  isSealed: boolean;
  /** Index where seal starts (cards at/above this are sealed) */
  sealedAtIndex?: number;
}

// ============================================================
// CLIENT-SIDE STATE (Masked Information)
// These are sent to clients - hide sensitive data
// ============================================================

/**
 * Client Pool State (Havuz) - MASKED
 * Client only sees top card
 */
export interface ClientPoolState {
  /** Top card visible to all (null if empty) */
  topCard: Card | null;
  /** Total cards in pool (count only, hidden) */
  remainingCount: number;
}

/**
 * Client Penalty Slot State - MASKED
 * What clients can see about a penalty slot
 */
export interface ClientPenaltySlotState {
  /** Player who owns this penalty slot */
  ownerId: string;
  /** Visible top cards (same rank group on top) */
  topCards: Card[];
  /** Count of buried cards beneath (hidden) */
  buriedCount: number;
  /** Whether slot is sealed (Mühür - cannot be taken) */
  isSealed: boolean;
}

/**
 * Open Center State
 * Açık Orta - 4 face-up cards in the center
 * (Same for server and client - all visible)
 */
export interface OpenCenterState {
  /** Array of 4 positions, each can have a card or be empty */
  cards: (Card | null)[];
}

// ============================================================
// LEGACY ALIASES (for backward compatibility)
// ============================================================

/** @deprecated Use ClientPoolState instead */
export type PoolState = ClientPoolState;

/** @deprecated Use ClientPenaltySlotState instead */
export type PenaltySlotState = ClientPenaltySlotState;
