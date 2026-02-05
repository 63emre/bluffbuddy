/**
 * ==========================================================
 * LOGGER BARREL EXPORT
 * ==========================================================
 * BluffBuddy Online - Logger Module Public API
 *
 * @owner DEV1 (Infrastructure)
 * @version v0.2.0
 *
 * ✅ ALLOWED EXPORTS:
 * - LoggerModule
 * - SmartLoggerService (for NestJS app.useLogger)
 * - ClsContextService (for middleware)
 * - Interfaces
 *
 * ❌ FORBIDDEN:
 * - Transport internals
 * ==========================================================
 */

// Module
export { LoggerModule } from './logger.module';

// Services (for NestJS integration)
export { SmartLoggerService } from './smart-logger.service';
export { ClsContextService } from './cls-context.service';

// Interfaces
export * from './interfaces';
