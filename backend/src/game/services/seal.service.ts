/**
 * ==========================================================
 * SEAL SERVICE (Mühür Servisi)
 * ==========================================================
 * BluffBuddy Online - Seal (Mühür) Calculation Service
 *
 * @owner DEV2 (Game Engine)
 * @iteration v0.1.0
 * @see docs/v0.1.0/03-GameEngine.md - Section 6 (Seal Algorithm)
 * @see docs/v0.1.0/10-GameRules.md - Section 6 (Mühür Mekaniği)
 *
 * CRITICAL: This service implements the seal detection algorithm
 *
 * SEAL CONDITIONS:
 * 1. Tam Mühür (Complete Seal): 4 cards of same rank in one stack
 * 2. Kayıp Kart Mühürü (Lost Card Seal): All accessible copies
 *    of a rank are in one stack (no key card available anywhere)
 *
 * The "Golden Question" for seal check:
 * "Bu ceza slotunun tepesindeki kartları eşleştirip alabilecek
 *  anahtar kart şu an evrende ulaşılabilir durumda mı?"
 * If NO → Slot is SEALED!
 *
 * DEV RESPONSIBILITIES:
 * - DEV2: All seal calculation logic
 * ==========================================================
 */

import { Injectable } from '@nestjs/common';
import {
  Card,
  CardLocation,
  ServerPenaltyStack,
} from '../../shared/types/game/card.interface';
import { ServerGameState } from '../../shared/types/game/state.interface';
import { CardRank, CardZone } from '../../shared/types/game/enums';

/**
 * Seal Event
 * Emitted when a stack becomes sealed
 */
export interface SealEvent {
  /** Player whose stack was sealed */
  playerId: string;
  /** Rank that was sealed */
  sealedRank: CardRank;
  /** Cards in the sealed group */
  sealedCards: Card[];
  /** Cards buried under the seal */
  buriedCards: Card[];
  /** Total penalty points locked in */
  lockedPenaltyPoints: number;
}

/**
 * Accessibility Tracker
 * Tracks how many copies of each rank are accessible
 */
interface AccessibilityTracker {
  /** Count of accessible cards per rank */
  accessibleCounts: Map<CardRank, number>;
}

/**
 * SealService
 * Seal (Mühür) calculation service for BluffBuddy
 *
 * @see docs/v0.1.0/03-GameEngine.md - Section 6
 * @see docs/v0.1.0/10-GameRules.md - Section 6
 */
@Injectable()
export class SealService implements AccessibilityTracker {
  accessibleCounts: Map<CardRank, number> = new Map();

  /**
   * Initialize accessibility tracking
   * Called at game start - all 4 copies of each rank are accessible
   */
  initializeAccessibility(): void {
    const allRanks: CardRank[] = [
      CardRank.ACE,
      CardRank.TWO,
      CardRank.THREE,
      CardRank.FOUR,
      CardRank.FIVE,
      CardRank.SIX,
      CardRank.SEVEN,
      CardRank.EIGHT,
      CardRank.NINE,
      CardRank.TEN,
      CardRank.JACK,
      CardRank.QUEEN,
      CardRank.KING,
    ];

    for (const rank of allRanks) {
      this.accessibleCounts.set(rank, 4); // 4 copies of each rank
    }
  }

  /**
   * Mark a card as buried (inaccessible)
   * Called when a card gets buried under a sealed stack
   *
   * @param card Card that became buried
   */
  onCardBuried(card: Card): void {
    const current = this.accessibleCounts.get(card.rank) || 0;
    if (current > 0) {
      this.accessibleCounts.set(card.rank, current - 1);
    }
  }

  /**
   * Mark a card as accessible again
   * Called when a card is exposed (e.g., top group removed)
   *
   * @param card Card that became accessible
   */
  onCardExposed(card: Card): void {
    const current = this.accessibleCounts.get(card.rank) || 0;
    this.accessibleCounts.set(card.rank, current + 1);
  }

  /**
   * Get accessible count for a rank
   */
  getAccessibleCount(rank: CardRank): number {
    return this.accessibleCounts.get(rank) || 0;
  }

  /**
   * THE MAIN SEAL CHECK ALGORITHM
   *
   * "Bu ceza slotunun tepesindeki kartları eşleştirip alabilecek
   *  anahtar kart şu an evrende ulaşılabilir durumda mı?"
   *
   * @param stack Penalty stack to check
   * @param gameState Current game state (for hand checking)
   * @returns true if stack should be sealed
   *
   * @see docs/v0.1.0/03-GameEngine.md - Section 6.5
   */
  isPileSealed(stack: ServerPenaltyStack, gameState: ServerGameState): boolean {
    // Empty stacks cannot be sealed
    if (stack.cards.length === 0) {
      return false;
    }

    // Already sealed stacks stay sealed
    if (stack.isSealed) {
      return true;
    }

    // Get the rank of the top card(s)
    const topRank = stack.cards[stack.cards.length - 1].rank;

    // Count how many cards of this rank are in the top group
    const topGroupCount = this.countTopGroup(stack, topRank);

    // ----------------------------------------------------------
    // RULE 1: Complete Set (Tam Mühür)
    // If 4 cards of same rank are on top → SEALED
    // "Dışarıda 5. bir kart olamayacağı için mühürlenir"
    // ----------------------------------------------------------
    if (topGroupCount === 4) {
      return true;
    }

    // ----------------------------------------------------------
    // RULE 2: Check if a KEY CARD exists anywhere accessible
    // "Anahtar kart evrende erişilebilir durumda mı?"
    // Key cards can be in: Player Hands OR Open Center
    // ----------------------------------------------------------

    // CHECK 2a: Player Hands
    // If ANY player has this rank in their hand → NOT sealed
    for (const [_playerId, hand] of gameState.hands) {
      for (const card of hand) {
        if (card.rank === topRank) {
          // Key card found in someone's hand - NOT sealed
          return false;
        }
      }
    }

    // CHECK 2b: Open Center (Açık Orta)
    // If this rank exists in Open Center → NOT sealed
    // Because any player can match it with their hand card
    // ⚠️ CRITICAL: This was missing before! Bug fix v0.1.1
    if (gameState.openCenter?.cards) {
      for (const card of gameState.openCenter.cards) {
        // Open center may have null slots (empty positions)
        if (card && card.rank === topRank) {
          // Key card found in Open Center - NOT sealed
          return false;
        }
      }
    }

    // ----------------------------------------------------------
    // If we reach here:
    // - No player has the key card in hand
    // - No key card in Open Center
    // - The cards of this rank are buried in pool or locked
    // → This means the stack is SEALED (Kayıp Kart Mühürü)
    // ----------------------------------------------------------
    return true;
  }

  /**
   * Count cards in the top matching group
   *
   * @param stack Penalty stack
   * @param targetRank Rank to count
   * @returns Number of cards of targetRank in top group
   */
  private countTopGroup(
    stack: ServerPenaltyStack,
    targetRank: CardRank,
  ): number {
    let count = 0;

    // Read from top (end of array) going down
    for (let i = stack.cards.length - 1; i >= 0; i--) {
      if (stack.cards[i].rank === targetRank) {
        count++;
      } else {
        break; // Different rank = stop counting
      }
    }

    return count;
  }

  /**
   * Get the top matching group from a stack
   *
   * @param stack Penalty stack
   * @param targetRank Rank to match
   * @returns Cards in the top group (empty if no match)
   */
  getTopMatchingGroup(stack: ServerPenaltyStack, targetRank: CardRank): Card[] {
    // Sealed stacks cannot be accessed
    if (stack.isSealed) {
      return [];
    }

    // Empty stack
    if (stack.cards.length === 0) {
      return [];
    }

    // Check if top card matches
    const topCard = stack.cards[stack.cards.length - 1];
    if (topCard.rank !== targetRank) {
      return [];
    }

    // Collect all consecutive cards of same rank from top
    const topGroup: Card[] = [];
    for (let i = stack.cards.length - 1; i >= 0; i--) {
      if (stack.cards[i].rank === targetRank) {
        topGroup.push(stack.cards[i]);
      } else {
        break;
      }
    }

    // Return in bottom-to-top order
    return topGroup.reverse();
  }

  /**
   * Check all penalty stacks for seals after a move
   * Handles CASCADE SEALS: one seal can trigger another!
   *
   * @param gameState Current game state
   * @returns Array of seal events that occurred
   *
   * @see docs/v0.1.0/03-GameEngine.md - Section 6.3
   */
  checkAndApplySeals(gameState: ServerGameState): SealEvent[] {
    const sealEvents: SealEvent[] = [];

    for (const [playerId, stack] of gameState.penaltySlots) {
      // Skip already sealed stacks
      if (stack.isSealed) {
        continue;
      }

      // Check if this stack should be sealed
      if (this.isPileSealed(stack, gameState)) {
        // Apply the seal
        const sealEvent = this.applySeal(stack, playerId, gameState);
        sealEvents.push(sealEvent);
      }
    }

    // ----------------------------------------------------------
    // CASCADE CHECK
    // After sealing, some cards become buried (inaccessible)
    // This might trigger more seals!
    // ----------------------------------------------------------
    if (sealEvents.length > 0) {
      // Update accessibility counts for buried cards
      for (const event of sealEvents) {
        for (const card of event.buriedCards) {
          this.onCardBuried(card);

          // Update card location tracking
          const location = gameState.cardLocations.get(card.id);
          if (location) {
            location.isAccessible = false;
          }
        }
      }

      // Recursively check for cascade seals
      const cascadeSeals = this.checkAndApplySeals(gameState);
      sealEvents.push(...cascadeSeals);
    }

    return sealEvents;
  }

  /**
   * Apply seal to a stack
   *
   * @param stack Stack to seal
   * @param playerId Owner of the stack
   * @param gameState Current game state
   * @returns Seal event details
   */
  private applySeal(
    stack: ServerPenaltyStack,
    playerId: string,
    gameState: ServerGameState,
  ): SealEvent {
    const topRank = stack.cards[stack.cards.length - 1].rank;
    const topGroupCount = this.countTopGroup(stack, topRank);

    // Mark stack as sealed
    stack.isSealed = true;
    stack.sealedAtIndex = stack.cards.length - topGroupCount;

    // Identify sealed and buried cards
    const sealedCards: Card[] = [];
    const buriedCards: Card[] = [];

    for (let i = 0; i < stack.cards.length; i++) {
      const card = stack.cards[i];
      if (i >= stack.sealedAtIndex!) {
        sealedCards.push(card);
      } else {
        buriedCards.push(card);
      }
    }

    // Calculate locked penalty points
    const lockedPenaltyPoints = this.calculatePenaltyPoints(stack.cards);

    // Update card locations to mark as inaccessible
    for (const card of stack.cards) {
      const location = gameState.cardLocations.get(card.id);
      if (location) {
        location.isAccessible = false;
      }
    }

    return {
      playerId,
      sealedRank: topRank,
      sealedCards,
      buriedCards,
      lockedPenaltyPoints,
    };
  }

  /**
   * Calculate total penalty points for cards
   */
  private calculatePenaltyPoints(cards: Card[]): number {
    const CARD_VALUES: Record<CardRank, number> = {
      [CardRank.ACE]: 11,
      [CardRank.TWO]: 2,
      [CardRank.THREE]: 30,
      [CardRank.FOUR]: 4,
      [CardRank.FIVE]: 5,
      [CardRank.SIX]: 6,
      [CardRank.SEVEN]: 7,
      [CardRank.EIGHT]: 8,
      [CardRank.NINE]: 9,
      [CardRank.TEN]: 10,
      [CardRank.JACK]: 20,
      [CardRank.QUEEN]: 15,
      [CardRank.KING]: 10,
    };

    return cards.reduce((sum, card) => sum + CARD_VALUES[card.rank], 0);
  }

  /**
   * Build accessibility counts from current game state
   * Used for recovery/initialization
   */
  rebuildAccessibilityFromState(gameState: ServerGameState): void {
    // Reset all to 0
    this.initializeAccessibility();

    // Subtract inaccessible cards
    for (const [_cardId, location] of gameState.cardLocations) {
      if (!location.isAccessible) {
        // Find the card to get its rank
        const card = this.findCardById(_cardId, gameState);
        if (card) {
          this.onCardBuried(card);
        }
      }
    }
  }

  /**
   * Find a card by ID in the game state
   */
  private findCardById(
    cardId: string,
    gameState: ServerGameState,
  ): Card | null {
    // Check hands
    for (const [_playerId, hand] of gameState.hands) {
      const card = hand.find((c) => c.id === cardId);
      if (card) return card;
    }

    // Check open center
    for (const card of gameState.openCenter.cards) {
      if (card && card.id === cardId) return card;
    }

    // Check pool
    for (const card of gameState.pool.cards) {
      if (card.id === cardId) return card;
    }

    // Check penalty stacks
    for (const [_playerId, stack] of gameState.penaltySlots) {
      const card = stack.cards.find((c) => c.id === cardId);
      if (card) return card;
    }

    // Check deck
    for (const card of gameState.deck) {
      if (card.id === cardId) return card;
    }

    return null;
  }
}
