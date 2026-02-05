/**
 * ==========================================================
 * RATING MODULE BARREL EXPORT
 * ==========================================================
 * BluffBuddy Online - Rating Module Public API
 *
 * @owner DEV2 + DEV3 (Rating)
 * @version v0.2.0
 *
 * ⚠️  ARCHITECTURAL CONSTRAINT:
 * This barrel file is the "PUBLIC WALL" of the rating module.
 *
 * ✅ ALLOWED EXPORTS:
 * - RatingModule (NestJS module registration)
 *
 * ❌ FORBIDDEN EXPORTS:
 * - Service classes (EloService, LeaderboardService, etc.)
 * - Bot detection internals
 * - K-factor algorithms
 *
 * WHY?
 * Other modules MUST use DI_TOKENS from @contracts for injection.
 * This enforces loose coupling and enables parallel development.
 *
 * Usage:
 * ```typescript
 * // In app.module.ts:
 * import { RatingModule } from '@rating';
 *
 * // In other services (via DI):
 * import { IEloService, DI_TOKENS } from '@contracts';
 * constructor(@Inject(DI_TOKENS.ELO_SERVICE) private eloService: IEloService) {}
 * ```
 * ==========================================================
 */

// ============================================
// MODULE REGISTRATION ONLY
// ============================================
export { RatingModule } from './rating.module';

// ============================================
// ❌ DO NOT EXPORT SERVICES!
// ❌ DO NOT ADD: export { EloService } from './services';
// ❌ DO NOT ADD: export { LeaderboardService } from './services';
// ============================================
