/**
 * ==========================================================
 * SHARED CONTRACTS - BARREL EXPORT
 * ==========================================================
 * BluffBuddy Online - The "Bible" for Parallel Development
 *
 * @owner ALL DEVELOPERS (Shared Responsibility)
 * @version v0.2.0
 * @created February 2026
 *
 * This barrel export provides clean access to all contracts
 * without exposing internal structure.
 *
 * Usage:
 * ```typescript
 * import { IGameEngine, DI_TOKENS, IUserRepository } from '@shared/contracts';
 * ```
 * ==========================================================
 */

// Dependency Injection Tokens - Use these in modules
export * from './di-tokens';

// Core service interfaces (for DIP compliance)
export * from './interfaces/game.interfaces';
export * from './interfaces/persistence.interfaces';
export * from './interfaces/social.interfaces';
export * from './interfaces/infrastructure.interfaces';
export * from './interfaces/economy.interfaces';

// Enums (shared across all modules)
export * from './enums';

// Socket event constants
export * from './events';

// Entity/Value Object interfaces
export * from './entities';

// Payload interfaces (Socket.io payloads)
export * from './payloads';
