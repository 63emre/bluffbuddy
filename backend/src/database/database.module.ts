/**
 * ==========================================================
 * DATABASE MODULE
 * ==========================================================
 * BluffBuddy Online - Database Connections Module
 *
 * @owner DEV3 (Data)
 * @version v0.2.0
 * @see docs/v0.1.0/04-Database.md
 *
 * MODULE RESPONSIBILITIES:
 * - Firestore connection management
 * - Repository implementations
 * - Transaction helpers (ACID compliance)
 *
 * DI PATTERN:
 * This module provides repository implementations.
 * Other modules inject via DI_TOKENS (IUserRepository, etc.)
 * ==========================================================
 */

import { Module, Global } from '@nestjs/common';
import { DI_TOKENS } from '../shared/contracts';
import {
  FirestoreService,
  UserRepository,
  MatchRepository,
  LeaderboardRepository,
  GameRepository,
} from './services';

/**
 * DatabaseModule
 * Global database module providing repository implementations
 *
 * @see docs/v0.1.0/04-Database.md
 */
@Global()
@Module({
  providers: [
    // ============================================
    // FIRESTORE SERVICE
    // ============================================
    {
      provide: DI_TOKENS.FIRESTORE_SERVICE,
      useClass: FirestoreService,
    },
    FirestoreService,

    // ============================================
    // REPOSITORY IMPLEMENTATIONS
    // These implement interfaces from @contracts
    // ============================================
    {
      provide: DI_TOKENS.USER_REPOSITORY,
      useClass: UserRepository,
    },
    {
      provide: DI_TOKENS.MATCH_REPOSITORY,
      useClass: MatchRepository,
    },
    {
      provide: DI_TOKENS.LEADERBOARD_REPOSITORY,
      useClass: LeaderboardRepository,
    },
    {
      provide: DI_TOKENS.GAME_STATE_REPOSITORY,
      useClass: GameRepository,
    },

    // Concrete classes for internal use
    UserRepository,
    MatchRepository,
    LeaderboardRepository,
    GameRepository,
  ],
  exports: [
    // ============================================
    // ONLY EXPORT DI TOKENS - NEVER CONCRETE CLASSES!
    // This forces consumers to use interface-based injection.
    // ============================================
    DI_TOKENS.FIRESTORE_SERVICE,
    DI_TOKENS.USER_REPOSITORY,
    DI_TOKENS.MATCH_REPOSITORY,
    DI_TOKENS.LEADERBOARD_REPOSITORY,
    DI_TOKENS.GAME_STATE_REPOSITORY,
  ],
})
export class DatabaseModule {}
