/**
 * ==========================================================
 * LOGGER MODULE
 * ==========================================================
 * BluffBuddy Online - Smart Logger Module Registration
 *
 * @owner DEV1 (Infrastructure)
 * @version v0.2.0
 *
 * PROVIDES:
 * - SmartLoggerService (DI_TOKENS.LOGGER_SERVICE)
 * - ClsContextService (DI_TOKENS.CLS_CONTEXT_SERVICE)
 * - ConsoleTransport
 * - FirestoreTransport
 *
 * USAGE:
 * This module is imported by InfrastructureModule.
 * Use DI_TOKENS.LOGGER_SERVICE to inject the logger.
 * ==========================================================
 */

import { Module, Global } from '@nestjs/common';
import { DI_TOKENS } from '../../shared/contracts';
import { SmartLoggerService } from './smart-logger.service';
import { ClsContextService } from './cls-context.service';
import { ConsoleTransport } from './transports/console.transport';
import { FirestoreTransport } from './transports/firestore.transport';

@Global()
@Module({
  providers: [
    // ============================================
    // TRANSPORTS (Internal)
    // ============================================
    ConsoleTransport,
    FirestoreTransport,

    // ============================================
    // CLS CONTEXT SERVICE
    // ============================================
    {
      provide: DI_TOKENS.CLS_CONTEXT_SERVICE,
      useClass: ClsContextService,
    },
    ClsContextService, // Also available as concrete class

    // ============================================
    // SMART LOGGER SERVICE
    // ============================================
    {
      provide: DI_TOKENS.LOGGER_SERVICE,
      useClass: SmartLoggerService,
    },
    SmartLoggerService, // Also available as concrete class for NestJS
  ],
  exports: [
    // ============================================
    // EXPORTED TOKENS
    // ============================================
    DI_TOKENS.LOGGER_SERVICE,
    DI_TOKENS.CLS_CONTEXT_SERVICE,

    // Export concrete classes for NestJS integration
    SmartLoggerService,
    ClsContextService,
  ],
})
export class LoggerModule {}
