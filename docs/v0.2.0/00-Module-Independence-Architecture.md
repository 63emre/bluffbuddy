# v0.2.0 - Module Independence & DI Architecture

> **Owner:** Lead Software Architect  
> **Version:** v0.2.0 (Beta)  
> **Date:** February 2026  
> **Status:** Implementation Complete

---

## Table of Contents

1. [Overview](#1-overview)
2. [Breaking Changes from v0.1.0](#2-breaking-changes-from-v010)
3. [New Architecture](#3-new-architecture)
4. [Dependency Injection Tokens](#4-dependency-injection-tokens)
5. [Module Boundaries](#5-module-boundaries)
6. [Developer Workflow](#6-developer-workflow)
7. [Migration Guide](#7-migration-guide)
8. [File Reference](#8-file-reference)

---

## 1. Overview

This version introduces **strict module independence** to enable parallel development by 3 developers without merge conflicts. Key improvements:

- **Interface Segregation (ISP)**: Separated fat interfaces into focused contracts
- **Dependency Inversion (DIP)**: All high-level modules depend on abstractions
- **Barrel Export Pattern**: Controlled public APIs per module
- **Path Aliases**: TypeScript path mappings for clean imports
- **ESLint Enforcement**: Lint rules prevent cross-module internal imports

### Developer Assignments

| Developer | Modules | Interfaces Owned |
|-----------|---------|------------------|
| DEV1 | Infrastructure, Config | IRedisService, IHydrationService, IPubSubService, IConfigService |
| DEV2 | Game, Rating (ELO) | IGameEngine, ISealService, IMatchingService, IScoringService, IRoomService, IMatchmakingService |
| DEV3 | Auth, Social, Database | IUserRepository, IMatchRepository, ILeaderboardRepository, IFriendService, IPartyService |

---

## 2. Breaking Changes from v0.1.0

### 2.1 Import Path Changes

```typescript
// ❌ OLD (v0.1.0) - Direct imports
import { IUserRepository } from '../shared/contracts';
import { GameService } from '../game/services/game.service';

// ✅ NEW (v0.2.0) - Path aliases
import { IUserRepository, DI_TOKENS } from '@contracts';
import { GameService } from '@game';
```

### 2.2 Dependency Injection Changes

```typescript
// ❌ OLD (v0.1.0) - Direct class injection
constructor(private gameService: GameService) {}

// ✅ NEW (v0.2.0) - Interface-based injection
constructor(
  @Inject(DI_TOKENS.GAME_ENGINE) private gameEngine: IGameEngine
) {}
```

### 2.3 Module Export Changes

Modules no longer export all internals via `export * from './services'`.
Only public API is exported through the barrel file.

---

## 3. New Architecture

### 3.1 Contract Structure

```
src/shared/contracts/
├── index.ts                    # Main barrel export
├── di-tokens.ts                # DI_TOKENS constant
├── enums.ts                    # All enumerations
├── entities.ts                 # Entity interfaces (ICard, IUser, etc.)
├── events.ts                   # SocketEvents constant
├── payloads.ts                 # Socket payload interfaces
└── interfaces/
    ├── index.ts                # Interface barrel
    ├── game.interfaces.ts      # IGameEngine, ISealService, etc.
    ├── persistence.interfaces.ts  # IUserRepository, etc.
    ├── social.interfaces.ts    # IFriendService, etc.
    └── infrastructure.interfaces.ts # IRedisService, etc.
```

### 3.2 Module Structure

Each module follows this pattern:

```
src/<module>/
├── index.ts           # PUBLIC API (barrel export)
├── <module>.module.ts # NestJS module with DI wiring
├── gateways/          # WebSocket gateways
│   └── index.ts
├── services/          # Service implementations
│   └── index.ts
├── controllers/       # HTTP controllers (if any)
│   └── index.ts
└── dto/               # Module-specific DTOs
    └── index.ts
```

### 3.3 Import Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     @shared/contracts                        │
│  (DI_TOKENS, Interfaces, Enums, Entities, Payloads)         │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ imports
         ┌────────────────────┼────────────────────┐
         │                    │                    │
    ┌────┴────┐         ┌────┴────┐         ┌────┴────┐
    │  @game  │         │ @social │         │@database│
    │ Module  │         │ Module  │         │ Module  │
    └────┬────┘         └────┬────┘         └────┬────┘
         │                    │                    │
         │ exports            │ exports            │ exports
         │ (via DI)           │ (via DI)           │ (via DI)
         ▼                    ▼                    ▼
    IGameEngine          IFriendService      IUserRepository
    IRoomService         IPartyService       IMatchRepository
    ISealService         IPresenceService    ILeaderboardRepository
```

---

## 4. Dependency Injection Tokens

### 4.1 Token Registry

All DI tokens are defined in `@contracts/di-tokens`:

```typescript
export const DI_TOKENS = {
  // Game Module
  GAME_ENGINE: Symbol.for('IGameEngine'),
  SEAL_SERVICE: Symbol.for('ISealService'),
  ROOM_SERVICE: Symbol.for('IRoomService'),
  MATCHMAKING_SERVICE: Symbol.for('IMatchmakingService'),
  
  // Database Module
  USER_REPOSITORY: Symbol.for('IUserRepository'),
  MATCH_REPOSITORY: Symbol.for('IMatchRepository'),
  
  // Infrastructure Module
  REDIS_SERVICE: Symbol.for('IRedisService'),
  // ... etc
} as const;
```

### 4.2 Module Provider Registration

```typescript
// game.module.ts
@Module({
  providers: [
    {
      provide: DI_TOKENS.GAME_ENGINE,
      useClass: GameService,
    },
    // ...
  ],
  exports: [
    DI_TOKENS.GAME_ENGINE,
    // ...
  ],
})
export class GameModule {}
```

### 4.3 Service Injection

```typescript
// In any service that needs game engine
@Injectable()
export class SomeService {
  constructor(
    @Inject(DI_TOKENS.GAME_ENGINE)
    private readonly gameEngine: IGameEngine,
  ) {}
}
```

---

## 5. Module Boundaries

### 5.1 Path Aliases (tsconfig.json)

```json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@shared": ["shared/index"],
      "@contracts": ["shared/contracts/index"],
      "@game": ["game/index"],
      "@social": ["social/index"],
      "@auth": ["auth/index"],
      "@database": ["database/index"],
      "@infrastructure": ["infrastructure/index"],
      "@rating": ["rating/index"],
      "@common": ["common/index"],
      "@config": ["config/index"]
    }
  }
}
```

### 5.2 ESLint Import Restrictions

```javascript
// eslint.config.mjs
'no-restricted-imports': ['error', {
  patterns: [
    {
      group: ['../game/services/*', '../game/gateways/*'],
      message: 'Import from @game or @contracts instead.',
    },
    {
      group: ['../../..', '../../../*'],
      message: 'Use path aliases instead of deep relative imports.',
    },
  ],
}],
```

### 5.3 Allowed vs Forbidden Imports

| From Module | ✅ Allowed | ❌ Forbidden |
|-------------|-----------|--------------|
| social → game | `import { IGameEngine } from '@contracts'` | `import { GameService } from '../game/services/game.service'` |
| game → database | `import { IUserRepository } from '@contracts'` | `import { UserRepository } from '../database/services/user.repository'` |
| any → shared | `import { SocketEvents } from '@contracts'` | `import { helperFunc } from '../shared/utils/internal-helper'` |

---

## 6. Developer Workflow

### 6.1 Adding a New Interface

1. Define interface in appropriate file under `@contracts/interfaces/`
2. Add DI token to `@contracts/di-tokens`
3. Create implementation in your module
4. Wire in module's `*.module.ts`
5. Export token from module

### 6.2 Consuming Another Module's Service

```typescript
// 1. Import the interface and token
import { IUserRepository, DI_TOKENS } from '@contracts';

// 2. Import the module (for DI registration)
@Module({
  imports: [DatabaseModule], // provides IUserRepository
})

// 3. Inject via token
@Injectable()
export class MyService {
  constructor(
    @Inject(DI_TOKENS.USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
  ) {}
}
```

### 6.3 Testing with Mocks

```typescript
// In test file
const mockUserRepo: IUserRepository = {
  findById: jest.fn(),
  create: jest.fn(),
  // ...
};

const module = await Test.createTestingModule({
  providers: [
    MyService,
    { provide: DI_TOKENS.USER_REPOSITORY, useValue: mockUserRepo },
  ],
}).compile();
```

---

## 7. Migration Guide

### 7.1 Updating Existing Services

```typescript
// Before (v0.1.0)
import { GameService } from '../game/services/game.service';

@Injectable()
export class MyService {
  constructor(private gameService: GameService) {}
  
  doSomething() {
    this.gameService.createGame(...);
  }
}

// After (v0.2.0)
import { IGameEngine, DI_TOKENS } from '@contracts';

@Injectable()
export class MyService {
  constructor(
    @Inject(DI_TOKENS.GAME_ENGINE)
    private gameEngine: IGameEngine,
  ) {}
  
  doSomething() {
    this.gameEngine.createGame(...);
  }
}
```

### 7.2 Updating Module Imports

```typescript
// Before (v0.1.0)
import { GameModule, GameService } from '../game';

// After (v0.2.0)
import { GameModule } from '@game';
import { IGameEngine, DI_TOKENS } from '@contracts';
```

---

## 8. File Reference

### 8.1 New Files Created

| File | Purpose |
|------|---------|
| `src/shared/contracts/index.ts` | Main contracts barrel export |
| `src/shared/contracts/di-tokens.ts` | DI token registry |
| `src/shared/contracts/enums.ts` | All enumerations |
| `src/shared/contracts/entities.ts` | Entity interfaces |
| `src/shared/contracts/events.ts` | Socket event constants |
| `src/shared/contracts/payloads.ts` | Socket payload types |
| `src/shared/contracts/interfaces/game.interfaces.ts` | Game module interfaces |
| `src/shared/contracts/interfaces/persistence.interfaces.ts` | Database interfaces |
| `src/shared/contracts/interfaces/social.interfaces.ts` | Social module interfaces |
| `src/shared/contracts/interfaces/infrastructure.interfaces.ts` | Infra interfaces |

### 8.2 Modified Files

| File | Changes |
|------|---------|
| `tsconfig.json` | Added path aliases, enabled strict mode |
| `eslint.config.mjs` | Added import restriction rules |
| `src/*/index.ts` | Restricted exports to public API |
| `src/*/*.module.ts` | Added interface-based DI providers |
| `src/app.module.ts` | Added CommonModule import |

---

## Appendix: Interface Quick Reference

### Game Interfaces

```typescript
interface IGameEngine {
  createGame(roomId, players): IServerGameState;
  playCard(state, playerId, cardId): CardPlayedPayload;
  selectTarget(state, playerId, target): CardPlayedPayload;
  handleTimeout(state, playerId): void;
  getMaskedState(state, forPlayerId): IClientGameView;
  calculateFinalScores(state): IPlayerMatchResult[];
}

interface ISealService {
  initializeAccessibility(): void;
  onCardBuried(card): void;
  onCardExposed(card): void;
  getAccessibleCount(rank): number;
  isPileSealed(stack, state): boolean;
  checkAndApplySeals(state): ISealEvent[];
}
```

### Repository Interfaces

```typescript
interface IUserRepository {
  findById(uid): Promise<IUserProfile | null>;
  create(user): Promise<IUserProfile>;
  update(uid, data): Promise<IUserProfile>;
  updateStats(uid, gameResult): Promise<void>;
}

interface IMatchRepository {
  save(match): Promise<void>;
  findById(matchId): Promise<IMatchResult | null>;
  findByPlayer(uid, limit?): Promise<IMatchResult[]>;
}
```

### Infrastructure Interfaces

```typescript
interface IRedisService {
  get(key): Promise<string | null>;
  set(key, value, ttl?): Promise<void>;
  del(key): Promise<void>;
  publish(channel, message): Promise<number>;
  subscribe(channel, callback): Promise<void>;
}
```

---

**Next Version:** v0.3.0 will focus on Anti-cheat systems and Bot detection algorithms.
