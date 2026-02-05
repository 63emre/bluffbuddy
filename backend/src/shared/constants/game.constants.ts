/**
 * ==========================================================
 * CONSTANTS - GAME
 * ==========================================================
 * BluffBuddy Online - Game Constants
 *
 * @owner DEV2 (Game Engine)
 * @version v0.1.0
 * @see docs/v0.1.0/10-GameRules.md
 *
 * NOTE: Core constants are in contracts.ts (CARD_PENALTIES, GAME_CONFIG)
 * This file contains implementation-specific constants.
 * ==========================================================
 */

// Re-export from contracts
export { CARD_PENALTIES, GAME_CONFIG, ELO_CONFIG } from '../contracts';
export { CardSuit, CardRank } from '../contracts';

// ============================================================
// DECK CONSTANTS
// ============================================================

/** Total cards in a standard deck */
export const DECK_SIZE = 52;

/** All suits in order */
export const ALL_SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const;

/** All ranks in order (A low, K high) */
export const ALL_RANKS = [
  'A',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
] as const;

/** Cards per suit */
export const CARDS_PER_SUIT = 13;

// ============================================================
// PLAYER CONSTANTS
// ============================================================

/** Minimum players to start */
export const MIN_PLAYERS = 4;

/** Maximum players per game */
export const MAX_PLAYERS = 4;

/** Starting seat index (first dealer) */
export const STARTING_SEAT = 0;

// ============================================================
// TIMING CONSTANTS (in milliseconds)
// ============================================================

/** Turn timeout */
export const TURN_TIMEOUT_MS = 30_000;

/** Target selection timeout */
export const TARGET_SELECTION_TIMEOUT_MS = 10_000;

/** Reconnection window */
export const RECONNECT_WINDOW_MS = 60_000;

/** Delay before dealing animation */
export const DEAL_DELAY_MS = 500;

/** Delay between card deals */
export const DEAL_INTERVAL_MS = 200;

/** Pause after round ends */
export const ROUND_END_PAUSE_MS = 3_000;

/** Pause after game ends before results */
export const GAME_END_PAUSE_MS = 2_000;

// ============================================================
// GAME FLOW CONSTANTS
// ============================================================

/** Total rounds per game */
export const ROUNDS_PER_GAME = 3;

/** Cards dealt to each player per round */
export const CARDS_PER_PLAYER_PER_ROUND = 4;

/** Cards in open center */
export const OPEN_CENTER_SIZE = 4;

/** Total cards dealt per dealing phase */
export const CARDS_PER_DEAL_PHASE = 4;

/** Number of dealing phases per round */
export const DEAL_PHASES_PER_ROUND = 3;

// ============================================================
// TURN DIRECTION
// ============================================================

/**
 * Turn direction: counter-clockwise
 * Seat order: 0 → 3 → 2 → 1 → 0 ...
 */
export const TURN_DIRECTION = -1;

/**
 * Get next player seat index
 * @param currentSeat Current seat (0-3)
 * @returns Next seat index
 */
export function getNextSeat(currentSeat: number): number {
  return (currentSeat + MAX_PLAYERS + TURN_DIRECTION) % MAX_PLAYERS;
}

/**
 * Get turn order array starting from a seat
 * @param startingSeat Starting seat index
 * @returns Array of seat indices in turn order
 */
export function getTurnOrder(startingSeat: number): number[] {
  const order: number[] = [];
  let current = startingSeat;
  for (let i = 0; i < MAX_PLAYERS; i++) {
    order.push(current);
    current = getNextSeat(current);
  }
  return order;
}

// ============================================================
// QUICK CHAT MESSAGES
// ============================================================

/** Predefined quick chat message IDs and their text */
export const QUICK_CHAT_MESSAGES: Record<string, { tr: string; en: string }> = {
  greeting: { tr: 'Selam!', en: 'Hello!' },
  good_luck: { tr: 'Bol şans!', en: 'Good luck!' },
  well_played: { tr: 'Güzel hamle!', en: 'Well played!' },
  oops: { tr: 'Eyvah!', en: 'Oops!' },
  thanks: { tr: 'Teşekkürler!', en: 'Thanks!' },
  gg: { tr: 'İyi oyundu!', en: 'Good game!' },
};

/** Available emoji reactions */
export const EMOJI_REACTIONS = [
  'laugh',
  'cry',
  'angry',
  'thinking',
  'fire',
  'clap',
] as const;
