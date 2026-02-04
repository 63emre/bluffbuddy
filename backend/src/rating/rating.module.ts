/**
 * ==========================================================
 * RATING MODULE
 * ==========================================================
 * BluffBuddy Online - ELO Rating Module Registration
 * 
 * @owner DEV2 (Game Engine) + DEV3 (Statistics)
 * @iteration v0.1.0
 * @see docs/v0.1.0/06-ELO-Rating.md
 * 
 * DEV RESPONSIBILITIES:
 * - DEV2: ELO calculation and anti-gaming measures
 * - DEV3: Statistics and leaderboard
 * 
 * MODULE CONTENTS:
 * - EloService: ELO calculation
 * - LeaderboardService: Rankings
 * - BotDetectionService: Anti-cheat
 * - StatisticsService: Player stats
 * ==========================================================
 */

// ----------------------------------------------------------
// ITERATION v0.1.0 - Module skeleton
// TODO v0.1.1: Add ELO calculation
// TODO v0.1.2: Add leaderboard
// TODO v0.1.3: Add bot detection
// TODO v0.2.0: Add seasonal rankings
// ----------------------------------------------------------

// Module will import:
// - EloService
// - LeaderboardService
// - BotDetectionService
// - StatisticsService

import { Module } from '@nestjs/common';
import { EloService, LeaderboardService, BotDetectionService } from './services';

/**
 * RatingModule
 * ELO rating module for BluffBuddy
 * 
 * @see docs/v0.1.0/06-ELO-Rating.md
 */
@Module({
  providers: [EloService, LeaderboardService, BotDetectionService],
  exports: [EloService, LeaderboardService, BotDetectionService],
})
export class RatingModule {}
