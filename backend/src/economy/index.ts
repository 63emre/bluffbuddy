/**
 * ==========================================================
 * ECONOMY MODULE BARREL EXPORT
 * ==========================================================
 * BluffBuddy Online - Economy Module Public API
 *
 * @owner DEV3 (Economy)
 * @version v0.2.0
 *
 * ⚠️  ARCHITECTURAL CONSTRAINT:
 * This barrel file is the "PUBLIC WALL" of the economy module.
 *
 * ✅ ALLOWED EXPORTS:
 * - EconomyModule (NestJS module registration)
 *
 * ❌ FORBIDDEN EXPORTS:
 * - Service classes (WalletService, TransactionService, etc.)
 *
 * WHY?
 * Other modules must inject services via DI_TOKENS, not direct imports.
 * This enforces loose coupling and interface-based design.
 *
 * Usage:
 * ```typescript
 * // In app.module.ts:
 * import { EconomyModule } from '@economy';
 *
 * // In services (via DI):
 * import { IWalletService, DI_TOKENS } from '@contracts';
 * constructor(@Inject(DI_TOKENS.WALLET_SERVICE) private wallet: IWalletService) {}
 * ```
 * ==========================================================
 */

// ============================================
// MODULE REGISTRATION
// ============================================
export { EconomyModule } from './economy.module';

// ============================================
// ❌ DO NOT EXPORT SERVICES!
// ❌ DO NOT ADD: export { WalletService } from './services';
// ============================================
