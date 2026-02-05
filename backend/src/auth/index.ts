/**
 * ==========================================================
 * AUTH MODULE BARREL EXPORT
 * ==========================================================
 * BluffBuddy Online - Auth Module Public API
 *
 * @owner DEV3 (Auth)
 * @version v0.2.0
 *
 * ⚠️  ARCHITECTURAL CONSTRAINT:
 * This barrel file is the "PUBLIC WALL" of the auth module.
 *
 * ✅ ALLOWED EXPORTS:
 * - AuthModule (NestJS module registration)
 * - Guards (AuthGuard, WsAuthGuard, HttpAuthGuard)
 * - Middleware (WsAuthMiddleware)
 *
 * ❌ FORBIDDEN EXPORTS:
 * - Service classes (AuthService, UserService, etc.)
 * - Firebase internals
 *
 * WHY?
 * Guards and Middleware are NOT business logic services - they are
 * cross-cutting concerns that can be used via decorators.
 * Services must be injected via DI_TOKENS.
 *
 * Usage:
 * ```typescript
 * // In app.module.ts:
 * import { AuthModule } from '@auth';
 *
 * // In controllers (guard decorator):
 * import { AuthGuard } from '@auth';
 * @UseGuards(AuthGuard)
 *
 * // In services (via DI):
 * import { IAuthService, DI_TOKENS } from '@contracts';
 * constructor(@Inject(DI_TOKENS.AUTH_SERVICE) private authService: IAuthService) {}
 * ```
 * ==========================================================
 */

// ============================================
// MODULE REGISTRATION
// ============================================
export { AuthModule } from './auth.module';

// ============================================
// GUARDS (Cross-cutting concerns, NOT services)
// ============================================
export { AuthGuard, WsAuthGuard, HttpAuthGuard } from './guards';

// ============================================
// MIDDLEWARE (Socket.io setup, NOT services)
// ============================================
export { WsAuthMiddleware } from './middleware';

// ============================================
// ❌ DO NOT EXPORT SERVICES!
// ❌ DO NOT ADD: export { AuthService } from './services';
// ❌ DO NOT ADD: export { UserService } from './services';
// ============================================
