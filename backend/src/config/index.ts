/**
 * ==========================================================
 * CONFIG MODULE
 * ==========================================================
 * BluffBuddy Online - Configuration Module
 * 
 * @owner DEV1 (Infrastructure)
 * @version v1.0.0
 * @see docs/v0.1.0/01-Infrastructure.md
 * 
 * Centralized configuration management
 * ==========================================================
 */

// TODO v0.1.1: Import ConfigModule from @nestjs/config
// TODO v0.1.1: Import configuration files
// TODO v0.1.1: Export ConfigModule with forRoot

// Configuration files to import:
// - app.config.ts
// - redis.config.ts
// - firebase.config.ts
// - game.config.ts
// - socket.config.ts

export * from './app.config';
export * from './redis.config';
export * from './firebase.config';
export * from './game.config';
export * from './socket.config';
