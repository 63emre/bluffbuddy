/**
 * ==========================================================
 * APP MODULE
 * ==========================================================
 * BluffBuddy Online - Root Application Module
 *
 * @owner DEV1 (Infrastructure)
 * @version v0.2.0
 *
 * DEV RESPONSIBILITIES:
 * - DEV1: Module registration and configuration
 *
 * MODULE IMPORTS:
 * - InfrastructureModule: Redis, Health, Config (GLOBAL)
 * - DatabaseModule: Firestore repositories (GLOBAL)
 * - AuthModule: Authentication and user management
 * - GameModule: Game engine and socket gateway
 * - SocialModule: Friends, party, chat
 * - RatingModule: ELO, leaderboard, bot detection
 * - CommonModule: Shared utilities (GLOBAL)
 *
 * ARCHITECTURE:
 * All modules use interface-based DI via DI_TOKENS.
 * This allows any module to be mocked/replaced for testing.
 * ==========================================================
 */

import { Module } from '@nestjs/common';
import { InfrastructureModule } from './infrastructure';
import { DatabaseModule } from './database';
import { CommonModule } from './common';
import { AuthModule } from './auth';
import { GameModule } from './game';
import { SocialModule } from './social';
import { RatingModule } from './rating';
import { AppController } from './app.controller';
import { AppService } from './app.service';

/**
 * AppModule
 * Root application module for BluffBuddy
 *
 * Module Load Order:
 * 1. InfrastructureModule (global - config, redis)
 * 2. DatabaseModule (global - firestore)
 * 3. CommonModule (global - utilities)
 * 4. AuthModule (authentication)
 * 5. GameModule (core game logic)
 * 6. SocialModule (social features)
 * 7. RatingModule (ELO system)
 */
@Module({
  imports: [
    // ============================================
    // GLOBAL MODULES (loaded first)
    // ============================================
    InfrastructureModule, // Config, Redis, Health checks
    DatabaseModule, // Firestore repositories
    CommonModule, // Shared utilities

    // ============================================
    // FEATURE MODULES
    // ============================================
    AuthModule, // Authentication (Firebase)
    GameModule, // Game engine
    SocialModule, // Friends, party, chat
    RatingModule, // ELO, leaderboard
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
