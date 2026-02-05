/**
 * ==========================================================
 * AUTH CONTROLLER
 * ==========================================================
 * BluffBuddy Online - HTTP Auth Endpoints
 *
 * @owner DEV3 (Social/Auth)
 * @version v0.2.0
 *
 * CONTROLLER RESPONSIBILITIES:
 * - Firebase token verification
 * - User profile management
 * - Session management
 *
 * AUTHENTICATION FLOW:
 * 1. Client authenticates with Firebase Auth
 * 2. Client sends Firebase ID token to /auth/verify
 * 3. Server validates token and creates/updates user
 * 4. Server returns user profile and session info
 * ==========================================================
 */

import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiProperty,
} from '@nestjs/swagger';
import { DI_TOKENS, IAuthService, IUserService } from '@contracts';

// ============================================
// REQUEST DTOs (Swagger Schema)
// ============================================

class VerifyTokenRequest {
  @ApiProperty({
    example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Firebase ID token',
  })
  idToken!: string;

  @ApiProperty({
    enum: ['ios', 'android', 'web'],
    required: false,
    example: 'ios',
  })
  platform?: 'ios' | 'android' | 'web';

  @ApiProperty({ required: false, example: 'fcm_token_here' })
  pushToken?: string;
}

class UpdateProfileRequest {
  @ApiProperty({
    required: false,
    example: 'BluffMaster',
    description: '2-20 characters',
  })
  nickname?: string;

  @ApiProperty({ required: false, example: 'avatar_01' })
  avatarId?: string;
}

// ============================================
// RESPONSE DTOs (Swagger Schema)
// ============================================

class UserStatsDto {
  @ApiProperty({ example: 150 })
  gamesPlayed!: number;

  @ApiProperty({ example: 75 })
  wins!: number;

  @ApiProperty({ example: 1500 })
  elo!: number;

  @ApiProperty({ example: 'Silver' })
  rank!: string;
}

class UserEconomyDto {
  @ApiProperty({ example: 10000 })
  chips!: number;
}

class UserProfileResponse {
  @ApiProperty({ example: 'user_abc123' })
  uid!: string;

  @ApiProperty({ example: 'BluffMaster' })
  nickname!: string;

  @ApiProperty({ example: 'avatar_01' })
  avatarId!: string;

  @ApiProperty({ type: () => UserStatsDto })
  stats!: UserStatsDto;

  @ApiProperty({ type: () => UserEconomyDto })
  economy!: UserEconomyDto;

  @ApiProperty({ example: '2026-01-01T00:00:00Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-02-05T10:00:00Z' })
  lastSeen!: string;
}

class AuthResponse {
  @ApiProperty({ type: () => UserProfileResponse })
  user!: UserProfileResponse;

  @ApiProperty({ example: true })
  isNewUser!: boolean;

  @ApiProperty({ example: 'session_abc123' })
  sessionId!: string;
}

// ============================================
// CONTROLLER
// ============================================

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(DI_TOKENS.AUTH_SERVICE) private readonly authService: IAuthService,
    @Inject(DI_TOKENS.USER_SERVICE) private readonly userService: IUserService,
  ) {}

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify Firebase token',
    description: `
Verifies a Firebase ID token and creates or updates the user profile.

**Flow:**
1. Client authenticates with Firebase Auth (Google, Apple, Anonymous)
2. Client sends the ID token to this endpoint
3. Server validates the token with Firebase Admin SDK
4. Server creates user if new, or updates lastSeen if existing
5. Returns user profile with session ID

**Token Refresh:**
Firebase tokens expire after 1 hour. Client should handle token refresh
and call this endpoint again with the new token.
    `,
  })
  @ApiBody({ type: VerifyTokenRequest })
  @ApiResponse({
    status: 200,
    description: 'Token verified successfully',
    type: AuthResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired token',
  })
  async verifyToken(@Body() dto: VerifyTokenRequest): Promise<AuthResponse> {
    // TODO: Implement token verification logic
    // const decodedToken = await this.authService.verifyFirebaseToken(dto.idToken);
    // const user = await this.userService.findOrCreate(decodedToken.uid);
    throw new Error('Not implemented - AUTH_VERIFY');
  }

  @Get('profile')
  @ApiBearerAuth('firebase-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get current user profile',
    description: "Returns the authenticated user's profile and stats.",
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved',
    type: UserProfileResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated',
  })
  async getProfile(): Promise<UserProfileResponse> {
    // TODO: Implement profile retrieval
    // const uid = this.currentUser.uid;
    // return this.userService.getProfile(uid);
    throw new Error('Not implemented - AUTH_PROFILE');
  }

  @Post('profile')
  @ApiBearerAuth('firebase-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update user profile',
    description: "Updates the authenticated user's profile (nickname, avatar).",
  })
  @ApiBody({ type: UpdateProfileRequest })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: UserProfileResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data (nickname taken, invalid avatar)',
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated',
  })
  async updateProfile(
    @Body() dto: UpdateProfileRequest,
  ): Promise<UserProfileResponse> {
    // TODO: Implement profile update
    throw new Error('Not implemented - AUTH_UPDATE_PROFILE');
  }

  @Post('logout')
  @ApiBearerAuth('firebase-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Logout user',
    description: 'Invalidates the current session and cleans up presence.',
  })
  @ApiResponse({
    status: 204,
    description: 'Logged out successfully',
  })
  async logout(): Promise<void> {
    // TODO: Implement logout
    // await this.authService.logout(uid);
    throw new Error('Not implemented - AUTH_LOGOUT');
  }
}
