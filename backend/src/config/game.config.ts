/**
 * ==========================================================
 * GAME CONFIGURATION
 * ==========================================================
 * BluffBuddy Online - Game Engine Configuration
 *
 * @owner DEV2 (Game Engine)
 * @version v0.2.0
 * @see docs/v0.1.0/03-GameEngine.md
 *
 * USAGE:
 * ```typescript
 * const turnTimeout = this.configService.get<number>('game.turnTimeoutSeconds');
 * const eloConfig = this.configService.get<EloConfig>('game.elo');
 * ```
 *
 * ENVIRONMENT VARIABLES:
 * - GAME_TURN_TIMEOUT: Turn timeout in seconds (default: 30)
 * - GAME_TARGET_SELECTION_TIMEOUT: Target selection timeout (default: 10)
 * - GAME_RECONNECT_GRACE_PERIOD: Reconnect grace period (default: 120)
 * - GAME_MAX_PLAYERS: Max players per game (default: 4)
 * - ELO_INITIAL: Initial ELO rating (default: 1000)
 * - ELO_K_FACTOR: K-factor for ELO calculation (default: 32)
 * ==========================================================
 */

import { registerAs } from '@nestjs/config';

/**
 * ELO System Configuration
 */
export interface EloConfig {
  /** Initial ELO rating for new players */
  initial: number;
  /** K-factor for rating changes */
  kFactor: number;
  /** Minimum ELO floor */
  min: number;
  /** Maximum ELO ceiling */
  max: number;
  /** Placement games before ranked */
  placementGames: number;
}

/**
 * Game Timing Configuration
 */
export interface GameTimingConfig {
  /** Turn timeout in seconds */
  turnTimeoutSeconds: number;
  /** Target selection timeout in seconds */
  targetSelectionTimeoutSeconds: number;
  /** Grace period for reconnection in seconds */
  reconnectGracePeriodSeconds: number;
  /** Delay between rounds in milliseconds */
  roundDelayMs: number;
  /** Deal animation delay in milliseconds */
  dealAnimationDelayMs: number;
}

/**
 * Game Rules Configuration
 */
export interface GameRulesConfig {
  /** Maximum players per game */
  maxPlayers: number;
  /** Minimum players to start */
  minPlayers: number;
  /** Cards dealt per deal phase */
  cardsPerDeal: number;
  /** Number of rounds per game */
  roundsPerGame: number;
  /** Points needed to trigger seal check */
  sealThreshold: number;
}

/**
 * Full Game Configuration Schema
 */
export interface GameConfig {
  /** Timing settings */
  timing: GameTimingConfig;
  /** Game rules */
  rules: GameRulesConfig;
  /** ELO system settings */
  elo: EloConfig;
}

/**
 * Game Configuration Factory
 * Registered under 'game' namespace
 */
export const gameConfig = registerAs(
  'game',
  (): GameConfig => ({
    timing: {
      turnTimeoutSeconds: parseInt(process.env.GAME_TURN_TIMEOUT || '30', 10),
      targetSelectionTimeoutSeconds: parseInt(
        process.env.GAME_TARGET_SELECTION_TIMEOUT || '10',
        10,
      ),
      reconnectGracePeriodSeconds: parseInt(
        process.env.GAME_RECONNECT_GRACE_PERIOD || '120',
        10,
      ),
      roundDelayMs: parseInt(process.env.GAME_ROUND_DELAY_MS || '2000', 10),
      dealAnimationDelayMs: parseInt(
        process.env.GAME_DEAL_ANIMATION_DELAY_MS || '500',
        10,
      ),
    },
    rules: {
      maxPlayers: parseInt(process.env.GAME_MAX_PLAYERS || '4', 10),
      minPlayers: parseInt(process.env.GAME_MIN_PLAYERS || '2', 10),
      cardsPerDeal: parseInt(process.env.GAME_CARDS_PER_DEAL || '4', 10),
      roundsPerGame: parseInt(process.env.GAME_ROUNDS_PER_GAME || '3', 10),
      sealThreshold: parseInt(process.env.GAME_SEAL_THRESHOLD || '4', 10),
    },
    elo: {
      initial: parseInt(process.env.ELO_INITIAL || '1000', 10),
      kFactor: parseInt(process.env.ELO_K_FACTOR || '32', 10),
      min: parseInt(process.env.ELO_MIN || '100', 10),
      max: parseInt(process.env.ELO_MAX || '3000', 10),
      placementGames: parseInt(process.env.ELO_PLACEMENT_GAMES || '10', 10),
    },
  }),
);
