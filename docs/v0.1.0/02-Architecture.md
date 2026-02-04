# 02 - Software Architecture

> **Owner:** Developer 3 (Data & Social) + All Developers  
> **Last Updated:** February 2026  
> **Status:** Specification

---

## Table of Contents

1. [Overview](#1-overview)
2. [SOLID Principles Application](#2-solid-principles-application)
3. [Module Structure](#3-module-structure)
4. [Dependency Injection](#4-dependency-injection)
5. [Gateway & Middleware](#5-gateway--middleware)
6. [DTO & Validation](#6-dto--validation)
7. [Error Handling](#7-error-handling)
8. [Module Specifications](#8-module-specifications)

---

## 1. Overview

BluffBuddy Online backend follows a **Modular Monolith** architecture using NestJS. This approach provides:

- Clear domain boundaries without microservice complexity
- Shared transaction scope (important for game consistency)
- Simple deployment (single container)
- Easy refactoring to microservices in the future

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  [Mobile App - Unity/Flutter]    [Web Client - Future]                      │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                    WebSocket (Socket.io) / HTTP REST
                                      │
┌─────────────────────────────────────▼───────────────────────────────────────┐
│                              GATEWAY LAYER                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │  GameGateway    │  │  SocialGateway  │  │  REST Controllers           │  │
│  │  (Socket.io)    │  │  (Socket.io)    │  │  (Auth, IAP, Health)        │  │
│  └────────┬────────┘  └────────┬────────┘  └──────────────┬──────────────┘  │
└───────────┼────────────────────┼─────────────────────────┼──────────────────┘
            │                    │                         │
┌───────────▼────────────────────▼─────────────────────────▼──────────────────┐
│                              SERVICE LAYER                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         GameModule                                   │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │    │
│  │  │ GameEngine  │  │ RoomManager │  │ Matchmaking │                  │    │
│  │  │ Service     │  │ Service     │  │ Service     │                  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │    │
│  │  │ SealService │  │ Matching    │  │ Scoring     │                  │    │
│  │  │             │  │ Service     │  │ Service     │                  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  AuthModule  │  │ SocialModule │  │  IapModule   │  │ CommonModule │     │
│  │  • Firebase  │  │  • Friends   │  │  • Apple     │  │  • Logger    │     │
│  │  • JWT       │  │  • Party     │  │  • Google    │  │  • Config    │     │
│  │  • Guards    │  │  • Presence  │  │  • Verify    │  │  • Filters   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────┬───────────────────────────────────┘
                                          │
┌─────────────────────────────────────────▼───────────────────────────────────┐
│                           PERSISTENCE LAYER                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      PersistenceModule                               │    │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐     │    │
│  │  │ UserRepository │  │ MatchRepository│  │ LeaderboardRepository│   │    │
│  │  └────────────────┘  └────────────────┘  └────────────────────┘     │    │
│  │                              │                                       │    │
│  │                    ┌─────────▼─────────┐                            │    │
│  │                    │ FirestoreService  │                            │    │
│  │                    └─────────┬─────────┘                            │    │
│  └──────────────────────────────┼──────────────────────────────────────┘    │
└─────────────────────────────────┼───────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │   Firebase Firestore    │
                    │   (External Service)    │
                    └─────────────────────────┘
```

---

## 2. SOLID Principles Application

### 2.1 Single Responsibility Principle (SRP)

Each service/class has ONE reason to change:

```typescript
// ❌ BAD: Multiple responsibilities
class GameService {
  validateToken() { }      // Auth concern
  playCard() { }           // Game logic
  saveToDatabase() { }     // Persistence
  sendNotification() { }   // Messaging
}

// ✅ GOOD: Single responsibility per service
class AuthService {
  validateToken() { }
}

class GameEngineService {
  playCard() { }
}

class MatchRepository {
  save() { }
}

class NotificationService {
  send() { }
}
```

### 2.2 Open/Closed Principle (OCP)

Open for extension, closed for modification:

```typescript
// Base scoring strategy
interface IScoringStrategy {
  calculateScore(cards: Card[]): number;
}

// Standard scoring
class StandardScoring implements IScoringStrategy {
  calculateScore(cards: Card[]): number {
    return cards.reduce((sum, card) => sum + card.penaltyValue, 0);
  }
}

// Future: Double penalty mode (extension, not modification)
class DoublePenaltyScoring implements IScoringStrategy {
  calculateScore(cards: Card[]): number {
    return cards.reduce((sum, card) => sum + card.penaltyValue * 2, 0);
  }
}
```

### 2.3 Liskov Substitution Principle (LSP)

Subtypes must be substitutable for their base types:

```typescript
// Base repository interface
interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<void>;
  delete(id: string): Promise<void>;
}

// Firestore implementation
class FirestoreUserRepository implements IRepository<User> {
  async findById(id: string): Promise<User | null> { /* ... */ }
  async save(user: User): Promise<void> { /* ... */ }
  async delete(id: string): Promise<void> { /* ... */ }
}

// In-memory implementation (for testing)
class InMemoryUserRepository implements IRepository<User> {
  private store = new Map<string, User>();
  
  async findById(id: string): Promise<User | null> {
    return this.store.get(id) || null;
  }
  async save(user: User): Promise<void> {
    this.store.set(user.id, user);
  }
  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}

// Both can be used interchangeably
```

### 2.4 Interface Segregation Principle (ISP)

Clients should not depend on interfaces they don't use:

```typescript
// ❌ BAD: Fat interface
interface IGameService {
  createRoom(): void;
  joinRoom(): void;
  playCard(): void;
  chat(): void;           // Not all clients need chat
  spectate(): void;       // Not all clients need spectate
  reportPlayer(): void;   // Not all clients need reporting
}

// ✅ GOOD: Segregated interfaces
interface IGameCore {
  createRoom(): void;
  joinRoom(): void;
  playCard(): void;
}

interface IGameChat {
  sendMessage(): void;
  getHistory(): void;
}

interface IGameModeration {
  reportPlayer(): void;
  mutePlayer(): void;
}
```

### 2.5 Dependency Inversion Principle (DIP)

High-level modules should not depend on low-level modules. Both should depend on abstractions:

```typescript
// ❌ BAD: Direct dependency on Firestore
@Injectable()
class GameEngineService {
  constructor(private firestore: Firestore) { } // Concrete dependency
  
  async endGame(gameId: string) {
    await this.firestore.collection('matches').doc(gameId).set(data);
  }
}

// ✅ GOOD: Depend on abstraction
@Injectable()
class GameEngineService {
  constructor(
    @Inject('IMatchRepository')
    private matchRepository: IMatchRepository  // Abstract dependency
  ) { }
  
  async endGame(gameId: string) {
    await this.matchRepository.save(match);
  }
}

// Module configuration
@Module({
  providers: [
    GameEngineService,
    {
      provide: 'IMatchRepository',
      useClass: FirestoreMatchRepository,  // Can swap implementations
    },
  ],
})
export class GameModule {}
```

---

## 3. Module Structure

### 3.1 Module Overview

```
src/
├── main.ts                          # Application bootstrap
├── app.module.ts                    # Root module
│
├── auth/                            # AuthModule
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── auth.guard.ts
│   ├── ws-auth.middleware.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   └── dto/
│       ├── login.dto.ts
│       └── register.dto.ts
│
├── game/                            # GameModule (Core)
│   ├── game.module.ts
│   ├── gateways/
│   │   └── game.gateway.ts
│   ├── services/
│   │   ├── game-engine.service.ts
│   │   ├── room-manager.service.ts
│   │   └── matchmaking.service.ts
│   ├── mechanics/
│   │   ├── seal.service.ts
│   │   ├── matching.service.ts
│   │   └── scoring.service.ts
│   ├── state/
│   │   ├── game-state.interface.ts
│   │   └── state-machine.ts
│   └── dto/
│       ├── play-card.dto.ts
│       ├── join-room.dto.ts
│       └── game-state.dto.ts
│
├── persistence/                     # PersistenceModule
│   ├── persistence.module.ts
│   ├── firestore.service.ts
│   ├── interfaces/
│   │   ├── user-repository.interface.ts
│   │   ├── match-repository.interface.ts
│   │   └── leaderboard-repository.interface.ts
│   └── repositories/
│       ├── user.repository.ts
│       ├── match.repository.ts
│       └── leaderboard.repository.ts
│
├── social/                          # SocialModule
│   ├── social.module.ts
│   ├── gateways/
│   │   └── social.gateway.ts
│   ├── services/
│   │   ├── friends.service.ts
│   │   ├── party.service.ts
│   │   └── presence.service.ts
│   └── dto/
│       ├── add-friend.dto.ts
│       └── create-party.dto.ts
│
├── iap/                             # IapModule
│   ├── iap.module.ts
│   ├── iap.controller.ts
│   ├── iap.service.ts
│   ├── verifiers/
│   │   ├── apple-verifier.service.ts
│   │   └── google-verifier.service.ts
│   └── dto/
│       └── verify-purchase.dto.ts
│
└── common/                          # CommonModule (Shared)
    ├── common.module.ts
    ├── config/
    │   └── configuration.ts
    ├── filters/
    │   ├── ws-exception.filter.ts
    │   └── http-exception.filter.ts
    ├── interceptors/
    │   └── logging.interceptor.ts
    ├── pipes/
    │   └── validation.pipe.ts
    ├── decorators/
    │   └── current-user.decorator.ts
    └── constants/
        ├── error-codes.ts
        └── game-constants.ts
```

### 3.2 Module Dependencies

```
                    ┌─────────────┐
                    │  AppModule  │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ CommonModule│   │  AuthModule │   │ Persistence │
│  (Global)   │   │             │   │   Module    │
└──────┬──────┘   └──────┬──────┘   └──────┬──────┘
       │                 │                 │
       │    ┌────────────┼─────────────────┤
       │    │            │                 │
       ▼    ▼            ▼                 ▼
┌─────────────────────────────────────────────────┐
│                   GameModule                     │
│  (imports: CommonModule, AuthModule,            │
│   PersistenceModule)                            │
└─────────────────────────────────────────────────┘
       │
       ├───────────────────┐
       ▼                   ▼
┌─────────────┐   ┌─────────────┐
│ SocialModule│   │  IapModule  │
└─────────────┘   └─────────────┘
```

---

## 4. Dependency Injection

### 4.1 Provider Registration

```typescript
// game.module.ts
@Module({
  imports: [
    CommonModule,
    AuthModule,
    PersistenceModule,
  ],
  providers: [
    // Services
    GameEngineService,
    RoomManagerService,
    MatchmakingService,
    
    // Mechanics (sub-services)
    SealService,
    MatchingService,
    ScoringService,
    
    // Custom providers with interfaces
    {
      provide: 'ICardShuffler',
      useClass: CryptoCardShuffler,
    },
  ],
  exports: [
    GameEngineService,
    RoomManagerService,
  ],
})
export class GameModule {}
```

### 4.2 Injection Tokens

```typescript
// constants/injection-tokens.ts
export const INJECTION_TOKENS = {
  USER_REPOSITORY: 'IUserRepository',
  MATCH_REPOSITORY: 'IMatchRepository',
  LEADERBOARD_REPOSITORY: 'ILeaderboardRepository',
  CARD_SHUFFLER: 'ICardShuffler',
  SCORING_STRATEGY: 'IScoringStrategy',
} as const;
```

### 4.3 Factory Providers

```typescript
// Dynamic configuration based on environment
{
  provide: 'DATABASE_CONNECTION',
  useFactory: async (configService: ConfigService) => {
    const isProduction = configService.get('NODE_ENV') === 'production';
    
    if (isProduction) {
      return new FirestoreConnection(configService.get('FIRESTORE_CONFIG'));
    } else {
      return new InMemoryDatabase(); // For local development
    }
  },
  inject: [ConfigService],
}
```

---

## 5. Gateway & Middleware

### 5.1 WebSocket Authentication Middleware

Critical: Authentication MUST happen during handshake, not after connection.

```typescript
// ws-auth.middleware.ts
import { Socket } from 'socket.io';
import * as admin from 'firebase-admin';

export type AuthenticatedSocket = Socket & {
  user: {
    uid: string;
    email?: string;
  };
};

export const wsAuthMiddleware = async (
  socket: Socket,
  next: (err?: Error) => void,
) => {
  try {
    const token = socket.handshake.auth?.token;
    
    if (!token) {
      return next(new Error('ERR_NO_TOKEN'));
    }

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Attach user info to socket
    (socket as AuthenticatedSocket).user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };

    next();
  } catch (error) {
    // Token invalid or expired
    next(new Error('ERR_UNAUTHORIZED'));
  }
};
```

### 5.2 Gateway Setup

```typescript
// game.gateway.ts
@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
  },
  namespace: '/game',
})
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GameGateway.name);

  constructor(
    private readonly gameEngine: GameEngineService,
    private readonly roomManager: RoomManagerService,
  ) {}

  afterInit(server: Server) {
    // Apply authentication middleware
    server.use(wsAuthMiddleware);
    this.logger.log('Game Gateway initialized');
  }

  handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`Client connected: ${client.user.uid}`);
    // Register user presence
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.user.uid}`);
    // Handle disconnection (auto-pass, reconnect window, etc.)
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: JoinRoomDto,
  ) {
    // Validate and process
  }

  @SubscribeMessage('playCard')
  async handlePlayCard(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: PlayCardDto,
  ) {
    // Validate and process
  }
}
```

### 5.3 Connection Flow

```
┌──────────┐                    ┌──────────────┐
│  Client  │                    │    Server    │
└────┬─────┘                    └──────┬───────┘
     │                                 │
     │  1. Connect with token          │
     │ ──────────────────────────────► │
     │  { auth: { token: 'xxx' } }     │
     │                                 │
     │         2. Middleware           │
     │         verifies token          │
     │                                 │
     │  3a. Success: Connection        │
     │ ◄────────────────────────────── │
     │                                 │
     │  3b. Failure: Disconnect        │
     │ ◄────── Error('UNAUTHORIZED')   │
     │                                 │
     │  4. Subscribe to events         │
     │ ──────────────────────────────► │
     │                                 │
```

---

## 6. DTO & Validation

### 6.1 Validation Pipe Configuration

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Strip non-whitelisted properties
      forbidNonWhitelisted: true, // Throw error on extra properties
      transform: true,           // Auto-transform to DTO types
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.listen(3000);
}
```

### 6.2 DTO Examples

```typescript
// play-card.dto.ts
import {
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
  Matches,
} from 'class-validator';

export enum CardSuit {
  HEARTS = 'hearts',
  DIAMONDS = 'diamonds',
  CLUBS = 'clubs',
  SPADES = 'spades',
}

export class PlayCardDto {
  @IsString()
  @IsUUID('4')
  roomId: string;

  @IsString()
  @Matches(/^(?:[2-9]|10|[JQKA])$/, {
    message: 'Invalid card rank. Must be 2-10, J, Q, K, or A',
  })
  rank: string;

  @IsEnum(CardSuit, {
    message: 'Invalid suit. Must be hearts, diamonds, clubs, or spades',
  })
  suit: CardSuit;

  @IsOptional()
  @IsUUID('4')
  targetPlayerId?: string;  // Required only for "dump" moves
}
```

```typescript
// join-room.dto.ts
import { IsString, IsUUID, IsOptional, IsEnum } from 'class-validator';

export enum JoinType {
  QUICK_MATCH = 'quick_match',
  PRIVATE_ROOM = 'private_room',
  PARTY = 'party',
}

export class JoinRoomDto {
  @IsEnum(JoinType)
  type: JoinType;

  @IsOptional()
  @IsString()
  @IsUUID('4')
  roomCode?: string;  // For private rooms

  @IsOptional()
  @IsString()
  @IsUUID('4')
  partyId?: string;   // For party-based matchmaking
}
```

### 6.3 Response DTOs (Masked State)

```typescript
// game-state.dto.ts
export class PlayerStateDto {
  id: string;
  nickname: string;
  cardCount: number;           // NOT the actual cards!
  penaltySlot: CardStackDto;   // Only top visible cards
  isCurrentTurn: boolean;
  isConnected: boolean;
}

export class CardStackDto {
  topCards: CardDto[];         // Visible cards only
  hiddenCount: number;         // Number of buried cards
  isSealed: boolean;           // UI hint (optional based on game rules)
}

export class GameStateDto {
  roomId: string;
  phase: GamePhase;
  currentPlayerId: string;
  turnTimer: number;           // Seconds remaining
  
  // Player's own hand (full information)
  myHand: CardDto[];
  
  // Other players (masked information)
  players: PlayerStateDto[];
  
  // Board state
  openCenter: (CardDto | null)[];  // 4 slots, null if taken
  poolTopCard: CardDto | null;
  
  // Game progress
  round: number;
  cardsRemaining: number;
}
```

---

## 7. Error Handling

### 7.1 Error Codes

```typescript
// constants/error-codes.ts
export const ERROR_CODES = {
  // Authentication
  ERR_NO_TOKEN: 'ERR_NO_TOKEN',
  ERR_INVALID_TOKEN: 'ERR_INVALID_TOKEN',
  ERR_UNAUTHORIZED: 'ERR_UNAUTHORIZED',
  
  // Game Logic
  ERR_NOT_YOUR_TURN: 'ERR_NOT_YOUR_TURN',
  ERR_INVALID_CARD: 'ERR_INVALID_CARD',
  ERR_CARD_NOT_IN_HAND: 'ERR_CARD_NOT_IN_HAND',
  ERR_NO_MATCH_AVAILABLE: 'ERR_NO_MATCH_AVAILABLE',
  ERR_SLOT_SEALED: 'ERR_SLOT_SEALED',
  ERR_INVALID_TARGET: 'ERR_INVALID_TARGET',
  
  // Room
  ERR_ROOM_NOT_FOUND: 'ERR_ROOM_NOT_FOUND',
  ERR_ROOM_FULL: 'ERR_ROOM_FULL',
  ERR_GAME_IN_PROGRESS: 'ERR_GAME_IN_PROGRESS',
  ERR_NOT_IN_ROOM: 'ERR_NOT_IN_ROOM',
  
  // Social
  ERR_ALREADY_FRIENDS: 'ERR_ALREADY_FRIENDS',
  ERR_FRIEND_REQUEST_PENDING: 'ERR_FRIEND_REQUEST_PENDING',
  ERR_USER_NOT_FOUND: 'ERR_USER_NOT_FOUND',
  
  // IAP
  ERR_INVALID_RECEIPT: 'ERR_INVALID_RECEIPT',
  ERR_RECEIPT_ALREADY_USED: 'ERR_RECEIPT_ALREADY_USED',
  ERR_STORE_UNAVAILABLE: 'ERR_STORE_UNAVAILABLE',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
```

### 7.2 WebSocket Exception Filter

```typescript
// filters/ws-exception.filter.ts
@Catch()
export class WsExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();
    
    let errorCode: string;
    let message: string;

    if (exception instanceof WsException) {
      errorCode = exception.getError() as string;
      message = exception.message;
    } else if (exception instanceof Error) {
      errorCode = 'ERR_INTERNAL';
      message = 'Internal server error';
      this.logger.error(exception.message, exception.stack);
    } else {
      errorCode = 'ERR_UNKNOWN';
      message = 'Unknown error occurred';
    }

    client.emit('error', {
      code: errorCode,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
```

### 7.3 Error Response Format

```typescript
// All errors follow this format
interface ErrorResponse {
  code: ErrorCode;           // Machine-readable code
  message?: string;          // Optional debug message (dev only)
  timestamp: string;         // ISO 8601 timestamp
  details?: Record<string, any>;  // Additional context
}

// Example error emission
client.emit('error', {
  code: 'ERR_SLOT_SEALED',
  timestamp: new Date().toISOString(),
  details: {
    slotOwner: 'player_123',
    attemptedRank: 'Q',
  },
});
```

---

## 8. Module Specifications

### 8.1 AuthModule

**Responsibility:** User authentication and authorization

**Exports:**
- `AuthService` - Token validation, user session management
- `JwtAuthGuard` - HTTP route protection
- `WsAuthMiddleware` - WebSocket authentication

**Dependencies:**
- `firebase-admin` - Firebase Auth verification
- `@nestjs/jwt` - JWT generation (optional, if using custom tokens)
- `CommonModule` - Configuration

### 8.2 GameModule

**Responsibility:** Core game logic and real-time gameplay

**Exports:**
- `GameGateway` - WebSocket event handling
- `GameEngineService` - Game state manipulation
- `RoomManagerService` - Room lifecycle management

**Dependencies:**
- `AuthModule` - Authentication
- `PersistenceModule` - Match history, ELO updates
- `CommonModule` - Configuration, logging

### 8.3 PersistenceModule

**Responsibility:** Data access abstraction

**Exports:**
- `FirestoreService` - Low-level Firestore operations
- `UserRepository` - User CRUD
- `MatchRepository` - Match history
- `LeaderboardRepository` - Rankings

**Dependencies:**
- `firebase-admin` - Firestore SDK
- `CommonModule` - Configuration

### 8.4 SocialModule

**Responsibility:** Social features and player interactions

**Exports:**
- `SocialGateway` - Real-time social events
- `FriendsService` - Friend management
- `PartyService` - Party/group management
- `PresenceService` - Online status

**Dependencies:**
- `AuthModule` - User identification
- `PersistenceModule` - Friend data storage
- `GameModule` - Party-based matchmaking

### 8.5 IapModule

**Responsibility:** In-app purchase verification and economy

**Exports:**
- `IapService` - Purchase processing
- `AppleVerifierService` - App Store verification
- `GoogleVerifierService` - Play Store verification

**Dependencies:**
- `AuthModule` - User identification
- `PersistenceModule` - Wallet updates
- `CommonModule` - Configuration (API keys)

---

## References

- [NestJS Documentation](https://docs.nestjs.com)
- [NestJS WebSockets](https://docs.nestjs.com/websockets/gateways)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [class-validator](https://github.com/typestack/class-validator)

---

*Document Version: 1.0 | Last Updated: February 2026*
