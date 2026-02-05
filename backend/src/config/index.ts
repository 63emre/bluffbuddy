/**
 * ==========================================================
 * CONFIG MODULE BARREL EXPORT
 * ==========================================================
 * BluffBuddy Online - Configuration Module
 *
 * @owner DEV1 (Infrastructure)
 * @version v0.2.0
 * @see docs/v0.1.0/01-Infrastructure.md
 *
 * USAGE:
 * ```typescript
 * // In services - access config via ConfigService:
 * import { ConfigService } from '@nestjs/config';
 * import { AppConfig, RedisConfig } from '@config';
 *
 * constructor(private configService: ConfigService) {}
 *
 * // Type-safe config access:
 * const port = this.configService.get<number>('app.port');
 * const redisUrl = this.configService.get<string>('redis.url');
 * ```
 *
 * NAMESPACE HIERARCHY:
 * - app.*: Application settings (port, env, CORS)
 * - redis.*: Redis connection settings
 * - firebase.*: Firebase/Firestore settings
 * - game.*: Game engine settings (timing, rules, ELO)
 * - socket.*: WebSocket settings (Socket.io)
 * ==========================================================
 */

// ============================================
// CONFIGURATION FACTORIES
// Used by InfrastructureModule.forRoot()
// ============================================
export { appConfig } from './app.config';
export { redisConfig } from './redis.config';
export { firebaseConfig } from './firebase.config';
export { gameConfig } from './game.config';
export { socketConfig } from './socket.config';

// ============================================
// TYPE EXPORTS (for type-safe access)
// ============================================
export type { AppConfig, AppEnvironment } from './app.config';
export type { RedisConfig } from './redis.config';
export type { FirebaseConfig, FirebaseCredentials } from './firebase.config';
export type {
  GameConfig,
  GameTimingConfig,
  GameRulesConfig,
  EloConfig,
} from './game.config';
export type {
  SocketConfig,
  SocketCorsConfig,
  StateRecoveryConfig,
} from './socket.config';
