/**
 * ==========================================================
 * GAME MODULE
 * ==========================================================
 * BluffBuddy Online - Game Module Registration
 *
 * @owner DEV2 (Game Engine)
 * @version v0.2.0
 * @see docs/v0.1.0/03-GameEngine.md
 *
 * DEV RESPONSIBILITIES:
 * - DEV2: Complete game module implementation
 *
 * MODULE CONTENTS:
 * - GameGateway: Socket.io WebSocket gateway
 * - GameService: Core game logic (implements IGameEngine)
 * - RoomService: Room management (implements IRoomService)
 * - MatchmakingService: Queue and matchmaking (implements IMatchmakingService)
 * - StateService: Game state management (implements IStateService)
 * - SealService: Mühür (seal) detection algorithm (implements ISealService)
 *
 * DI PATTERN:
 * This module uses interface-based dependency injection.
 * Other modules inject via DI_TOKENS, not concrete classes.
 * ==========================================================
 */

import { Module, forwardRef } from '@nestjs/common';
import { DI_TOKENS } from '../shared/contracts';
import { GameGateway } from './gateways';
import { GameController } from './controllers';
import {
  GameService,
  RoomService,
  MatchmakingService,
  StateService,
  SealService,
  TimerService,
  MatchingService,
  ScoringService,
} from './services';
import { AuthModule } from '../auth';
import { DatabaseModule } from '../database';
import { InfrastructureModule } from '../infrastructure';

/**
 * GameModule
 * Core game module for BluffBuddy
 *
 * @see docs/v0.1.0/03-GameEngine.md
 */
@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => DatabaseModule),
    forwardRef(() => InfrastructureModule),
  ],
  controllers: [GameController],
  providers: [
    // Gateway
    GameGateway,

    // ============================================
    // INTERFACE-BASED PROVIDERS (Public API)
    // Other modules inject these via DI_TOKENS
    // ============================================
    {
      provide: DI_TOKENS.GAME_ENGINE,
      useClass: GameService,
    },
    {
      provide: DI_TOKENS.ROOM_SERVICE,
      useClass: RoomService,
    },
    {
      provide: DI_TOKENS.MATCHMAKING_SERVICE,
      useClass: MatchmakingService,
    },
    {
      provide: DI_TOKENS.STATE_SERVICE,
      useClass: StateService,
    },
    {
      provide: DI_TOKENS.SEAL_SERVICE,
      useClass: SealService,
    },
    {
      provide: DI_TOKENS.TIMER_SERVICE,
      useClass: TimerService,
    },
    {
      provide: DI_TOKENS.MATCHING_SERVICE,
      useClass: MatchingService,
    },
    {
      provide: DI_TOKENS.SCORING_SERVICE,
      useClass: ScoringService,
    },

    // ============================================
    // CONCRETE CLASS PROVIDERS (Internal use)
    // These are for direct injection within this module
    // ============================================
    GameService,
    RoomService,
    MatchmakingService,
    StateService,
    SealService,
    TimerService,
    MatchingService,
    ScoringService,
  ],
  exports: [
    // ============================================
    // ONLY EXPORT DI TOKENS - NEVER CONCRETE CLASSES!
    // This forces consumers to use interface-based injection.
    // ============================================
    DI_TOKENS.GAME_ENGINE,
    DI_TOKENS.ROOM_SERVICE,
    DI_TOKENS.MATCHMAKING_SERVICE,
    DI_TOKENS.STATE_SERVICE,
    DI_TOKENS.SEAL_SERVICE,
    DI_TOKENS.TIMER_SERVICE,
    DI_TOKENS.MATCHING_SERVICE,
    DI_TOKENS.SCORING_SERVICE,
  ],
})
export class GameModule {}
