/**
 * ==========================================================
 * SOCIAL MODULE
 * ==========================================================
 * BluffBuddy Online - Social Features Module Registration
 *
 * @owner DEV3 (Social/Auth)
 * @version v0.2.0
 * @see docs/v0.1.0/07-Social-Features.md
 *
 * DEV RESPONSIBILITIES:
 * - DEV3: Complete social module implementation
 *
 * MODULE CONTENTS:
 * - SocialGateway: Socket.io social events gateway
 * - FriendService: Friend list management (implements IFriendService)
 * - PartyService: Party/group management (implements IPartyService)
 * - ChatService: Quick chat and reactions (implements IChatService)
 * - PresenceService: Online status tracking (implements IPresenceService)
 *
 * DI PATTERN:
 * This module uses interface-based dependency injection.
 * Other modules inject via DI_TOKENS, not concrete classes.
 * ==========================================================
 */

import { Module, forwardRef } from '@nestjs/common';
import { DI_TOKENS } from '../shared/contracts';
import { SocialGateway } from './gateways';
import { SocialController } from './controllers';
import {
  FriendService,
  PartyService,
  ChatService,
  PresenceService,
} from './services';
import { AuthModule } from '../auth';
import { DatabaseModule } from '../database';
import { InfrastructureModule } from '../infrastructure';

/**
 * SocialModule
 * Social features module for BluffBuddy
 *
 * @see docs/v0.1.0/07-Social-Features.md
 */
@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => DatabaseModule),
    forwardRef(() => InfrastructureModule),
  ],
  controllers: [SocialController],
  providers: [
    // Gateway
    SocialGateway,

    // ============================================
    // INTERFACE-BASED PROVIDERS (Public API)
    // ============================================
    {
      provide: DI_TOKENS.FRIEND_SERVICE,
      useClass: FriendService,
    },
    {
      provide: DI_TOKENS.PARTY_SERVICE,
      useClass: PartyService,
    },
    {
      provide: DI_TOKENS.CHAT_SERVICE,
      useClass: ChatService,
    },
    {
      provide: DI_TOKENS.PRESENCE_SERVICE,
      useClass: PresenceService,
    },

    // ============================================
    // CONCRETE CLASS PROVIDERS (Internal use)
    // ============================================
    FriendService,
    PartyService,
    ChatService,
    PresenceService,
  ],
  exports: [
    // ============================================
    // ONLY EXPORT DI TOKENS - NEVER CONCRETE CLASSES!
    // This forces consumers to use interface-based injection.
    // ============================================
    DI_TOKENS.FRIEND_SERVICE,
    DI_TOKENS.PARTY_SERVICE,
    DI_TOKENS.CHAT_SERVICE,
    DI_TOKENS.PRESENCE_SERVICE,
  ],
})
export class SocialModule {}
