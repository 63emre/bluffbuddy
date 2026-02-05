/**
 * ==========================================================
 * SOCKET.IO CONFIGURATION
 * ==========================================================
 * BluffBuddy Online - WebSocket Configuration
 *
 * @owner DEV1 (Infrastructure)
 * @version v0.2.0
 * @see docs/v0.1.0/05-Networking.md
 *
 * USAGE:
 * ```typescript
 * const pingInterval = this.configService.get<number>('socket.pingInterval');
 * const cors = this.configService.get<SocketCorsConfig>('socket.cors');
 * ```
 *
 * ENVIRONMENT VARIABLES:
 * - WS_PORT: WebSocket server port (default: 3001)
 * - WS_PING_INTERVAL: Ping interval in ms (default: 25000)
 * - WS_PING_TIMEOUT: Ping timeout in ms (default: 20000)
 * - WS_MAX_HTTP_BUFFER_SIZE: Max buffer size (default: 65536)
 * - WS_CORS_ORIGINS: Allowed CORS origins (comma-separated)
 * - WS_TRANSPORTS: Allowed transports (default: 'websocket')
 * ==========================================================
 */

import { registerAs } from '@nestjs/config';

/**
 * Socket.io CORS Configuration
 */
export interface SocketCorsConfig {
  /** Allowed origins */
  origin: string[] | boolean;
  /** Allow credentials */
  credentials: boolean;
  /** Allowed methods */
  methods: string[];
}

/**
 * Connection State Recovery Configuration
 */
export interface StateRecoveryConfig {
  /** Enable state recovery */
  enabled: boolean;
  /** Max disconnection duration for recovery (ms) */
  maxDisconnectionDuration: number;
  /** Skip middlewares on recovery */
  skipMiddlewares: boolean;
}

/**
 * Full Socket.io Configuration Schema
 */
export interface SocketConfig {
  /** WebSocket server port */
  port: number;
  /** Path for socket.io endpoint */
  path: string;
  /** Ping interval in milliseconds */
  pingInterval: number;
  /** Ping timeout in milliseconds */
  pingTimeout: number;
  /** Max HTTP buffer size in bytes */
  maxHttpBufferSize: number;
  /** Connection timeout in milliseconds */
  connectTimeout: number;
  /** Allowed transports */
  transports: ('websocket' | 'polling')[];
  /** CORS configuration */
  cors: SocketCorsConfig;
  /** State recovery settings */
  stateRecovery: StateRecoveryConfig;
  /** Enable Redis adapter for scaling */
  useRedisAdapter: boolean;
}

/**
 * Parse transports from environment
 */
function parseTransports(
  value: string | undefined,
): ('websocket' | 'polling')[] {
  if (!value) return ['websocket'];
  return value.split(',').map((t) => t.trim()) as ('websocket' | 'polling')[];
}

/**
 * Parse CORS origins
 */
function parseCorsOrigins(value: string | undefined): string[] | boolean {
  if (!value) return ['http://localhost:3000', 'http://localhost:8080'];
  if (value === '*') return true;
  return value.split(',').map((o) => o.trim());
}

/**
 * Socket.io Configuration Factory
 * Registered under 'socket' namespace
 */
export const socketConfig = registerAs(
  'socket',
  (): SocketConfig => ({
    port: parseInt(process.env.WS_PORT || '3001', 10),
    path: process.env.WS_PATH || '/socket.io',
    pingInterval: parseInt(process.env.WS_PING_INTERVAL || '25000', 10),
    pingTimeout: parseInt(process.env.WS_PING_TIMEOUT || '20000', 10),
    maxHttpBufferSize: parseInt(
      process.env.WS_MAX_HTTP_BUFFER_SIZE || '65536',
      10,
    ),
    connectTimeout: parseInt(process.env.WS_CONNECT_TIMEOUT || '45000', 10),
    transports: parseTransports(process.env.WS_TRANSPORTS),
    cors: {
      origin: parseCorsOrigins(process.env.WS_CORS_ORIGINS),
      credentials: process.env.WS_CORS_CREDENTIALS !== 'false',
      methods: ['GET', 'POST'],
    },
    stateRecovery: {
      enabled: process.env.WS_STATE_RECOVERY_ENABLED === 'true',
      maxDisconnectionDuration: parseInt(
        process.env.WS_STATE_RECOVERY_DURATION || '120000',
        10,
      ),
      skipMiddlewares:
        process.env.WS_STATE_RECOVERY_SKIP_MIDDLEWARES === 'true',
    },
    useRedisAdapter:
      process.env.WS_USE_REDIS_ADAPTER === 'true' ||
      process.env.NODE_ENV === 'production',
  }),
);
