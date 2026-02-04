/**
 * ==========================================================
 * AUTH GUARD
 * ==========================================================
 * BluffBuddy Online - Authentication Guard
 * 
 * @owner DEV3 (Social/Auth)
 * @iteration v0.1.0
 * @see docs/v0.1.0/02-Auth.md
 * 
 * DEV RESPONSIBILITIES:
 * - DEV3: Guard implementation for REST and WebSocket
 * 
 * GUARD RESPONSIBILITIES:
 * - Protect REST endpoints
 * - Validate request authorization
 * - Attach user to request context
 * ==========================================================
 */

// ----------------------------------------------------------
// ITERATION v0.1.0 - Guard skeleton
// TODO v0.1.1: Add REST guard implementation
// TODO v0.2.0: Add role-based guards
// ----------------------------------------------------------

// Dependencies:
// - AuthService: For token verification

// Methods to implement:
// - canActivate(context): boolean | Promise<boolean>
// - extractTokenFromHeader(request): string | undefined

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

/**
 * AuthGuard
 * Authentication guard for BluffBuddy REST endpoints
 * 
 * @see docs/v0.1.0/02-Auth.md
 */
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // TODO v0.1.1: Implement REST guard
    return true;
  }
}
