/**
 * ==========================================================
 * MAIN BOOTSTRAP
 * ==========================================================
 * BluffBuddy Online - Application Entry Point
 *
 * @owner DEV1 (Infrastructure)
 * @version v0.2.0
 *
 * BOOTSTRAP RESPONSIBILITIES:
 * - NestJS application initialization
 * - Swagger API documentation setup
 * - Global middleware configuration
 * - CORS and security settings
 * - SmartLogger global configuration
 * ==========================================================
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { SmartLoggerService } from './infrastructure/logger';

async function bootstrap() {
  // ============================================
  // LOGGER INITIALIZATION
  // ============================================
  // Create app with minimal logging first
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // Buffer logs until SmartLogger is ready
  });

  // Get SmartLoggerService and set as global logger
  const smartLogger = app.get(SmartLoggerService);
  app.useLogger(smartLogger);

  // Create bootstrap-specific logger instance
  const logger = smartLogger.child('Bootstrap');

  const configService = app.get(ConfigService);

  // ============================================
  // GLOBAL CONFIGURATION
  // ============================================
  const port = configService.get<number>('app.port') || 3000;
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api';
  const environment =
    configService.get<string>('app.environment') || 'development';
  const corsOrigins = configService.get<string[]>('app.corsOrigins') || [
    'http://localhost:3000',
  ];

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global Prefix
  app.setGlobalPrefix(apiPrefix);

  // ============================================
  // SECURITY MIDDLEWARE
  // ============================================
  app.use(
    helmet({
      contentSecurityPolicy: environment === 'production' ? undefined : false,
    }),
  );
  app.use(compression());

  // CORS
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // ============================================
  // GLOBAL PIPES
  // ============================================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ============================================
  // SWAGGER API DOCUMENTATION
  // ============================================
  if (environment !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('BluffBuddy Online API')
      .setDescription(
        `
# BluffBuddy Online - Game Server API

## Overview
This API powers the BluffBuddy Online multiplayer card game. It handles:
- **Authentication** via Firebase
- **Game Management** (rooms, matchmaking, game state)
- **Social Features** (friends, parties, chat)
- **Economy** (chips, IAP, rewards)
- **Rating System** (ELO, leaderboards)

## Architecture
The backend follows a **Modular Monolith** architecture:
- Each module is independent and communicates via DI tokens
- WebSocket events are handled separately (see Socket.io docs)
- All state is persisted in Redis (ephemeral) and Firestore (permanent)

## Authentication
All protected endpoints require a Firebase ID token in the Authorization header:
\`\`\`
Authorization: Bearer <firebase-id-token>
\`\`\`

## Rate Limiting
- **HTTP API**: 100 requests/minute per IP
- **WebSocket**: 60 messages/minute per connection

## Error Codes
See the ErrorCode enum in the contracts for machine-readable error codes.
      `,
      )
      .setVersion('0.2.0')
      .setContact(
        'BluffBuddy Team',
        'https://bluffbuddy.com',
        'dev@bluffbuddy.com',
      )
      .setLicense('Proprietary', 'https://bluffbuddy.com/license')
      .addServer('http://localhost:3000', 'Local Development')
      .addServer('https://api.bluffbuddy.com', 'Production')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Firebase Auth',
          description: 'Firebase ID Token',
          in: 'header',
        },
        'firebase-auth',
      )
      .addTag('Health', 'System health and status endpoints')
      .addTag('Auth', 'Authentication and user session management')
      .addTag('Users', 'User profile and settings')
      .addTag('Game', 'Game room and matchmaking operations')
      .addTag('Social', 'Friends, parties, and chat')
      .addTag('Economy', 'Chips, purchases, and rewards')
      .addTag('Rating', 'ELO ratings and leaderboards')
      .addTag('Admin', 'Administrative operations (internal)')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig, {
      operationIdFactory: (controllerKey: string, methodKey: string) =>
        methodKey,
    });

    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
      customSiteTitle: 'BluffBuddy API Docs',
      customfavIcon: 'https://bluffbuddy.com/favicon.ico',
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info { margin: 20px 0 }
      `,
    });

    logger.info(`📚 Swagger docs available at http://localhost:${port}/docs`);
  }

  // ============================================
  // START SERVER
  // ============================================
  await app.listen(port);
  logger.info(
    `🚀 BluffBuddy API running on http://localhost:${port}/${apiPrefix}`,
  );
  logger.info(`🌍 Environment: ${environment}`);
  logger.info(`📊 SmartLogger active - Console (Dozzle) + Firestore (Batched)`);

  // ============================================
  // GRACEFUL SHUTDOWN
  // ============================================
  // TODO: Implement graceful shutdown handler
  // - Flush all buffered logs to Firestore before exit
  // - Handle SIGTERM/SIGINT signals
  // process.on('SIGTERM', async () => {
  //   await smartLogger.flush();
  //   await app.close();
  // });
}

bootstrap();
