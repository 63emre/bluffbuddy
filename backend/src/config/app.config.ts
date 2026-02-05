/**
 * ==========================================================
 * APP CONFIGURATION
 * ==========================================================
 * BluffBuddy Online - Application Configuration
 *
 * @owner DEV1 (Infrastructure)
 * @version v0.2.0
 *
 * USAGE:
 * ```typescript
 * // In services:
 * constructor(private configService: ConfigService) {}
 *
 * // Access config:
 * const port = this.configService.get<number>('app.port');
 * const env = this.configService.get<AppEnvironment>('app.environment');
 * ```
 *
 * ENVIRONMENT VARIABLES:
 * - NODE_ENV: 'development' | 'production' | 'test'
 * - PORT: HTTP server port (default: 3000)
 * - API_PREFIX: API route prefix (default: 'api')
 * - CORS_ORIGINS: Comma-separated allowed origins
 * ==========================================================
 */

import { registerAs } from '@nestjs/config';

/**
 * Application Environment Types
 */
export type AppEnvironment = 'development' | 'production' | 'test';

/**
 * Application Configuration Schema
 */
export interface AppConfig {
  /** Server port */
  port: number;
  /** Current environment */
  environment: AppEnvironment;
  /** API route prefix */
  apiPrefix: string;
  /** CORS allowed origins */
  corsOrigins: string[];
  /** Application name */
  name: string;
  /** Application version */
  version: string;
  /** Enable debug mode */
  debug: boolean;
}

/**
 * Parse environment to typed value
 */
function parseEnvironment(env: string | undefined): AppEnvironment {
  const validEnvs: AppEnvironment[] = ['development', 'production', 'test'];
  const normalized = (env || 'development').toLowerCase() as AppEnvironment;
  return validEnvs.includes(normalized) ? normalized : 'development';
}

/**
 * Parse CORS origins from comma-separated string
 */
function parseCorsOrigins(origins: string | undefined): string[] {
  if (!origins) {
    return ['http://localhost:3000', 'http://localhost:8080'];
  }
  return origins.split(',').map((origin) => origin.trim());
}

/**
 * App Configuration Factory
 * Registered under 'app' namespace
 */
export const appConfig = registerAs(
  'app',
  (): AppConfig => ({
    port: parseInt(process.env.PORT || '3000', 10),
    environment: parseEnvironment(process.env.NODE_ENV),
    apiPrefix: process.env.API_PREFIX || 'api',
    corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),
    name: 'BluffBuddy Online',
    version: process.env.npm_package_version || '0.2.0',
    debug:
      process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development',
  }),
);
