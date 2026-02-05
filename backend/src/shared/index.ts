/**
 * ==========================================================
 * SHARED MODULE BARREL EXPORT
 * ==========================================================
 * BluffBuddy Online - All Shared Resources
 *
 * @owner DEV1 + DEV2 + DEV3
 * @version v0.2.0
 *
 * Usage:
 * ```typescript
 * // Import contracts (interfaces, DI tokens, enums)
 * import { IGameEngine, DI_TOKENS, GamePhase } from '@shared/contracts';
 *
 * // Import DTOs for validation
 * import { PlayCardDto, JoinRoomDto } from '@shared/dtos';
 *
 * // Import utilities
 * import { generateRoomCode } from '@shared/utils';
 * ```
 *
 * RULES:
 * 1. Use @shared/contracts for interfaces and DI tokens
 * 2. Use @shared/dtos for request/response validation
 * 3. Use @shared/constants for game configuration
 * ==========================================================
 */

// The "Golden Source" - contracts for cross-module communication
export * from './contracts';

// Types (legacy support - prefer contracts)
export * from './types';

// DTOs for validation
export * from './dtos';

// Game constants
export * from './constants';

// Utility functions
export * from './utils';

// Module registration
export * from './shared.module';
