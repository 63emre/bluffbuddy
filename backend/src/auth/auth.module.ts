/**
 * ==========================================================
 * AUTH MODULE
 * ==========================================================
 * BluffBuddy Online - Authentication Module Registration
 * 
 * @owner DEV3 (Social/Auth)
 * @iteration v0.1.0
 * @see docs/v0.1.0/02-Auth.md
 * 
 * DEV RESPONSIBILITIES:
 * - DEV3: Complete auth module implementation
 * 
 * MODULE CONTENTS:
 * - AuthService: Firebase token verification
 * - AuthGuard: Route/gateway protection
 * - AuthMiddleware: Socket.io authentication
 * - UserService: User profile management
 * ==========================================================
 */

// ----------------------------------------------------------
// ITERATION v0.1.0 - Module skeleton
// TODO v0.1.1: Add Firebase Admin SDK integration
// TODO v0.1.2: Add guards and middleware
// TODO v0.2.0: Add guest authentication
// ----------------------------------------------------------

// Module will import:
// - AuthService
// - AuthGuard
// - AuthMiddleware
// - UserService

import { Module } from '@nestjs/common';
import { AuthService, UserService } from './services';
import { AuthGuard } from './guards';

/**
 * AuthModule
 * Authentication module for BluffBuddy
 * 
 * @see docs/v0.1.0/02-Auth.md
 */
@Module({
  providers: [AuthService, UserService, AuthGuard],
  exports: [AuthService, UserService, AuthGuard],
})
export class AuthModule {}
