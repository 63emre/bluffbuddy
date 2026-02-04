/**
 * ==========================================================
 * APP MODULE
 * ==========================================================
 * BluffBuddy Online - Root Application Module
 * 
 * @owner DEV1 (Infrastructure)
 * @iteration v0.1.0
 * 
 * DEV RESPONSIBILITIES:
 * - DEV1: Module registration and configuration
 * 
 * MODULE IMPORTS:
 * - InfrastructureModule: Redis, Health, Config
 * - AuthModule: Authentication and user management
 * - GameModule: Game engine and socket gateway
 * - SocialModule: Friends, party, chat
 * - RatingModule: ELO, leaderboard, bot detection
 * ==========================================================
 */

// ----------------------------------------------------------
// ITERATION v0.1.0 - Module skeleton
// TODO v0.1.1: Add module imports
// TODO v0.1.2: Add global providers
// TODO v0.2.0: Add configuration module
// ----------------------------------------------------------

// Modules to import:
// - InfrastructureModule
// - AuthModule
// - GameModule
// - SocialModule
// - RatingModule

// Global providers:
// - ConfigService (global)
// - LoggerService (global)

import { Module } from '@nestjs/common';
import { InfrastructureModule } from './infrastructure';
import { AuthModule } from './auth';
import { GameModule } from './game';
import { SocialModule } from './social';
import { RatingModule } from './rating';
import { AppController } from './app.controller';
import { AppService } from './app.service';

/**
 * AppModule
 * Root application module for BluffBuddy
 */
@Module({
  imports: [
    InfrastructureModule,
    AuthModule,
    GameModule,
    SocialModule,
    RatingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
