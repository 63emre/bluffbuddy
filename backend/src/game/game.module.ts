/**
 * ==========================================================
 * GAME MODULE
 * ==========================================================
 * BluffBuddy Online - Game Module Registration
 * 
 * @owner DEV2 (Game Engine)
 * @iteration v0.1.0
 * @see docs/v0.1.0/03-GameEngine.md
 * 
 * DEV RESPONSIBILITIES:
 * - DEV2: Complete game module implementation
 * 
 * MODULE CONTENTS:
 * - GameGateway: Socket.io WebSocket gateway
 * - GameService: Core game logic
 * - RoomService: Room management
 * - MatchmakingService: Queue and matchmaking
 * - StateService: Game state management
 * - SealService: Mühür (seal) detection algorithm
 * ==========================================================
 */

// ----------------------------------------------------------
// ITERATION v0.1.0 - Full module implementation
// ----------------------------------------------------------

import { Module } from '@nestjs/common';
import { GameGateway } from './gateways';
import { 
  GameService, 
  RoomService, 
  MatchmakingService, 
  StateService,
  SealService,
} from './services';

/**
 * GameModule
 * Game module for BluffBuddy
 * 
 * @see docs/v0.1.0/03-GameEngine.md
 */
@Module({
  providers: [
    GameGateway, 
    GameService, 
    RoomService, 
    MatchmakingService, 
    StateService,
    SealService,
  ],
  exports: [
    GameService, 
    RoomService, 
    MatchmakingService, 
    StateService,
    SealService,
  ],
})
export class GameModule {}
