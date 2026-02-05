/**
 * ==========================================================
 * GAME MODULE BARREL EXPORT
 * ==========================================================
 * BluffBuddy Online - Game Module Public API
 *
 * @owner DEV2 (Game Engine)
 * @version v0.2.0
 *
 * ⚠️  ARCHITECTURAL CONSTRAINT:
 * This barrel file is the "PUBLIC WALL" of the game module.
 *
 * ✅ ALLOWED EXPORTS:
 * - GameModule (NestJS module registration)
 *
 * ❌ FORBIDDEN EXPORTS:
 * - Service classes (GameService, RoomService, etc.)
 * - Internal implementations
 * - Gateways (internal to module)
 *
 * WHY?
 * Other modules MUST use DI_TOKENS from @contracts for injection.
 * This enforces loose coupling and enables parallel development.
 *
 * Usage:
 * ```typescript
 * // In app.module.ts:
 * import { GameModule } from '@game';
 *
 * // In other services (via DI):
 * import { IGameEngine, DI_TOKENS } from '@contracts';
 * constructor(@Inject(DI_TOKENS.GAME_ENGINE) private gameEngine: IGameEngine) {}
 * ```
 * ==========================================================
 */

// ============================================
// MODULE REGISTRATION ONLY
// ============================================
export { GameModule } from './game.module';

// ============================================
// ❌ DO NOT EXPORT SERVICES OR GATEWAYS!
// ❌ DO NOT ADD: export { GameService } from './services';
// ❌ DO NOT ADD: export { GameGateway } from './gateways';
// ============================================
