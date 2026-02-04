/**
 * ==========================================================
 * SHARED TYPES - MAIN BARREL EXPORT
 * ==========================================================
 * BluffBuddy Online - All Shared Type Definitions
 * 
 * @owner DEV1 + DEV2 + DEV3
 * @iteration v0.1.0
 * 
 * Usage:
 * ```typescript
 * import { Card, GamePhase, PlayCardPayload, GAME_EVENTS } from '@shared/types';
 * ```
 * ==========================================================
 */

// ----------------------------------------------------------
// ITERATION v0.1.0 - Initial shared types library
// TODO v0.1.1: Add request/response wrapper types
// TODO v0.2.0: Add validation schemas (zod/joi)
// ----------------------------------------------------------

// Socket event constants
export * from './events';

// Game domain types
export * from './game';

// Payload interfaces
export * from './payloads';

// Error codes
export * from './errors';
