# BluffBuddy Backend - Architecture Summary

> **Version**: v0.2.0  
> **Last Updated**: Session completion  
> **Status**: Scaffolding Complete - Ready for Business Logic

---

## 📋 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env
# Edit .env with your Firebase credentials

# 3. Start development stack (Redis + NestJS with hot-reload)
docker-compose up -d

# 4. View API documentation
open http://localhost:3000/docs
```

---

## 🏗️ Architecture Overview

### Modular Monolith Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Layer                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │   Auth   │ │   Game   │ │  Social  │ │  Economy │           │
│  │Controller│ │Controller│ │Controller│ │Controller│           │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘           │
├───────┼────────────┼────────────┼────────────┼──────────────────┤
│       │            │            │            │                   │
│  ┌────┴─────┐ ┌────┴─────┐ ┌────┴─────┐ ┌────┴─────┐           │
│  │   Auth   │ │   Game   │ │  Social  │ │  Rating  │           │
│  │  Module  │ │  Module  │ │  Module  │ │  Module  │           │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘           │
│       │            │            │            │                   │
│       └────────────┴─────┬──────┴────────────┘                  │
│                          │                                       │
│              ┌───────────┴───────────┐                          │
│              │    DI_TOKENS Layer    │ ← Interface Contracts    │
│              └───────────┬───────────┘                          │
│                          │                                       │
│  ┌───────────────────────┼───────────────────────┐              │
│  │       Infrastructure  │     Database          │              │
│  │        (Redis)        │    (Firestore)        │              │
│  └───────────────────────┴───────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### Module Boundaries (Enforced by ESLint)

| Module | Owner | Dependencies |
|--------|-------|--------------|
| `auth` | DEV3 | Database, Infrastructure |
| `game` | DEV2 | Auth, Database, Infrastructure |
| `social` | DEV3 | Auth, Database, Infrastructure |
| `rating` | DEV2+DEV3 | Database, Infrastructure |
| `economy` | DEV3 | Auth, Database |
| `database` | DEV3 | Infrastructure |
| `infrastructure` | DEV1 | (none) |

---

## 🔧 Dependency Injection Pattern

### The "Walls and Wiring" Architecture

**Walls** (Barrel files `index.ts`):
- Export ONLY the Module class
- Guards and Middleware are exceptions (cross-cutting concerns)
- **NEVER** export Service classes

**Wiring** (Module files `*.module.ts`):
- Use `DI_TOKENS` for all provider registration
- Export only tokens, never concrete classes
- Example:
```typescript
@Module({
  providers: [
    { provide: DI_TOKENS.GAME_ENGINE, useClass: GameService },
  ],
  exports: [DI_TOKENS.GAME_ENGINE],
})
```

### DI Token Reference

```typescript
// Game Module
DI_TOKENS.GAME_ENGINE        // IGameEngine
DI_TOKENS.ROOM_SERVICE       // IRoomService
DI_TOKENS.MATCHMAKING_SERVICE // IMatchmakingService
DI_TOKENS.STATE_SERVICE      // IStateService

// Auth Module
DI_TOKENS.AUTH_SERVICE       // IAuthService
DI_TOKENS.USER_SERVICE       // IUserService
DI_TOKENS.SESSION_SERVICE    // ISessionService

// Social Module
DI_TOKENS.FRIEND_SERVICE     // IFriendService
DI_TOKENS.PARTY_SERVICE      // IPartyService
DI_TOKENS.CHAT_SERVICE       // IChatService
DI_TOKENS.PRESENCE_SERVICE   // IPresenceService

// Economy Module
DI_TOKENS.WALLET_SERVICE     // IWalletService
DI_TOKENS.TRANSACTION_SERVICE // ITransactionService
DI_TOKENS.PURCHASE_SERVICE   // IPurchaseService
DI_TOKENS.REWARD_SERVICE     // IRewardService

// Rating Module
DI_TOKENS.ELO_SERVICE        // IEloService
DI_TOKENS.BOT_DETECTION_SERVICE // IBotDetectionService
DI_TOKENS.LEADERBOARD_SERVICE // ILeaderboardService

// Infrastructure
DI_TOKENS.REDIS_SERVICE      // IRedisService
DI_TOKENS.PUBSUB_SERVICE     // IPubSubService
DI_TOKENS.FIRESTORE_SERVICE  // IFirestoreService
```

---

## 📚 API Documentation (Swagger)

### Endpoints by Module

#### Auth (`/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/verify` | Verify Firebase token |
| GET | `/auth/profile` | Get user profile |
| POST | `/auth/profile` | Update profile |
| POST | `/auth/logout` | Logout user |

#### Game (`/game`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/game/rooms` | List public rooms |
| POST | `/game/rooms` | Create room |
| GET | `/game/rooms/:id` | Get room details |
| POST | `/game/rooms/:id/join` | Join room |
| POST | `/game/quick-match` | Start matchmaking |
| DELETE | `/game/quick-match` | Cancel matchmaking |
| GET | `/game/replay/:matchId` | Get match replay |

#### Social (`/social`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/social/friends` | Get friends list |
| POST | `/social/friends/request` | Send friend request |
| GET | `/social/friends/requests` | Get pending requests |
| POST | `/social/friends/requests/:id/accept` | Accept request |
| DELETE | `/social/friends/requests/:id` | Reject request |
| DELETE | `/social/friends/:uid` | Remove friend |
| GET | `/social/search` | Search users |
| POST | `/social/block/:uid` | Block user |
| DELETE | `/social/block/:uid` | Unblock user |
| POST | `/social/report` | Report user |

#### Economy (`/economy`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/economy/wallet` | Get balance |
| GET | `/economy/shop` | Get shop items |
| GET | `/economy/transactions` | Transaction history |
| POST | `/economy/claim-free` | Claim free chips |
| POST | `/economy/iap/verify` | Verify IAP |
| POST | `/economy/ads/callback` | Ad reward callback |

#### Leaderboard (`/leaderboard`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/leaderboard/global` | Global rankings |
| GET | `/leaderboard/weekly` | Weekly rankings |
| GET | `/leaderboard/friends` | Friends rankings |
| GET | `/leaderboard/rank/:uid` | Player rank |
| GET | `/leaderboard/history/:uid` | Match history |

---

## 🧪 Development Scripts

```bash
# Development
npm run start:dev          # Hot-reload development
npm run start:debug        # Debug mode

# Quality
npm run lint               # Run ESLint
npm run lint:fix           # Auto-fix issues
npm run verify:arch        # Architecture verification
npm run dev:check          # Pre-commit validation

# Testing
npm run test               # Unit tests
npm run test:e2e           # E2E tests
npm run test:cov           # Coverage report
```

---

## 🐳 Docker Development

```yaml
# docker-compose.yml services:
# - backend: NestJS with hot-reload (port 3000)
# - redis: Redis 7 Alpine (port 6379)
# - caddy: Reverse proxy (optional, port 80/443)
```

```bash
docker-compose up -d       # Start all services
docker-compose logs -f     # View logs
docker-compose down        # Stop all services
```

---

## 📁 File Structure

```
backend/src/
├── main.ts                 # Bootstrap + Swagger setup
├── app.module.ts           # Root module
├── shared/
│   ├── contracts/          # 🔒 THE BIBLE - Shared interfaces
│   │   ├── di-tokens.ts    # DI token definitions
│   │   ├── interfaces/     # Service interfaces
│   │   ├── entities.ts     # Entity definitions
│   │   ├── enums.ts        # Shared enums
│   │   └── events.ts       # Socket event constants
│   └── dtos/               # Shared DTOs
├── auth/
│   ├── index.ts            # 🧱 WALL - Module export only
│   ├── auth.module.ts      # 🔌 WIRING - Token providers
│   ├── controllers/        # HTTP endpoints
│   ├── guards/             # Auth guards (exported)
│   └── services/           # Service implementations
├── game/
│   ├── index.ts            # 🧱 WALL
│   ├── game.module.ts      # 🔌 WIRING
│   ├── controllers/        # HTTP endpoints
│   ├── gateways/           # WebSocket gateways
│   └── services/           # Game logic services
├── social/
│   ├── index.ts            # 🧱 WALL
│   ├── social.module.ts    # 🔌 WIRING
│   ├── controllers/        # HTTP endpoints
│   ├── gateways/           # WebSocket gateways
│   └── services/           # Social services
├── economy/
│   ├── index.ts            # 🧱 WALL
│   ├── economy.module.ts   # 🔌 WIRING
│   ├── controllers/        # HTTP endpoints
│   └── services/           # Economy services
├── rating/
│   ├── index.ts            # 🧱 WALL
│   ├── rating.module.ts    # 🔌 WIRING
│   ├── controllers/        # HTTP endpoints
│   └── services/           # ELO/leaderboard services
├── database/
│   ├── index.ts            # 🧱 WALL
│   ├── database.module.ts  # 🔌 WIRING
│   └── services/           # Repository implementations
└── infrastructure/
    ├── index.ts            # 🧱 WALL
    ├── infrastructure.module.ts # 🔌 WIRING
    └── services/           # Redis, config services
```

---

## ✅ Implementation Checklist

### Completed (Scaffolding)
- [x] DI Token system with interfaces
- [x] Module registration with token-based providers
- [x] Barrel file restrictions (walls)
- [x] ESLint module boundary rules
- [x] Swagger API documentation setup
- [x] All controller endpoints scaffolded
- [x] Docker development environment
- [x] Configuration management

### Ready for Implementation (Business Logic)
- [ ] AuthService - Firebase token verification
- [ ] UserService - Profile CRUD
- [ ] GameService - Game engine logic
- [ ] RoomService - Room management
- [ ] MatchmakingService - Queue management
- [ ] FriendService - Friend operations
- [ ] WalletService - Balance management
- [ ] EloService - Rating calculations

---

## 🚨 Architecture Rules

1. **Never import service classes across modules**
   ```typescript
   // ❌ FORBIDDEN
   import { GameService } from '@game/services';
   
   // ✅ CORRECT
   @Inject(DI_TOKENS.GAME_ENGINE) private gameEngine: IGameEngine
   ```

2. **Barrel files export modules only**
   ```typescript
   // auth/index.ts
   export { AuthModule } from './auth.module';
   export { AuthGuard } from './guards'; // Exception: cross-cutting
   // ❌ export { AuthService } from './services';
   ```

3. **Modules export tokens, not classes**
   ```typescript
   @Module({
     exports: [DI_TOKENS.AUTH_SERVICE], // ✅
     // exports: [AuthService], // ❌
   })
   ```

4. **Run architecture verification before commits**
   ```bash
   npm run dev:check
   ```
