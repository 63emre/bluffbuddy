/**
 * ==========================================================
 * DATABASE MODULE BARREL EXPORT
 * ==========================================================
 * BluffBuddy Online - Database Module Public API
 *
 * @owner DEV3 (Data)
 * @version v0.2.0
 *
 * ⚠️  ARCHITECTURAL CONSTRAINT:
 * This barrel file is the "PUBLIC WALL" of the database module.
 *
 * ✅ ALLOWED EXPORTS:
 * - DatabaseModule (NestJS module registration)
 *
 * ❌ FORBIDDEN EXPORTS:
 * - Repository classes (UserRepository, MatchRepository, etc.)
 * - FirestoreService
 * - Query builders
 * - Internal helpers
 *
 * WHY?
 * Other modules MUST use DI_TOKENS from @contracts for injection.
 * This enforces Repository pattern and enables mocking for tests.
 *
 * Usage:
 * ```typescript
 * // In app.module.ts:
 * import { DatabaseModule } from '@database';
 *
 * // In other services (via DI):
 * import { IUserRepository, DI_TOKENS } from '@contracts';
 * constructor(@Inject(DI_TOKENS.USER_REPOSITORY) private userRepo: IUserRepository) {}
 * ```
 * ==========================================================
 */

// ============================================
// MODULE REGISTRATION ONLY
// ============================================
export { DatabaseModule } from './database.module';

// ============================================
// ❌ DO NOT EXPORT REPOSITORIES OR SERVICES!
// ❌ DO NOT ADD: export { UserRepository } from './services';
// ❌ DO NOT ADD: export { FirestoreService } from './services';
// ============================================
