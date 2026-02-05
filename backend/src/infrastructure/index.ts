/**
 * ==========================================================
 * INFRASTRUCTURE MODULE BARREL EXPORT
 * ==========================================================
 * BluffBuddy Online - Infrastructure Module Public API
 *
 * @owner DEV1 (Infrastructure)
 * @version v0.2.0
 *
 * ⚠️  ARCHITECTURAL CONSTRAINT:
 * This barrel file is the "PUBLIC WALL" of the infrastructure module.
 *
 * ✅ ALLOWED EXPORTS:
 * - InfrastructureModule (NestJS module registration)
 *
 * ❌ FORBIDDEN EXPORTS:
 * - Service classes (RedisService, HydrationService, etc.)
 * - Internal adapters
 * - Connection managers
 *
 * WHY?
 * Other modules MUST use DI_TOKENS from @contracts for injection.
 * This enforces loose coupling and enables parallel development.
 *
 * Usage:
 * ```typescript
 * // In app.module.ts:
 * import { InfrastructureModule } from '@infrastructure';
 *
 * // In other services (via DI):
 * import { IRedisService, DI_TOKENS } from '@contracts';
 * constructor(@Inject(DI_TOKENS.REDIS_SERVICE) private redis: IRedisService) {}
 * ```
 * ==========================================================
 */

// ============================================
// MODULE REGISTRATION ONLY
// ============================================
export { InfrastructureModule } from './infrastructure.module';

// ============================================
// ❌ DO NOT EXPORT SERVICES!
// ❌ DO NOT ADD: export { RedisService } from './services';
// ❌ DO NOT ADD: export { HydrationService } from './services';
// ============================================
