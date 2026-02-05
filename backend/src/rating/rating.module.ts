/**
 * ==========================================================
 * RATING MODULE
 * ==========================================================
 * BluffBuddy Online - ELO Rating Module Registration
 *
 * @owner DEV2 (Game Engine) + DEV3 (Statistics)
 * @version v0.2.0
 * @see docs/v0.1.0/06-ELO-Rating.md
 *
 * DEV RESPONSIBILITIES:
 * - DEV2: ELO calculation and anti-gaming measures
 * - DEV3: Statistics and leaderboard
 *
 * MODULE CONTENTS:
 * - EloService: ELO calculation (implements IEloService)
 * - LeaderboardService: Rankings (uses ILeaderboardRepository)
 * - BotDetectionService: Anti-cheat (implements IBotDetectionService)
 *
 * DI PATTERN:
 * This module uses interface-based dependency injection.
 * Other modules inject via DI_TOKENS, not concrete classes.
 * ==========================================================
 */

import { Module, forwardRef } from '@nestjs/common';
import { DI_TOKENS } from '../shared/contracts';
import { LeaderboardController } from './controllers';
import {
  EloService,
  LeaderboardService,
  BotDetectionService,
} from './services';
import { DatabaseModule } from '../database';
import { InfrastructureModule } from '../infrastructure';

/**
 * RatingModule
 * ELO rating module for BluffBuddy
 *
 * @see docs/v0.1.0/06-ELO-Rating.md
 */
@Module({
  imports: [
    forwardRef(() => DatabaseModule),
    forwardRef(() => InfrastructureModule),
  ],
  controllers: [LeaderboardController],
  providers: [
    // ============================================
    // INTERFACE-BASED PROVIDERS (Public API)
    // ============================================
    {
      provide: DI_TOKENS.ELO_SERVICE,
      useClass: EloService,
    },
    {
      provide: DI_TOKENS.BOT_DETECTION_SERVICE,
      useClass: BotDetectionService,
    },

    // ============================================
    // CONCRETE CLASS PROVIDERS (Internal use only)
    // ============================================
    EloService,
    LeaderboardService,
    BotDetectionService,
  ],
  exports: [
    // ============================================
    // ONLY EXPORT DI TOKENS - NEVER CONCRETE CLASSES!
    // This forces consumers to use interface-based injection.
    // ============================================
    DI_TOKENS.ELO_SERVICE,
    DI_TOKENS.BOT_DETECTION_SERVICE,
  ],
})
export class RatingModule {}
