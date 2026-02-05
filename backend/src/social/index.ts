/**
 * ==========================================================
 * SOCIAL MODULE BARREL EXPORT
 * ==========================================================
 * BluffBuddy Online - Social Module Public API
 *
 * @owner DEV3 (Social)
 * @version v0.2.0
 *
 * ⚠️  ARCHITECTURAL CONSTRAINT:
 * This barrel file is the "PUBLIC WALL" of the social module.
 *
 * ✅ ALLOWED EXPORTS:
 * - SocialModule (NestJS module registration)
 *
 * ❌ FORBIDDEN EXPORTS:
 * - Service classes (FriendService, PartyService, etc.)
 * - Gateways
 * - Internal utilities
 *
 * WHY?
 * Other modules MUST use DI_TOKENS from @contracts for injection.
 * This enforces loose coupling and enables parallel development.
 *
 * Usage:
 * ```typescript
 * // In app.module.ts:
 * import { SocialModule } from '@social';
 *
 * // In other services (via DI):
 * import { IFriendService, DI_TOKENS } from '@contracts';
 * constructor(@Inject(DI_TOKENS.FRIEND_SERVICE) private friendService: IFriendService) {}
 * ```
 * ==========================================================
 */

// ============================================
// MODULE REGISTRATION ONLY
// ============================================
export { SocialModule } from './social.module';

// ============================================
// ❌ DO NOT EXPORT SERVICES OR GATEWAYS!
// ❌ DO NOT ADD: export { FriendService } from './services';
// ❌ DO NOT ADD: export { SocialGateway } from './gateways';
// ============================================
