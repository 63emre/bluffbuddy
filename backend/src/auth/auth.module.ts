/**
 * ==========================================================
 * AUTH MODULE
 * ==========================================================
 * BluffBuddy Online - Authentication Module Registration
 *
 * @owner DEV3 (Auth)
 * @version v0.2.0
 * @see docs/v0.1.0/02-Architecture.md - Section 5
 *
 * DEV RESPONSIBILITIES:
 * - DEV3: Complete auth module implementation
 *
 * MODULE CONTENTS:
 * - AuthService: Firebase token verification (implements IAuthService)
 * - UserService: User profile management (implements IUserService)
 * - SessionService: Session management (implements ISessionService)
 * - AuthGuard: Route/gateway protection
 * - WsAuthMiddleware: Socket.io authentication
 *
 * DI PATTERN:
 * This module provides auth services.
 * Other modules inject via DI_TOKENS.
 * ==========================================================
 */

import { Module, forwardRef } from '@nestjs/common';
import { DI_TOKENS } from '../shared/contracts';
import {
  AuthService,
  UserService,
  SessionService,
  FirebaseService,
} from './services';
import { AuthGuard, WsAuthGuard, HttpAuthGuard } from './guards';
import { AuthController } from './controllers';
import { InfrastructureModule } from '../infrastructure';
import { DatabaseModule } from '../database';

/**
 * AuthModule
 * Authentication module for BluffBuddy
 *
 * @see docs/v0.1.0/02-Architecture.md - Section 5
 */
@Module({
  imports: [
    forwardRef(() => InfrastructureModule),
    forwardRef(() => DatabaseModule),
  ],
  controllers: [AuthController],
  providers: [
    // ============================================
    // INTERFACE-BASED PROVIDERS (Public API)
    // ============================================
    {
      provide: DI_TOKENS.AUTH_SERVICE,
      useClass: AuthService,
    },
    {
      provide: DI_TOKENS.USER_SERVICE,
      useClass: UserService,
    },
    {
      provide: DI_TOKENS.SESSION_SERVICE,
      useClass: SessionService,
    },

    // ============================================
    // CONCRETE CLASS PROVIDERS
    // ============================================
    AuthService,
    UserService,
    SessionService,
    FirebaseService,

    // Guards
    AuthGuard,
    WsAuthGuard,
    HttpAuthGuard,
  ],
  exports: [
    // ============================================
    // ONLY EXPORT DI TOKENS - NEVER CONCRETE CLASSES!
    // This forces consumers to use interface-based injection.
    // ============================================
    DI_TOKENS.AUTH_SERVICE,
    DI_TOKENS.USER_SERVICE,
    DI_TOKENS.SESSION_SERVICE,

    // Guards are NOT services - they are decorators/middleware
    // Safe to export as they don't contain business logic
    AuthGuard,
    WsAuthGuard,
    HttpAuthGuard,
  ],
})
export class AuthModule {}
