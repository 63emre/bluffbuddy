/**
 * ==========================================================
 * COMMON MODULE BARREL EXPORT
 * ==========================================================
 * BluffBuddy Online - Common Utilities Public API
 *
 * @owner ALL DEVELOPERS
 * @version v0.2.0
 *
 * PUBLIC EXPORTS:
 * - CommonModule: NestJS module registration
 * - Decorators: Custom decorators for controllers/gateways
 * - Filters: Exception filters
 * - Interceptors: Logging, transform interceptors
 * - Pipes: Validation pipes
 *
 * Usage:
 * ```typescript
 * import { CurrentUser, LoggingInterceptor, WsExceptionFilter } from '@common';
 * ```
 * ==========================================================
 */

// Module registration
export { CommonModule } from './common.module';

// Public decorators
export * from './decorators';

// Public filters
export * from './filters';

// Public interceptors
export * from './interceptors';

// Public pipes
export * from './pipes';
