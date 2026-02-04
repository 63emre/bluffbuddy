# 09 - Deployment & DevOps

> **Owner:** Developer 1 (Infra & Architecture)  
> **Last Updated:** February 2026  
> **Status:** Specification

---

## Table of Contents

1. [Overview](#1-overview)
2. [Docker Configuration](#2-docker-configuration)
3. [Docker Compose](#3-docker-compose)
4. [Logging](#4-logging)
5. [Health Checks](#5-health-checks)
6. [CI/CD Pipeline](#6-cicd-pipeline)
7. [Monitoring](#7-monitoring)
8. [Static Assets & CDN](#8-static-assets--cdn)
9. [Deployment Checklist](#9-deployment-checklist)

---

## 1. Overview

BluffBuddy Online uses a containerized deployment strategy with Docker on a single Hetzner Cloud server (CPX21). The focus is on simplicity, reliability, and easy rollback.

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    HETZNER CLOUD CPX21                          │
│                    (3 vCPU, 4GB RAM)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    DOCKER ENGINE                         │   │
│   │                                                          │   │
│   │   ┌─────────────────────────────────────────────────┐   │   │
│   │   │          bluffbuddy-server container            │   │   │
│   │   │                                                  │   │   │
│   │   │   • NestJS Application                          │   │   │
│   │   │   • Socket.io Server                            │   │   │
│   │   │   • REST API                                    │   │   │
│   │   │   • Memory: ~512MB - 1.5GB                      │   │   │
│   │   │                                                  │   │   │
│   │   │   Ports: 3000 (HTTP/WS)                         │   │   │
│   │   └─────────────────────────────────────────────────┘   │   │
│   │                                                          │   │
│   │   ┌─────────────────────────────────────────────────┐   │   │
│   │   │          bluffbuddy-redis container             │   │   │
│   │   │   • Game State Persistence                      │   │   │
│   │   │   • Memory: 256MB (capped)                      │   │   │
│   │   └─────────────────────────────────────────────────┘   │   │
│   │                                                          │   │
│   │   ┌─────────────────────────────────────────────────┐   │   │
│   │   │              Volumes                             │   │   │
│   │   │   • /app/logs  ──► /var/log/bluffbuddy          │   │   │
│   │   │   • redis_data ──► /data                        │   │   │
│   │   └─────────────────────────────────────────────────┘   │   │
│   │                                                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   External Services (Cloud):                                    │
│   • Firebase Firestore (Database)                               │
│   • Firebase Auth (Authentication)                              │
│   • Cloudflare R2 / Firebase Storage (Static Assets)            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Why Single Server?

| Concern | Answer |
|---------|--------|
| **Cost** | €7.55/month fits €12 budget |
| **Complexity** | No orchestration overhead (K8s) |
| **Scale** | 250 CCU target easily handled |
| **Latency** | Single process = no network hops |
| **Recovery** | Docker restart < 5 seconds |

---

## 2. Docker Configuration

### 2.1 Dockerfile (Multi-Stage Build)

Multi-stage builds create smaller, more secure images:

```dockerfile
# Dockerfile

# ============================================
# STAGE 1: Build
# ============================================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Prune dev dependencies
RUN npm prune --production


# ============================================
# STAGE 2: Production
# ============================================
FROM node:20-alpine AS production

# Security: Don't run as root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

WORKDIR /app

# Copy only production files from builder
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json

# Create logs directory
RUN mkdir -p /app/logs && chown nestjs:nodejs /app/logs

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start application
CMD ["node", "dist/main.js"]
```

### 2.2 .dockerignore

```
# .dockerignore

# Dependencies
node_modules

# Build output
dist

# Development files
.git
.gitignore
*.md
.env*

# IDE
.vscode
.idea

# Tests
test
*.spec.ts
coverage

# Docker files (prevent recursive copying)
Dockerfile
docker-compose*.yml
.dockerignore

# Logs
logs
*.log
```

### 2.3 Build Commands

```bash
# Build image
docker build -t bluffbuddy-server:latest .

# Build with version tag
docker build -t bluffbuddy-server:v0.1.0 .

# Build with cache optimization
docker build --build-arg BUILDKIT_INLINE_CACHE=1 -t bluffbuddy-server:latest .
```

### 2.4 Image Size Optimization

| Stage | Size | Contents |
|-------|------|----------|
| Builder | ~400MB | Full dependencies + source |
| Production | ~150MB | Runtime only |

---

## 3. Docker Compose

### 3.1 docker-compose.yml

```yaml
# docker-compose.yml

version: '3.8'

services:
  bluffbuddy-server:
    image: bluffbuddy-server:latest
    container_name: bluffbuddy-server
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    
    ports:
      - "3000:3000"
    
    environment:
      - NODE_ENV=production
      - PORT=3000
      # Firebase (from .env or secrets)
      - FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
      - FIREBASE_PRIVATE_KEY=${FIREBASE_PRIVATE_KEY}
      - FIREBASE_CLIENT_EMAIL=${FIREBASE_CLIENT_EMAIL}
      # JWT
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRES_IN=7d
      # Apple IAP
      - APPLE_BUNDLE_ID=${APPLE_BUNDLE_ID}
      - APPLE_KEY_ID=${APPLE_KEY_ID}
      - APPLE_ISSUER_ID=${APPLE_ISSUER_ID}
      - APPLE_PRIVATE_KEY=${APPLE_PRIVATE_KEY}
      # Google IAP
      - GOOGLE_PACKAGE_NAME=${GOOGLE_PACKAGE_NAME}
      - GOOGLE_CLIENT_EMAIL=${GOOGLE_CLIENT_EMAIL}
      - GOOGLE_PRIVATE_KEY=${GOOGLE_PRIVATE_KEY}
    
    volumes:
      # Persist logs outside container
      - ./logs:/app/logs
    
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 512M
    
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
```

### 3.2 docker-compose.override.yml (Development)

```yaml
# docker-compose.override.yml
# Automatically loaded in development

version: '3.8'

services:
  bluffbuddy-server:
    build:
      context: .
      target: builder  # Use builder stage with hot-reload
    
    volumes:
      - .:/app           # Mount source code
      - /app/node_modules  # Exclude node_modules
    
    command: npm run start:dev
    
    environment:
      - NODE_ENV=development
```

### 3.3 Docker Commands

```bash
# Start in production mode
docker-compose up -d

# Start in development mode (uses override)
docker-compose up

# View logs
docker-compose logs -f bluffbuddy-server

# Rebuild and restart
docker-compose up -d --build

# Stop
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

---

## 4. Logging

### 4.1 Pino Logger Configuration

NestJS with Pino for structured JSON logging:

```typescript
// src/logger/logger.config.ts

import { LoggerModuleAsyncParams } from 'nestjs-pino';
import pino from 'pino';

export const loggerConfig: LoggerModuleAsyncParams = {
  useFactory: () => ({
    pinoHttp: {
      // Use 'info' in production, 'debug' in development
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      
      // Pretty print in development
      transport:
        process.env.NODE_ENV !== 'production'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                singleLine: true,
              },
            }
          : undefined,
      
      // Production: JSON to file
      stream:
        process.env.NODE_ENV === 'production'
          ? pino.destination({
              dest: '/app/logs/app.log',
              sync: false,  // Async for performance
              mkdir: true,
            })
          : undefined,
      
      // Redact sensitive fields
      redact: {
        paths: ['req.headers.authorization', 'req.headers.cookie', 'body.password'],
        censor: '[REDACTED]',
      },
      
      // Custom serializers
      serializers: {
        req: (req) => ({
          method: req.method,
          url: req.url,
          query: req.query,
        }),
        res: (res) => ({
          statusCode: res.statusCode,
        }),
      },
      
      // Custom log format
      formatters: {
        level: (label) => ({ level: label }),
        bindings: (bindings) => ({
          pid: bindings.pid,
          hostname: bindings.hostname,
          service: 'bluffbuddy-server',
        }),
      },
    },
  }),
};
```

### 4.2 App Module Integration

```typescript
// src/app.module.ts

import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { loggerConfig } from './logger/logger.config';

@Module({
  imports: [
    LoggerModule.forRootAsync(loggerConfig),
    // ... other modules
  ],
})
export class AppModule {}
```

### 4.3 Main.ts Logger Setup

```typescript
// src/main.ts

import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,  // Buffer logs until logger is ready
  });
  
  // Use Pino as the application logger
  app.useLogger(app.get(Logger));
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  app.get(Logger).log(`Server running on port ${port}`);
}
bootstrap();
```

### 4.4 Log Rotation with Logrotate

```bash
# /etc/logrotate.d/bluffbuddy

/var/log/bluffbuddy/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 nodejs nodejs
    postrotate
        docker kill --signal=USR1 bluffbuddy-server
    endscript
}
```

### 4.5 Log Levels

| Level | When to Use |
|-------|-------------|
| `error` | Unrecoverable errors, exceptions |
| `warn` | Recoverable issues, deprecations |
| `info` | Business events (game start, purchase) |
| `debug` | Development debugging |
| `trace` | Detailed tracing (rarely used) |

### 4.6 Log Examples

```json
// Game start event
{
  "level": "info",
  "time": 1708786800000,
  "service": "bluffbuddy-server",
  "msg": "Game started",
  "matchId": "abc123",
  "players": ["user1", "user2", "user3", "user4"],
  "mode": "ranked"
}

// Error example
{
  "level": "error",
  "time": 1708786801000,
  "service": "bluffbuddy-server",
  "msg": "IAP verification failed",
  "userId": "user123",
  "store": "apple",
  "error": "INVALID_RECEIPT",
  "stack": "Error: INVALID_RECEIPT\n    at AppleVerifier..."
}
```

---

## 5. Health Checks

### 5.1 Health Controller

```typescript
// src/health/health.controller.ts

import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck, MemoryHealthIndicator, DiskHealthIndicator } from '@nestjs/terminus';
import { FirestoreHealthIndicator } from './firestore.health';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private firestore: FirestoreHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // Memory: Heap should be < 1.5GB
      () => this.memory.checkHeap('memory_heap', 1500 * 1024 * 1024),
      
      // Memory: RSS should be < 2GB
      () => this.memory.checkRSS('memory_rss', 2000 * 1024 * 1024),
      
      // Disk: > 10% free space
      () => this.disk.checkStorage('disk', {
        path: '/',
        thresholdPercent: 0.1,
      }),
      
      // Firebase Firestore connection
      () => this.firestore.isHealthy('firestore'),
    ]);
  }

  @Get('live')
  liveness() {
    // Simple liveness - is the process running?
    return { status: 'ok' };
  }

  @Get('ready')
  @HealthCheck()
  readiness() {
    // Readiness - can we serve traffic?
    return this.health.check([
      () => this.firestore.isHealthy('firestore'),
    ]);
  }
}
```

### 5.2 Custom Firestore Health Indicator

```typescript
// src/health/firestore.health.ts

import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { FirestoreService } from '../persistence/firestore.service';

@Injectable()
export class FirestoreHealthIndicator extends HealthIndicator {
  constructor(private firestore: FirestoreService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Simple read to verify connectivity
      const db = this.firestore.getFirestore();
      await db.collection('_health').doc('ping').get();
      
      return this.getStatus(key, true);
    } catch (error) {
      throw new HealthCheckError(
        'Firestore health check failed',
        this.getStatus(key, false, { error: error.message }),
      );
    }
  }
}
```

### 5.3 Health Module

```typescript
// src/health/health.module.ts

import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { FirestoreHealthIndicator } from './firestore.health';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [FirestoreHealthIndicator],
})
export class HealthModule {}
```

### 5.4 Health Check Response

```json
// GET /health
{
  "status": "ok",
  "info": {
    "memory_heap": { "status": "up" },
    "memory_rss": { "status": "up" },
    "disk": { "status": "up" },
    "firestore": { "status": "up" }
  },
  "error": {},
  "details": {
    "memory_heap": { "status": "up" },
    "memory_rss": { "status": "up" },
    "disk": { "status": "up" },
    "firestore": { "status": "up" }
  }
}
```

---

## 6. CI/CD Pipeline

### 6.1 GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml

name: Build & Deploy

on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}/bluffbuddy-server

jobs:
  # ================================
  # TEST
  # ================================
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Run tests
        run: npm run test
      
      - name: Run e2e tests
        run: npm run test:e2e

  # ================================
  # BUILD
  # ================================
  build:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=sha,prefix=
      
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # ================================
  # DEPLOY
  # ================================
  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || startsWith(github.ref, 'refs/tags/v')
    
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /opt/bluffbuddy
            
            # Pull latest image
            docker pull ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
            
            # Update docker-compose with new image tag
            export IMAGE_TAG=${{ github.sha }}
            
            # Rolling update
            docker-compose up -d --no-deps bluffbuddy-server
            
            # Wait for health check
            sleep 10
            
            # Verify deployment
            curl -f http://localhost:3000/health || exit 1
            
            # Clean up old images
            docker image prune -f
```

### 6.2 Environment Secrets

Configure these in GitHub repository settings:

| Secret | Description |
|--------|-------------|
| `SERVER_HOST` | Hetzner server IP |
| `SERVER_USER` | SSH username |
| `SERVER_SSH_KEY` | SSH private key |
| `FIREBASE_*` | Firebase credentials |
| `JWT_SECRET` | JWT signing secret |
| `APPLE_*` | Apple IAP credentials |
| `GOOGLE_*` | Google IAP credentials |

---

## 7. Monitoring

### 7.1 Basic Metrics Endpoint

```typescript
// src/metrics/metrics.controller.ts

import { Controller, Get } from '@nestjs/common';
import { GameService } from '../game/game.service';
import { PresenceService } from '../social/presence.service';

interface ServerMetrics {
  timestamp: number;
  uptime: number;
  memory: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
  game: {
    activeGames: number;
    playersInGames: number;
  };
  connections: {
    total: number;
    authenticated: number;
  };
}

@Controller('metrics')
export class MetricsController {
  constructor(
    private gameService: GameService,
    private presenceService: PresenceService,
  ) {}

  @Get()
  getMetrics(): ServerMetrics {
    const memory = process.memoryUsage();
    
    return {
      timestamp: Date.now(),
      uptime: process.uptime(),
      memory: {
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal,
        rss: memory.rss,
      },
      game: {
        activeGames: this.gameService.getActiveGameCount(),
        playersInGames: this.gameService.getTotalPlayersInGames(),
      },
      connections: {
        total: this.presenceService.getTotalConnections(),
        authenticated: this.presenceService.getAuthenticatedConnections(),
      },
    };
  }
}
```

### 7.2 Simple Alerting (Cron-based)

```bash
#!/bin/bash
# /opt/bluffbuddy/scripts/health-alert.sh

HEALTH_URL="http://localhost:3000/health"
WEBHOOK_URL="https://discord.com/api/webhooks/YOUR_WEBHOOK"

response=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ "$response" != "200" ]; then
    curl -X POST $WEBHOOK_URL \
        -H "Content-Type: application/json" \
        -d "{\"content\": \"🚨 BluffBuddy server health check failed! Status: $response\"}"
fi
```

```bash
# Crontab entry (every 5 minutes)
*/5 * * * * /opt/bluffbuddy/scripts/health-alert.sh
```

### 7.3 Future Monitoring (v0.2.0)

For scale, consider:
- **Prometheus** + **Grafana** for metrics visualization
- **Sentry** for error tracking
- **Better Stack** (formerly Logtail) for log aggregation

---

## 8. Deployment Checklist

### 8.1 Pre-Deployment

- [ ] All tests passing (`npm test`, `npm run test:e2e`)
- [ ] Linting clean (`npm run lint`)
- [ ] Version bumped in `package.json`
- [ ] CHANGELOG updated
- [ ] Environment variables documented
- [ ] Database migrations (if any) tested

### 8.2 Deployment Steps

```bash
# 1. SSH into server
ssh user@your-server

# 2. Navigate to project
cd /opt/bluffbuddy

# 3. Pull latest code (if not using CI/CD)
git pull origin main

# 4. Pull/build Docker image
docker-compose pull
# OR
docker-compose build

# 5. Deploy with zero downtime
docker-compose up -d --no-deps bluffbuddy-server

# 6. Verify health
curl http://localhost:3000/health

# 7. Check logs
docker-compose logs -f --tail=100 bluffbuddy-server

# 8. Clean up old images
docker image prune -f
```


### 8.3 Rollback Procedure

```bash
# 1. Check available images
docker images bluffbuddy-server

# 2. Update docker-compose.yml to previous version
# OR use specific tag:
docker-compose up -d --no-deps bluffbuddy-server:v0.0.9

# 3. Verify rollback
curl http://localhost:3000/health
```

### 8.4 Post-Deployment

- [ ] Health check passing
- [ ] Logs clean (no errors)
- [ ] Metrics normal
- [ ] Test a game manually
- [ ] Monitor for 30 minutes

---

## 8. Static Assets & CDN

> ⚠️ **CRITICAL: Never serve static assets from the game server!**
>
> The CPX21 server has limited CPU/RAM (3 vCPU, 4GB). Using it to serve card images,
> avatars, and game assets wastes resources and increases latency.

### 8.1 Asset Categories

| Category | Examples | Size Estimate | Access Pattern |
|----------|----------|---------------|----------------|
| Card Images | 52 card faces, 10+ card backs | ~5 MB | High frequency |
| Avatars | Default + purchasable | ~10 MB | Medium |
| UI Assets | Buttons, icons, backgrounds | ~15 MB | Bundled in app |
| Audio | Sound effects, music | ~20 MB | On-demand |
| **Total** | | **~50 MB** | |

### 8.2 Recommended Solution: Cloudflare R2

```
┌─────────────────────────────────────────────────────────────────┐
│                    ASSET DELIVERY ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   [Unity/Flutter Client]                                        │
│           │                                                      │
│           │ Request: GET /cards/queen_hearts.png                │
│           │                                                      │
│           ▼                                                      │
│   ┌───────────────────────────────────────────────────────┐     │
│   │              CLOUDFLARE CDN (Edge)                     │     │
│   │                                                        │     │
│   │   • Global edge locations (low latency)               │     │
│   │   • Automatic caching                                  │     │
│   │   • DDoS protection                                    │     │
│   │   • Free tier: 10GB storage, unlimited bandwidth      │     │
│   └───────────────────────────────────────────────────────┘     │
│           │                                                      │
│           │ Cache Miss? Fetch from origin                       │
│           │                                                      │
│           ▼                                                      │
│   ┌───────────────────────────────────────────────────────┐     │
│   │              CLOUDFLARE R2 (Origin)                    │     │
│   │                                                        │     │
│   │   • S3-compatible API                                  │     │
│   │   • No egress fees!                                    │     │
│   │   • €0.015/GB storage                                  │     │
│   │   • Cost: ~€0.75/month for 50MB                       │     │
│   └───────────────────────────────────────────────────────┘     │
│                                                                  │
│   Game Server (CPX21) DOES NOT handle static assets!            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.3 Alternative: Firebase Storage

If already using Firebase, use Firebase Storage + CDN:

```typescript
// Firebase Storage URLs
const ASSET_BASE_URL = 'https://firebasestorage.googleapis.com/v0/b/bluffbuddy.appspot.com/o';

const cardImageUrl = (cardId: string) => 
  `${ASSET_BASE_URL}/cards%2F${cardId}.png?alt=media`;
```

**Firebase Storage Pricing:**
- Free tier: 5 GB storage, 1 GB/day download
- Blaze: $0.026/GB storage, $0.12/GB download

### 8.4 Asset Upload Pipeline

```bash
# Upload assets to R2/Firebase during CI/CD

# Using Cloudflare R2 (wrangler CLI)
wrangler r2 object put bluffbuddy-assets/cards/ --file ./assets/cards/ --content-type image/png

# Using Firebase Storage
firebase deploy --only storage
```

### 8.5 Client-Side Asset Loading

```typescript
// Unity/Flutter client configuration
const CONFIG = {
  // Production
  ASSET_CDN_URL: 'https://assets.bluffbuddy.com',
  
  // Development
  // ASSET_CDN_URL: 'http://localhost:3000/static',
};

// Card image URL construction
function getCardImageUrl(cardId: string): string {
  return `${CONFIG.ASSET_CDN_URL}/cards/${cardId}.webp`;
}

// Preload critical assets
async function preloadAssets(): Promise<void> {
  const criticalAssets = [
    '/cards/back_default.webp',
    '/ui/table_background.webp',
    '/audio/card_play.mp3',
  ];
  
  await Promise.all(
    criticalAssets.map(url => fetch(CONFIG.ASSET_CDN_URL + url))
  );
}
```

### 8.6 Asset Versioning

Use version hashes for cache invalidation:

```
/cards/v1.2.0/queen_hearts.webp
/avatars/v1.0.0/default_01.webp
```

Or use query parameters:
```
/cards/queen_hearts.webp?v=abc123
```

### 8.7 Cost Comparison

| Solution | Storage (50MB) | Bandwidth (100GB/mo) | Total/Month |
|----------|----------------|----------------------|-------------|
| **Cloudflare R2** | €0.75 | **€0** (free) | **€0.75** ✅ |
| Firebase Storage | €1.30 | €12.00 | €13.30 |
| AWS S3 + CloudFront | €0.02 | €8.50 | €8.52 |
| Self-hosted (bad idea) | €0 | CPU/RAM cost | ❌ |

**Recommendation:** Use Cloudflare R2 for best cost/performance ratio.

---

## Server Setup (One-Time)

### Initial Server Configuration

```bash
# 1. Update system
apt update && apt upgrade -y

# 2. Install Docker
curl -fsSL https://get.docker.com | sh

# 3. Install Docker Compose
apt install docker-compose-plugin

# 4. Create app user
useradd -m -s /bin/bash bluffbuddy
usermod -aG docker bluffbuddy

# 5. Create app directory
mkdir -p /opt/bluffbuddy
chown bluffbuddy:bluffbuddy /opt/bluffbuddy

# 6. Setup firewall
ufw allow 22      # SSH
ufw allow 3000    # App (or 80/443 with reverse proxy)
ufw enable

# 7. Apply sysctl optimizations (see 01-Infrastructure.md)
```

---

## Quick Reference

### Common Commands

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Logs
docker-compose logs -f bluffbuddy-server

# Restart
docker-compose restart bluffbuddy-server

# Shell into container
docker-compose exec bluffbuddy-server sh

# Resource usage
docker stats bluffbuddy-server

# Health check
curl http://localhost:3000/health
```

### File Locations

| File | Location |
|------|----------|
| Application | `/opt/bluffbuddy/` |
| Logs (host) | `/opt/bluffbuddy/logs/` |
| Logs (container) | `/app/logs/` |
| Docker data | `/var/lib/docker/` |

---

*Document Version: 1.0 | Last Updated: February 2026*

