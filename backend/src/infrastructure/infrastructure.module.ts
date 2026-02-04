/**
 * ==========================================================
 * INFRASTRUCTURE MODULE
 * ==========================================================
 * BluffBuddy Online - Infrastructure Module Registration
 * 
 * @owner DEV1 (DevOps/Infrastructure)
 * @iteration v0.1.0
 * @see docs/v0.1.0/01-Infrastructure.md
 * 
 * DEV RESPONSIBILITIES:
 * - DEV1: Complete infrastructure module implementation
 * 
 * MODULE CONTENTS:
 * - RedisService: Redis connection and operations
 * - HydrationService: Crash recovery state loading
 * - HealthService: Health check endpoints
 * - LoggerService: Structured logging
 * - ConfigService: Environment configuration
 * ==========================================================
 */

// ----------------------------------------------------------
// ITERATION v0.1.0 - Module skeleton
// TODO v0.1.1: Add Redis configuration
// TODO v0.1.2: Add health checks
// TODO v0.2.0: Add metrics collection
// ----------------------------------------------------------

// Module will import:
// - RedisService
// - HydrationService
// - HealthService
// - LoggerService
// - ConfigService

import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService, HydrationService } from './services';

/**
 * InfrastructureModule
 * Infrastructure module for BluffBuddy
 * 
 * @see docs/v0.1.0/01-Infrastructure.md
 */
@Global()
@Module({
  imports: [ConfigModule.forRoot()],
  providers: [RedisService, HydrationService],
  exports: [RedisService, HydrationService, ConfigModule],
})
export class InfrastructureModule {}
