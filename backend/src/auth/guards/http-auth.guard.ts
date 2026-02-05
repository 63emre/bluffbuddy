/**
 * ==========================================================
 * HTTP AUTH GUARD
 * ==========================================================
 * BluffBuddy Online - HTTP Authentication Guard
 *
 * @owner DEV3 (Social/Auth)
 * @version v1.0.0
 *
 * GUARD RESPONSIBILITIES:
 * - Verify Firebase ID token in Authorization header
 * - Attach user info to request
 * - Reject unauthenticated requests
 * ==========================================================
 */

// TODO v0.1.1: Import CanActivate, ExecutionContext
// TODO v0.1.1: Import AuthService
// TODO v0.1.1: Import UnauthorizedException

// Guard flow:
// 1. Extract token from Authorization: Bearer <token>
// 2. Verify with Firebase Admin SDK
// 3. Attach user to request.user
// 4. Return true or throw UnauthorizedException

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class HttpAuthGuard implements CanActivate {
  // TODO v0.1.1: Inject AuthService

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    // TODO v0.1.1: Implement token verification
    return true;
  }
}
