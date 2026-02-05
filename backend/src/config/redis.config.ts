/**
 * ==========================================================
 * REDIS CONFIGURATION
 * ==========================================================
 * BluffBuddy Online - Redis Configuration
 *
 * @owner DEV1 (Infrastructure)
 * @version v0.2.0
 * @see docs/v0.1.0/01-Infrastructure.md - Section 4
 *
 * USAGE:
 * ```typescript
 * // In services:
 * const redisUrl = this.configService.get<string>('redis.url');
 * const keyPrefix = this.configService.get<string>('redis.keyPrefix');
 * ```
 *
 * ENVIRONMENT VARIABLES:
 * - REDIS_URL: Full Redis connection URL (overrides host/port)
 * - REDIS_HOST: Redis host (default: 'localhost')
 * - REDIS_PORT: Redis port (default: 6379)
 * - REDIS_PASSWORD: Redis password (optional)
 * - REDIS_DB: Redis database number (default: 0)
 * - REDIS_KEY_PREFIX: Key prefix for namespacing (default: 'bb:')
 * ==========================================================
 */

import { registerAs } from '@nestjs/config';

/**
 * Redis Configuration Schema
 */
export interface RedisConfig {
  /** Full connection URL (takes precedence) */
  url: string | null;
  /** Redis host */
  host: string;
  /** Redis port */
  port: number;
  /** Redis password (optional) */
  password: string | null;
  /** Database number */
  db: number;
  /** Key prefix for namespacing */
  keyPrefix: string;
  /** Connection timeout in milliseconds */
  connectTimeout: number;
  /** Command timeout in milliseconds */
  commandTimeout: number;
  /** Enable TLS (for production) */
  tls: boolean;
  /** Max retry attempts */
  maxRetries: number;
  /** Retry delay in milliseconds */
  retryDelay: number;
}

/**
 * Build Redis URL from components if not provided
 */
function buildRedisUrl(config: {
  host: string;
  port: number;
  password: string | null;
  db: number;
}): string {
  const auth = config.password ? `:${config.password}@` : '';
  return `redis://${auth}${config.host}:${config.port}/${config.db}`;
}

/**
 * Redis Configuration Factory
 * Registered under 'redis' namespace
 */
export const redisConfig = registerAs('redis', (): RedisConfig => {
  const host = process.env.REDIS_HOST || 'localhost';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  const password = process.env.REDIS_PASSWORD || null;
  const db = parseInt(process.env.REDIS_DB || '0', 10);

  return {
    url: process.env.REDIS_URL || buildRedisUrl({ host, port, password, db }),
    host,
    port,
    password,
    db,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'bb:',
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000', 10),
    commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '5000', 10),
    tls: process.env.REDIS_TLS === 'true',
    maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10),
    retryDelay: parseInt(process.env.REDIS_RETRY_DELAY || '1000', 10),
  };
});
