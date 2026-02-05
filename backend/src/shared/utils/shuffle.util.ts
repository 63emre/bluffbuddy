/**
 * ==========================================================
 * UTILITY - SHUFFLE
 * ==========================================================
 * BluffBuddy Online - Fisher-Yates Shuffle (Cryptographically Secure)
 *
 * @owner DEV2 (Game Engine)
 * @version v0.1.0
 * @see docs/v0.1.0/03-GameEngine.md - Section 4.2
 *
 * CRITICAL: This shuffle MUST use cryptographic randomness
 * for fair and unpredictable card distribution.
 * ==========================================================
 */

import { randomBytes } from 'crypto';

/**
 * Fisher-Yates shuffle with cryptographically secure randomness
 *
 * @param array Array to shuffle (not mutated)
 * @returns New shuffled array
 *
 * @example
 * const deck = generateDeck();
 * const shuffledDeck = shuffleArray(deck);
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i--) {
    // Generate cryptographically random index
    const randomBuffer = randomBytes(4);
    const randomValue = randomBuffer.readUInt32BE(0);
    const j = randomValue % (i + 1);

    // Swap elements
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Generate a cryptographically secure random integer in range [min, max]
 *
 * @param min Minimum value (inclusive)
 * @param max Maximum value (inclusive)
 * @returns Random integer
 */
export function secureRandomInt(min: number, max: number): number {
  const range = max - min + 1;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8) || 1;
  const maxValid = Math.floor(256 ** bytesNeeded / range) * range - 1;

  let randomValue: number;
  do {
    const randomBuffer = randomBytes(bytesNeeded);
    randomValue = 0;
    for (let i = 0; i < bytesNeeded; i++) {
      randomValue = (randomValue << 8) + randomBuffer[i];
    }
  } while (randomValue > maxValid);

  return min + (randomValue % range);
}

/**
 * Select a random starting player index
 *
 * @param playerCount Number of players
 * @returns Random player index (0 to playerCount-1)
 */
export function selectRandomStartingPlayer(playerCount: number): number {
  return secureRandomInt(0, playerCount - 1);
}
