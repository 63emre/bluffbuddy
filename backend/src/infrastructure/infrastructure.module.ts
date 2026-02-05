/**
 * ==========================================================
 * INFRASTRUCTURE MODULE
 * ==========================================================
 * BluffBuddy Online - Infrastructure Module Registration
 *
 * @owner DEV1 (DevOps/Infrastructure)
 * @version v0.2.0
 * @see docs/v0.1.0/01-Infrastructure.md
 *
 * DEV RESPONSIBILITIES:
 * - DEV1: Complete infrastructure module implementation
 *
 * MODULE CONTENTS:
 * - RedisService: Redis connection and operations (implements IRedisService)
 * - HydrationService: Crash recovery state loading (implements IHydrationService)
 * - PubSubService: Inter-process communication (implements IPubSubService)
 * - ConfigService: Environment configuration (implements IConfigService)
 * - LoggerModule: Cost-optimized smart logging (implements ISmartLoggerService)
 *
 * DI PATTERN:
 * This module provides infrastructure services.
 * Other modules inject via DI_TOKENS.
 * ==========================================================
 */

import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DI_TOKENS } from '../shared/contracts';
import { RedisService, HydrationService } from './services';
import { LoggerModule } from './logger';

// Import configuration files
import {
  appConfig,
  redisConfig,
  firebaseConfig,
  gameConfig,
  socketConfig,
} from '../config';

/**
 * InfrastructureModule
 * Global infrastructure module for BluffBuddy
 *
 * @see docs/v0.1.0/01-Infrastructure.md
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, redisConfig, firebaseConfig, gameConfig, socketConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    // Smart Logger with batched Firestore writes
    LoggerModule,
  ],
  providers: [
    // ============================================
    // INTERFACE-BASED PROVIDERS (Public API)
    // ============================================
    {
      provide: DI_TOKENS.REDIS_SERVICE,
      useClass: RedisService,
    },
    {
      provide: DI_TOKENS.HYDRATION_SERVICE,
      useClass: HydrationService,
    },
    {
      provide: DI_TOKENS.CONFIG_SERVICE,
      useExisting: ConfigService,
    },

    // ============================================
    // CONCRETE CLASS PROVIDERS
    // ============================================
    RedisService,
    HydrationService,
  ],
  exports: [
    // ConfigModule is global, but export it explicitly
    ConfigModule,

    // LoggerModule exports its own providers
    LoggerModule,

    // ============================================
    // ONLY EXPORT DI TOKENS - NEVER CONCRETE CLASSES!
    // This forces consumers to use interface-based injection.
    // ============================================
    DI_TOKENS.REDIS_SERVICE,
    DI_TOKENS.HYDRATION_SERVICE,
    DI_TOKENS.CONFIG_SERVICE,
    DI_TOKENS.LOGGER_SERVICE,
    DI_TOKENS.CLS_CONTEXT_SERVICE,
  ],
})
export class InfrastructureModule {}
