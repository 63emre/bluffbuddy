# 05 - Networking & Socket.io Protocol

> **Owner:** Developer 1 (DevOps) + Developer 2 (Game Engine)  
> **Last Updated:** February 2026  
> **Status:** Specification

---

## Table of Contents

1. [Overview](#1-overview)
2. [Socket.io Configuration](#2-socketio-configuration)
3. [Event Protocol](#3-event-protocol)
4. [Connection Lifecycle](#4-connection-lifecycle)
5. [Rate Limiting](#5-rate-limiting)
6. [Error Handling](#6-error-handling)
7. [Reconnection Strategy](#7-reconnection-strategy)
8. [Payload Optimization](#8-payload-optimization)

---

## 1. Overview

BluffBuddy Online uses **Socket.io** for real-time bidirectional communication between clients and the game server.

### Why Socket.io?

| Feature | Socket.io | Raw WebSocket |
|---------|-----------|---------------|
| Automatic reconnection | ✅ Built-in | ❌ Manual |
| Fallback transports | ✅ Polling backup | ❌ WS only |
| Room management | ✅ Native | ❌ Custom |
| Binary support | ✅ Built-in | ✅ Native |
| Event-based API | ✅ Easy | ❌ Raw frames |
| NestJS integration | ✅ @nestjs/websockets | ⚠️ More work |

### Communication Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SOCKET.IO LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   NAMESPACES (Logical separation):                              │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  /game     → Game events (play, match, state)           │   │
│   │  /social   → Friends, party, presence                   │   │
│   │  /         → Default (auth, system messages)            │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ROOMS (Dynamic grouping):                                     │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  room:{roomId}     → Players in a game room             │   │
│   │  party:{partyId}   → Party members                      │   │
│   │  user:{userId}     → Personal room for direct messages  │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Socket.io Configuration

### 2.1 Server Configuration

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Use custom adapter with optimized settings
  app.useWebSocketAdapter(new CustomIoAdapter(app));
  
  await app.listen(3000);
}
```

```typescript
// adapters/custom-io.adapter.ts
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';

export class CustomIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, {
      ...options,
      
      // CORS configuration
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      
      // Connection settings
      pingTimeout: 30000,      // 30s to respond to ping
      pingInterval: 25000,     // Send ping every 25s
      upgradeTimeout: 10000,   // 10s to upgrade from polling
      
      // Transport priority
      transports: ['websocket', 'polling'],
      allowUpgrades: true,
      
      // Performance
      perMessageDeflate: {
        threshold: 1024,       // Compress messages > 1KB
      },
      httpCompression: true,
      
      // Security
      maxHttpBufferSize: 1e6,  // 1MB max message size
      
      // Connection limits (per IP)
      connectTimeout: 45000,
    });
    
    return server;
  }
}
```

### 2.2 Gateway Configuration

```typescript
// game.gateway.ts
@WebSocketGateway({
  namespace: '/game',
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
  },
})
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  
  private readonly logger = new Logger(GameGateway.name);
  
  afterInit(server: Server) {
    // Apply authentication middleware
    server.use(wsAuthMiddleware);
    
    // Apply rate limiting middleware
    server.use(wsRateLimitMiddleware);
    
    this.logger.log('Game Gateway initialized');
  }
  
  // ... event handlers
}
```

---

## 3. Event Protocol

### 3.1 Event Naming Convention

```
Format: [domain]:[action]
Examples:
  - game:join
  - game:play
  - game:leave
  - room:create
  - room:state
  - social:friend:add
```

### 3.2 Client → Server Events

#### Authentication Events

| Event | Payload | Description |
|-------|---------|-------------|
| `auth:verify` | `{ token: string }` | Verify connection token |

#### Room Events

| Event | Payload | Description |
|-------|---------|-------------|
| `room:create` | `{ type: 'private' \| 'public' }` | Create game room |
| `room:join` | `{ roomId: string }` | Join existing room |
| `room:leave` | `{}` | Leave current room |
| `room:ready` | `{}` | Toggle ready status |

#### Game Events

| Event | Payload | Description |
|-------|---------|-------------|
| `game:play` | `PlayCardPayload` | Play a card |
| `game:target` | `{ playerId: string }` | Select penalty target |

#### Matchmaking Events

| Event | Payload | Description |
|-------|---------|-------------|
| `match:queue` | `{ type: 'ranked' \| 'casual' }` | Enter matchmaking |
| `match:cancel` | `{}` | Cancel matchmaking |

### 3.3 Server → Client Events

#### Connection Events

| Event | Payload | Description |
|-------|---------|-------------|
| `connected` | `{ userId: string }` | Connection confirmed |
| `error` | `ErrorPayload` | Error occurred |
| `kicked` | `{ reason: string }` | Forcefully disconnected |

#### Room Events

| Event | Payload | Description |
|-------|---------|-------------|
| `room:created` | `{ roomId, code }` | Room created |
| `room:joined` | `RoomStatePayload` | Joined room |
| `room:player:joined` | `{ player }` | New player joined |
| `room:player:left` | `{ playerId }` | Player left |
| `room:player:ready` | `{ playerId, ready }` | Ready status changed |

#### Game Events

| Event | Payload | Description |
|-------|---------|-------------|
| `game:start` | `GameStartPayload` | Game started |
| `game:state` | `GameStatePayload` | Full state update |
| `game:turn` | `{ playerId, timeLimit }` | Turn started |
| `game:played` | `CardPlayedPayload` | Card was played |
| `game:match` | `MatchResultPayload` | Match occurred |
| `game:seal` | `SealPayload` | Stack sealed |
| `game:round:end` | `RoundEndPayload` | Round ended |
| `game:end` | `GameEndPayload` | Game finished |

#### Matchmaking Events

| Event | Payload | Description |
|-------|---------|-------------|
| `match:searching` | `{ position }` | In queue |
| `match:found` | `{ roomId }` | Match found |
| `match:cancelled` | `{}` | Matchmaking cancelled |

### 3.4 Payload Definitions

```typescript
// payloads/game.payloads.ts

interface PlayCardPayload {
  cardId: string;           // e.g., "Q-hearts"
  targetSlotOwnerId?: string;  // For directed dumps
}

interface GameStatePayload {
  roomId: string;
  phase: GamePhase;
  round: number;
  
  // Player's own data
  myHand: Card[];
  myIndex: number;
  
  // Public board state
  openCenter: (Card | null)[];
  poolTopCard: Card | null;
  
  // Other players (masked)
  players: {
    id: string;
    nickname: string;
    cardCount: number;
    isReady: boolean;
    isConnected: boolean;
    penaltySlot: {
      topCards: Card[];
      buriedCount: number;
      isSealed: boolean;
    };
  }[];
  
  // Turn info
  currentPlayerId: string;
  turnTimeRemaining: number;
}

interface CardPlayedPayload {
  playerId: string;
  card: Card;
  result: 'match' | 'no_match';
  matchedFrom?: MatchSource[];  // Where matches came from
  targetPlayerId?: string;      // Who received the penalty
}

interface MatchSource {
  zone: 'center' | 'pool' | 'penalty';
  ownerId?: string;
  cards: Card[];
}

interface SealPayload {
  playerId: string;
  sealedRank: string;
  stackSize: number;
}

interface GameEndPayload {
  results: {
    playerId: string;
    nickname: string;
    placement: number;
    penaltyPoints: number;
    eloChange: number;
    newElo: number;
  }[];
  matchId: string;
  duration: number;
}

interface ErrorPayload {
  code: string;           // e.g., "ERR_NOT_YOUR_TURN"
  timestamp: string;
  details?: Record<string, any>;
}
```

---

## 4. Connection Lifecycle

### 4.1 Connection Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONNECTION LIFECYCLE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   1. CLIENT INITIATES CONNECTION                                │
│      ┌──────────────────────────────────────────────────────┐   │
│      │ io('wss://api.bluffbuddy.com/game', {               │   │
│      │   auth: { token: 'firebase_id_token' },             │   │
│      │   transports: ['websocket', 'polling'],             │   │
│      │ });                                                  │   │
│      └──────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│   2. SERVER MIDDLEWARE CHAIN                                    │
│      ┌──────────────────────────────────────────────────────┐   │
│      │ [Auth Middleware] → [Rate Limit] → [Accept/Reject]  │   │
│      └──────────────────────────────────────────────────────┘   │
│                              │                                   │
│              ┌───────────────┴───────────────┐                  │
│              ▼                               ▼                   │
│   3a. SUCCESS                          3b. FAILURE              │
│      ┌─────────────────────┐           ┌─────────────────────┐  │
│      │ • Attach user to    │           │ • Emit 'error'      │  │
│      │   socket            │           │ • Disconnect        │  │
│      │ • Join user room    │           │ • Log attempt       │  │
│      │ • Emit 'connected'  │           └─────────────────────┘  │
│      │ • Update presence   │                                    │
│      └─────────────────────┘                                    │
│                              │                                   │
│                              ▼                                   │
│   4. ACTIVE SESSION                                             │
│      ┌──────────────────────────────────────────────────────┐   │
│      │ • Process events                                     │   │
│      │ • Heartbeat (ping/pong)                             │   │
│      │ • Reconnection on disconnect                        │   │
│      └──────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│   5. DISCONNECTION                                              │
│      ┌──────────────────────────────────────────────────────┐   │
│      │ • Leave all rooms                                    │   │
│      │ • Notify game room (if in game)                     │   │
│      │ • Update presence to offline                        │   │
│      │ • Start reconnection window timer                   │   │
│      └──────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Connection Handler

```typescript
// game.gateway.ts

handleConnection(client: AuthenticatedSocket) {
  const userId = client.user.uid;
  this.logger.log(`Connected: ${userId}`);
  
  // Join personal room for direct messages
  client.join(`user:${userId}`);
  
  // Track connection
  this.connectionTracker.register(userId, client.id);
  
  // Update presence
  this.presenceService.setOnline(userId);
  
  // Send connection confirmation
  client.emit('connected', {
    userId,
    serverTime: new Date().toISOString(),
  });
  
  // Check if user was in a game
  const activeRoom = this.roomManager.findUserRoom(userId);
  if (activeRoom) {
    // Rejoin game room
    client.join(`room:${activeRoom.id}`);
    
    // Send current game state
    const state = this.gameEngine.getMaskedState(activeRoom.id, userId);
    client.emit('game:state', state);
  }
}

handleDisconnect(client: AuthenticatedSocket) {
  const userId = client.user?.uid;
  if (!userId) return;
  
  this.logger.log(`Disconnected: ${userId}`);
  
  // Untrack connection
  this.connectionTracker.unregister(userId, client.id);
  
  // Only process if this was the last connection for this user
  if (!this.connectionTracker.hasConnections(userId)) {
    // Update presence
    this.presenceService.setOffline(userId);
    
    // Handle game disconnection
    const activeRoom = this.roomManager.findUserRoom(userId);
    if (activeRoom) {
      this.gameEngine.handlePlayerDisconnect(activeRoom.id, userId);
      
      // Notify other players
      this.server.to(`room:${activeRoom.id}`).emit('room:player:disconnected', {
        playerId: userId,
        reconnectWindow: 60, // seconds
      });
    }
  }
}
```

---

## 5. Rate Limiting

### 5.1 Rate Limit Configuration

```typescript
// middleware/ws-rate-limit.middleware.ts

interface RateLimitConfig {
  windowMs: number;        // Time window in ms
  maxRequests: number;     // Max requests per window
  blockDuration: number;   // Block duration if exceeded
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // General events
  default: {
    windowMs: 1000,        // 1 second
    maxRequests: 10,       // 10 events/second
    blockDuration: 30000,  // 30 second block
  },
  
  // Game actions (stricter)
  'game:play': {
    windowMs: 1000,
    maxRequests: 2,        // 2 plays/second (generous)
    blockDuration: 60000,
  },
  
  // Chat (prevent spam)
  'chat:message': {
    windowMs: 5000,
    maxRequests: 5,        // 5 messages per 5 seconds
    blockDuration: 60000,
  },
  
  // Matchmaking (prevent queue spam)
  'match:queue': {
    windowMs: 10000,
    maxRequests: 3,
    blockDuration: 30000,
  },
};
```

### 5.2 Rate Limiter Implementation

```typescript
// services/rate-limiter.service.ts

@Injectable()
export class RateLimiterService {
  private buckets = new Map<string, TokenBucket>();
  private blockedUsers = new Map<string, number>(); // userId -> unblockTime
  
  isAllowed(userId: string, event: string): boolean {
    // Check if user is blocked
    const unblockTime = this.blockedUsers.get(userId);
    if (unblockTime && Date.now() < unblockTime) {
      return false;
    }
    
    // Get config for this event
    const config = RATE_LIMITS[event] || RATE_LIMITS.default;
    
    // Get or create bucket
    const bucketKey = `${userId}:${event}`;
    let bucket = this.buckets.get(bucketKey);
    
    if (!bucket) {
      bucket = new TokenBucket(config.maxRequests, config.windowMs);
      this.buckets.set(bucketKey, bucket);
    }
    
    // Try to consume a token
    if (bucket.consume()) {
      return true;
    }
    
    // Rate limit exceeded - block user
    this.blockedUsers.set(userId, Date.now() + config.blockDuration);
    
    // Log for monitoring
    this.logger.warn(`Rate limit exceeded: ${userId} on ${event}`);
    
    return false;
  }
  
  // Cleanup old buckets periodically
  @Cron('*/5 * * * *') // Every 5 minutes
  cleanup() {
    const now = Date.now();
    
    // Remove expired blocks
    for (const [userId, unblockTime] of this.blockedUsers) {
      if (now >= unblockTime) {
        this.blockedUsers.delete(userId);
      }
    }
    
    // Remove stale buckets
    for (const [key, bucket] of this.buckets) {
      if (bucket.isStale()) {
        this.buckets.delete(key);
      }
    }
  }
}

class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  
  constructor(
    private maxTokens: number,
    private refillMs: number,
  ) {
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }
  
  consume(): boolean {
    this.refill();
    
    if (this.tokens > 0) {
      this.tokens--;
      return true;
    }
    
    return false;
  }
  
  private refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    
    if (elapsed >= this.refillMs) {
      this.tokens = this.maxTokens;
      this.lastRefill = now;
    }
  }
  
  isStale(): boolean {
    return Date.now() - this.lastRefill > 300000; // 5 minutes
  }
}
```

### 5.3 Middleware Integration

```typescript
// middleware/ws-rate-limit.middleware.ts

export function createRateLimitMiddleware(rateLimiter: RateLimiterService) {
  return (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
    const originalEmit = socket.emit.bind(socket);
    
    // Wrap event handlers with rate limiting
    socket.onAny((event, ...args) => {
      const userId = socket.user?.uid;
      
      if (userId && !rateLimiter.isAllowed(userId, event)) {
        socket.emit('error', {
          code: 'ERR_RATE_LIMIT',
          message: 'Too many requests',
          retryAfter: 30,
        });
        return; // Don't process the event
      }
    });
    
    next();
  };
}
```

---

## 6. Error Handling

### 6.1 Error Categories

```typescript
// constants/ws-error-codes.ts

export const WS_ERROR_CODES = {
  // Connection errors
  ERR_AUTH_FAILED: 'ERR_AUTH_FAILED',
  ERR_TOKEN_EXPIRED: 'ERR_TOKEN_EXPIRED',
  ERR_CONNECTION_LIMIT: 'ERR_CONNECTION_LIMIT',
  
  // Rate limiting
  ERR_RATE_LIMIT: 'ERR_RATE_LIMIT',
  ERR_BLOCKED: 'ERR_BLOCKED',
  
  // Room errors
  ERR_ROOM_NOT_FOUND: 'ERR_ROOM_NOT_FOUND',
  ERR_ROOM_FULL: 'ERR_ROOM_FULL',
  ERR_ALREADY_IN_ROOM: 'ERR_ALREADY_IN_ROOM',
  ERR_NOT_IN_ROOM: 'ERR_NOT_IN_ROOM',
  
  // Game errors
  ERR_GAME_NOT_STARTED: 'ERR_GAME_NOT_STARTED',
  ERR_GAME_IN_PROGRESS: 'ERR_GAME_IN_PROGRESS',
  ERR_NOT_YOUR_TURN: 'ERR_NOT_YOUR_TURN',
  ERR_INVALID_MOVE: 'ERR_INVALID_MOVE',
  ERR_CARD_NOT_IN_HAND: 'ERR_CARD_NOT_IN_HAND',
  ERR_INVALID_TARGET: 'ERR_INVALID_TARGET',
  
  // Validation errors
  ERR_INVALID_PAYLOAD: 'ERR_INVALID_PAYLOAD',
  ERR_MISSING_FIELD: 'ERR_MISSING_FIELD',
  
  // System errors
  ERR_INTERNAL: 'ERR_INTERNAL',
  ERR_MAINTENANCE: 'ERR_MAINTENANCE',
} as const;
```

### 6.2 Error Handler

```typescript
// filters/ws-exception.filter.ts

@Catch()
export class WsExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('WsException');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToWs();
    const client = ctx.getClient<AuthenticatedSocket>();
    
    let errorResponse: ErrorPayload;
    
    if (exception instanceof WsException) {
      const error = exception.getError();
      errorResponse = typeof error === 'string'
        ? { code: error, timestamp: new Date().toISOString() }
        : { ...error, timestamp: new Date().toISOString() };
    } else if (exception instanceof ValidationError) {
      errorResponse = {
        code: 'ERR_INVALID_PAYLOAD',
        timestamp: new Date().toISOString(),
        details: { validation: exception.message },
      };
    } else if (exception instanceof Error) {
      // Unknown error - log but don't expose details
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );
      errorResponse = {
        code: 'ERR_INTERNAL',
        timestamp: new Date().toISOString(),
      };
    } else {
      errorResponse = {
        code: 'ERR_INTERNAL',
        timestamp: new Date().toISOString(),
      };
    }
    
    client.emit('error', errorResponse);
  }
}
```

### 6.3 Throwing Errors in Handlers

```typescript
// game.gateway.ts

@SubscribeMessage('game:play')
async handlePlayCard(
  @ConnectedSocket() client: AuthenticatedSocket,
  @MessageBody() payload: PlayCardDto,
) {
  const userId = client.user.uid;
  const room = this.roomManager.findUserRoom(userId);
  
  // Validation with proper errors
  if (!room) {
    throw new WsException('ERR_NOT_IN_ROOM');
  }
  
  if (room.phase !== GamePhase.PLAYER_TURN) {
    throw new WsException('ERR_GAME_NOT_STARTED');
  }
  
  if (room.currentPlayerId !== userId) {
    throw new WsException('ERR_NOT_YOUR_TURN');
  }
  
  // Process move
  const result = await this.gameEngine.playCard(room.id, userId, payload);
  
  if (!result.success) {
    throw new WsException({
      code: result.errorCode,
      details: result.details,
    });
  }
  
  // Broadcast result to room
  this.server.to(`room:${room.id}`).emit('game:played', result.data);
}
```

---

## 7. Clock Synchronization & Latency Compensation

> ⚠️ **CRITICAL: Turn Timer Fairness**
>
> Mobile networks have variable latency (50ms - 500ms+). Without clock synchronization,
> players with high latency may lose their turn unfairly.

### 7.1 The Problem

```
┌─────────────────────────────────────────────────────────────────┐
│                 LATENCY PROBLEM EXAMPLE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Server Time: 12:00:00.000                                     │
│   Server says: "Your turn! 30 seconds starting NOW"             │
│                                                                  │
│   Network latency: 200ms                                        │
│                                                                  │
│   Client receives message at: 12:00:00.200                      │
│   Client shows: "30 seconds remaining"                          │
│                                                                  │
│   Player plays at: 12:00:29.900 (client time)                   │
│   Server receives at: 12:00:30.100                              │
│                                                                  │
│   Server says: "TIMEOUT! You had 30 seconds!"                   │
│   Player: "But I played with 100ms left!!!" 😤                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Solution: Server Time Offset

During connection, calculate the offset between client and server clocks:

```typescript
// ====== SERVER SIDE ======

// Send server time on every 'connected' event
client.emit('connected', {
  userId,
  serverTime: Date.now(),  // Server's current timestamp
});

// Include server time in turn events
client.emit('game:turn', {
  currentPlayerId: playerId,
  turnStartTime: Date.now(),  // When turn started (server time)
  turnDuration: 30000,        // 30 seconds
});

// ====== CLIENT SIDE ======

interface ClockSync {
  offset: number;           // serverTime - clientTime
  latency: number;          // Round-trip time / 2
  lastSyncTime: Date;
}

class ClockSyncService {
  private clockSync: ClockSync = { offset: 0, latency: 0, lastSyncTime: new Date() };
  
  // Called when receiving 'connected' event
  onServerTimeReceived(serverTimestamp: number): void {
    const clientNow = Date.now();
    
    // Simple offset calculation (can be improved with NTP-like algorithm)
    this.clockSync.offset = serverTimestamp - clientNow;
    this.clockSync.lastSyncTime = new Date();
  }
  
  // Periodic ping for latency measurement
  async measureLatency(): Promise<number> {
    const pingStart = Date.now();
    
    // Server has a 'ping' event that immediately responds with 'pong'
    await this.socket.emitWithAck('ping', { clientTime: pingStart });
    
    const roundTrip = Date.now() - pingStart;
    this.clockSync.latency = roundTrip / 2;
    
    return this.clockSync.latency;
  }
  
  // Convert server timestamp to client display time
  getClientTime(serverTimestamp: number): number {
    return serverTimestamp - this.clockSync.offset;
  }
  
  // Get server time from client time
  getServerTime(clientTimestamp: number): number {
    return clientTimestamp + this.clockSync.offset;
  }
  
  // Calculate remaining turn time adjusted for latency
  getRemainingTurnTime(turnStartTime: number, turnDuration: number): number {
    const serverNow = this.getServerTime(Date.now());
    const elapsed = serverNow - turnStartTime;
    const remaining = turnDuration - elapsed;
    
    // Add latency buffer - give player benefit of the doubt
    return remaining + this.clockSync.latency;
  }
}
```

### 7.3 Turn Timer with Latency Compensation

```typescript
// ====== CLIENT SIDE UI ======

class TurnTimerDisplay {
  private clockSync: ClockSyncService;
  private turnInfo: { startTime: number; duration: number } | null = null;
  
  onTurnStarted(data: { turnStartTime: number; turnDuration: number }): void {
    this.turnInfo = {
      startTime: data.turnStartTime,
      duration: data.turnDuration,
    };
    
    this.startTimerDisplay();
  }
  
  private startTimerDisplay(): void {
    const updateTimer = () => {
      if (!this.turnInfo) return;
      
      const remaining = this.clockSync.getRemainingTurnTime(
        this.turnInfo.startTime,
        this.turnInfo.duration,
      );
      
      // Display to player
      this.displayRemainingTime(Math.max(0, remaining));
      
      if (remaining > 0) {
        requestAnimationFrame(updateTimer);
      }
    };
    
    updateTimer();
  }
}
```

### 7.4 Server-Side Latency Tolerance

```typescript
// ====== SERVER SIDE ======

const LATENCY_TOLERANCE_MS = 500;  // 500ms grace period

class TurnValidationService {
  validateMoveTime(
    turnStartTime: number,
    turnDuration: number,
    moveReceivedTime: number,
  ): boolean {
    const deadline = turnStartTime + turnDuration + LATENCY_TOLERANCE_MS;
    return moveReceivedTime <= deadline;
  }
}

// In game gateway:
@SubscribeMessage('game:play')
async handlePlay(client: AuthenticatedSocket, data: PlayCardPayload) {
  const receiveTime = Date.now();
  const room = this.roomManager.findUserRoom(client.user.uid);
  
  // Validate move is within time (with tolerance)
  const isInTime = this.turnValidation.validateMoveTime(
    room.turnStartTime,
    room.turnDuration,
    receiveTime,
  );
  
  if (!isInTime) {
    throw new WsException('Turn time expired');
  }
  
  // Process the move...
}
```

### 7.5 Periodic Clock Sync

Keep clocks synchronized throughout the game:

```typescript
// Client pings server every 30 seconds to maintain sync
setInterval(async () => {
  await this.clockSync.measureLatency();
}, 30000);

// Server includes serverTime in periodic heartbeats
setInterval(() => {
  this.server.emit('heartbeat', {
    serverTime: Date.now(),
    activePlayers: this.connectionTracker.count(),
  });
}, 10000);
```

### 7.6 Debugging Latency Issues

```typescript
// Server logs for debugging timing issues
function logTimingDebug(event: string, data: Record<string, number>): void {
  console.log(JSON.stringify({
    event,
    serverTime: Date.now(),
    ...data,
  }));
}

// Usage:
logTimingDebug('TURN_START', { 
  playerId, 
  turnStartTime, 
  turnDuration: 30000 
});

logTimingDebug('MOVE_RECEIVED', { 
  playerId, 
  moveReceivedTime: Date.now(), 
  expectedDeadline: turnStartTime + 30000,
  withinTime: (Date.now() - turnStartTime) <= 30000,
});
```

---

## 8. Reconnection Strategy

### 8.1 Client-Side Reconnection

```typescript
// Client-side (for documentation purposes)

const socket = io('wss://api.bluffbuddy.com/game', {
  auth: { token: firebaseIdToken },
  
  // Reconnection settings
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,      // Start with 1s
  reconnectionDelayMax: 30000,  // Max 30s between attempts
  randomizationFactor: 0.5,     // Add randomness to prevent thundering herd
  
  // Timeout settings
  timeout: 20000,
});

socket.on('connect', () => {
  console.log('Connected');
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  
  if (reason === 'io server disconnect') {
    // Server intentionally disconnected, don't auto-reconnect
    // Show error to user
  }
  // Otherwise, Socket.io will auto-reconnect
});

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log('Reconnect attempt:', attemptNumber);
  // Maybe refresh auth token before reconnecting
});

socket.on('reconnect_failed', () => {
  console.log('Reconnection failed');
  // Show error, prompt manual retry
});
```

### 7.2 Server-Side Reconnection Window

```typescript
// services/reconnection.service.ts

@Injectable()
export class ReconnectionService {
  private disconnectedPlayers = new Map<string, DisconnectionInfo>();
  
  // Reconnection window for in-game players
  private readonly GAME_RECONNECT_WINDOW = 60000; // 60 seconds
  
  handleDisconnect(userId: string, roomId: string) {
    // Only if player was in an active game
    this.disconnectedPlayers.set(userId, {
      roomId,
      disconnectedAt: Date.now(),
      timeoutId: setTimeout(() => {
        this.handleReconnectTimeout(userId, roomId);
      }, this.GAME_RECONNECT_WINDOW),
    });
  }
  
  handleReconnect(userId: string): ReconnectionResult | null {
    const info = this.disconnectedPlayers.get(userId);
    
    if (!info) {
      return null; // No pending reconnection
    }
    
    // Cancel timeout
    clearTimeout(info.timeoutId);
    this.disconnectedPlayers.delete(userId);
    
    // Check if game is still valid
    const room = this.roomManager.getRoom(info.roomId);
    if (!room || room.phase === GamePhase.GAME_OVER) {
      return { status: 'game_ended' };
    }
    
    return {
      status: 'success',
      roomId: info.roomId,
      missedEvents: this.getMissedEvents(info.roomId, info.disconnectedAt),
    };
  }
  
  private handleReconnectTimeout(userId: string, roomId: string) {
    this.disconnectedPlayers.delete(userId);
    
    // Force player to forfeit/auto-pass
    this.gameEngine.handlePlayerAbandoned(roomId, userId);
  }
  
  private getMissedEvents(roomId: string, since: number): GameEvent[] {
    // Return events that occurred while disconnected
    return this.eventLog.getEventsSince(roomId, since);
  }
}
```

---

## 8. Payload Optimization

### 8.1 Minimize Payload Size

```typescript
// ❌ VERBOSE (Don't do this)
{
  "gameState": {
    "currentPhase": "PLAYER_TURN",
    "currentRoundNumber": 2,
    "currentPlayerIdentifier": "abc123",
    "remainingTimeInSeconds": 25,
    "playerHandCards": [
      { "cardIdentifier": "Q-hearts", "cardRank": "Q", "cardSuit": "hearts" }
    ]
  }
}

// ✅ OPTIMIZED (Do this)
{
  "s": {                    // state
    "p": "TURN",            // phase (abbreviated)
    "r": 2,                 // round
    "c": "abc123",          // current player
    "t": 25,                // time
    "h": ["Qh"]             // hand (compact notation)
  }
}
```

### 8.2 Delta Updates

Instead of sending full state every time, send only changes:

```typescript
// Full state on join
socket.emit('game:state', fullGameState);

// Delta updates during game
socket.emit('game:delta', {
  type: 'CARD_PLAYED',
  player: 'abc',
  card: 'Qh',
  poolTop: 'Qh',
  hands: { 'abc': 3 },  // Only changed hand counts
});

socket.emit('game:delta', {
  type: 'TURN_CHANGE',
  current: 'def',
  time: 30,
});
```

### 8.3 Binary Protocol (Advanced)

For maximum efficiency, consider binary serialization:

```typescript
// Using MessagePack for binary serialization
import * as msgpack from 'msgpack-lite';

// Server sends binary
const packed = msgpack.encode(gameState);
socket.emit('game:state:bin', packed);

// Client decodes
socket.on('game:state:bin', (data) => {
  const state = msgpack.decode(data);
});
```

### 8.4 Compression

Socket.io has built-in per-message deflate. Additionally:

```typescript
// For large payloads (like replay data)
import * as zlib from 'zlib';

// Compress replay before sending
const replayJson = JSON.stringify(replayData);
const compressed = zlib.gzipSync(Buffer.from(replayJson));
const base64 = compressed.toString('base64');

socket.emit('game:replay', { data: base64, encoding: 'gzip' });
```

---

## Quick Reference

### Event Cheat Sheet

**Client → Server:**
```
room:create    room:join    room:leave    room:ready
game:play      game:target
match:queue    match:cancel
```

**Server → Client:**
```
connected      error        kicked
room:created   room:joined  room:player:*
game:start     game:state   game:turn    game:played
game:match     game:seal    game:end
match:searching  match:found  match:cancelled
```

### Socket Rooms

```
user:{userId}     → Personal notifications
room:{roomId}     → Game room participants
party:{partyId}   → Party members
```

---

## References

- [Socket.io Documentation](https://socket.io/docs/v4/)
- [NestJS WebSockets](https://docs.nestjs.com/websockets/gateways)
- [WebSocket Security Best Practices](https://owasp.org/www-project-web-security-testing-guide/)

---

*Document Version: 1.0 | Last Updated: February 2026*
