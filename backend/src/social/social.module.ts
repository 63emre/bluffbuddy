/**
 * ==========================================================
 * SOCIAL MODULE
 * ==========================================================
 * BluffBuddy Online - Social Features Module Registration
 * 
 * @owner DEV3 (Social/Auth)
 * @iteration v0.1.0
 * @see docs/v0.1.0/07-Social-Features.md
 * 
 * DEV RESPONSIBILITIES:
 * - DEV3: Complete social module implementation
 * 
 * MODULE CONTENTS:
 * - SocialGateway: Socket.io social events gateway
 * - FriendService: Friend list management
 * - PartyService: Party/group management
 * - ChatService: Quick chat and reactions
 * - PresenceService: Online status tracking
 * ==========================================================
 */

// ----------------------------------------------------------
// ITERATION v0.1.0 - Module skeleton
// TODO v0.1.1: Add friend system
// TODO v0.1.2: Add party system
// TODO v0.1.3: Add chat system
// TODO v0.2.0: Add blocking feature
// ----------------------------------------------------------

// Module will import:
// - SocialGateway
// - FriendService
// - PartyService
// - ChatService
// - PresenceService

import { Module } from '@nestjs/common';
import { SocialGateway } from './gateways';
import { FriendService, PartyService, ChatService, PresenceService } from './services';

/**
 * SocialModule
 * Social features module for BluffBuddy
 * 
 * @see docs/v0.1.0/07-Social-Features.md
 */
@Module({
  providers: [SocialGateway, FriendService, PartyService, ChatService, PresenceService],
  exports: [FriendService, PartyService, ChatService, PresenceService],
})
export class SocialModule {}
