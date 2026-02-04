# 04 - Database & Firestore Architecture

> **Owner:** Developer 3 (Data & Social)  
> **Last Updated:** February 2026  
> **Status:** Specification

---

## Table of Contents

1. [Overview](#1-overview)
2. [Firestore Fundamentals](#2-firestore-fundamentals)
3. [Schema Design](#3-schema-design)
4. [ACID Transactions](#4-acid-transactions)
5. [Cost Optimization](#5-cost-optimization)
6. [Repository Pattern](#6-repository-pattern)
7. [Security Rules](#7-security-rules)
8. [Indexing Strategy](#8-indexing-strategy)

---

## 1. Overview

BluffBuddy Online uses **Firebase Firestore** as its primary database. Firestore is a NoSQL document database that offers:

- Real-time synchronization
- Offline support (for clients)
- Serverless scaling
- Pay-per-operation pricing

### Key Design Principles

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE DESIGN PRINCIPLES                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. MINIMIZE WRITES DURING GAMEPLAY                             │
│     • Game state lives in memory                                │
│     • Write only at game end                                    │
│                                                                  │
│  2. DENORMALIZE FOR READ PERFORMANCE                            │
│     • Duplicate data to avoid joins                             │
│     • Optimize for common access patterns                       │
│                                                                  │
│  3. USE TRANSACTIONS FOR CONSISTENCY                            │
│     • ELO updates must be atomic                                │
│     • Wallet modifications require transactions                 │
│                                                                  │
│  4. AVOID HOTSPOTS                                              │
│     • No single document with frequent writes                   │
│     • Distribute write load across documents                    │
│                                                                  │
│  5. USE REDIS FOR ACTIVE GAME STATE (MANDATORY)                 │
│     • Game state persisted in Redis (crash recovery)            │
│     • Firestore only at game END                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Storage Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA STORAGE LAYERS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   LAYER 1: RAM (Fastest - During Gameplay)                      │
│   ──────────────────────────────────────                        │
│   • Active game state in memory                                 │
│   • Player hands, board state, turn info                        │
│   • Access time: <1ms                                           │
│                                                                  │
│   LAYER 2: REDIS (Fast - Crash Recovery)                        │
│   ───────────────────────────────────────                       │
│   • Game state snapshot every 5 seconds                         │
│   • Session data, active room tracking                          │
│   • TTL: 1 hour (auto-expire abandoned games)                   │
│   • Access time: ~1-5ms                                         │
│   • ⚠️ MANDATORY for production!                                │
│                                                                  │
│   LAYER 3: FIRESTORE (Persistent - Permanent Storage)           │
│   ─────────────────────────────────────────────────             │
│   • User profiles, ELO ratings                                  │
│   • Match history, replay data                                  │
│   • Leaderboards, purchases                                     │
│   • Written ONLY at game end                                    │
│   • Access time: 20-100ms                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Why NOT Write During Gameplay?

```
NAIVE APPROACH (DON'T DO THIS):
===============================
Every move → Write to Firestore
100 moves × 4 players × 50 games/hour = 20,000 writes/hour

With 250 CCU playing continuously:
~500,000 writes/day = $$$$ (and exceeds free tier)

OPTIMIZED APPROACH (DO THIS):
=============================
Game End → 1 Batch Write
Includes: Match result, 4× ELO updates, 1× replay log

50 games/hour × 6 writes = 300 writes/hour
~7,200 writes/day = Within free tier! ✓

CRASH PROTECTION:
=================
During gameplay → Redis (every 5 seconds)
Server restart → Hydrate from Redis
No data loss, no Firestore cost!
```

---

## 2. Firestore Fundamentals

### 2.1 Data Model

Firestore uses **Collections** and **Documents**:

```
Firestore Structure
├── Collection: users
│   ├── Document: user_abc123
│   │   ├── Field: nickname = "Player1"
│   │   ├── Field: elo = 1500
│   │   └── Field: wallet = { coins: 100, gems: 5 }
│   └── Document: user_def456
│       └── ...
│
├── Collection: matches
│   ├── Document: match_xyz789
│   │   ├── Field: timestamp = 2026-02-04T12:00:00Z
│   │   ├── Field: participants = ["user_abc", "user_def", ...]
│   │   └── Field: replayData = "compressed_base64..."
│   └── ...
│
└── Collection: leaderboards
    └── Document: season_2026_q1
        └── Subcollection: entries
            ├── Document: user_abc123
            │   └── Field: elo = 1650
            └── ...
```

### 2.2 Read/Write Costs

| Operation | Cost (Free Tier) | Cost (Blaze Plan) |
|-----------|------------------|-------------------|
| Read | 50,000/day | $0.06 per 100,000 |
| Write | 20,000/day | $0.18 per 100,000 |
| Delete | 20,000/day | $0.02 per 100,000 |

**Goal:** Stay within free tier (Spark Plan) for MVP

### 2.3 Connection from NestJS

```typescript
// firestore.service.ts
import * as admin from 'firebase-admin';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FirestoreService implements OnModuleInit {
  private db: admin.firestore.Firestore;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    // Initialize Firebase Admin SDK
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: this.configService.get('FIREBASE_PROJECT_ID'),
          clientEmail: this.configService.get('FIREBASE_CLIENT_EMAIL'),
          privateKey: this.configService.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
        }),
      });
    }
    
    this.db = admin.firestore();
    
    // Optimize settings
    this.db.settings({
      ignoreUndefinedProperties: true,
    });
  }

  getFirestore(): admin.firestore.Firestore {
    return this.db;
  }
}
```

---

## 3. Schema Design

### 3.1 Users Collection

```typescript
// Collection: users
// Document ID: Firebase Auth UID

interface UserDocument {
  // Identity
  uid: string;                    // Same as document ID
  nickname: string;               // Display name (unique)
  email?: string;                 // Optional, from auth
  avatarUrl?: string;             // Profile picture
  
  // Stats
  stats: {
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;              // Precomputed: wins / totalGames
    currentStreak: number;        // Consecutive wins
    bestStreak: number;
    totalPenaltyPoints: number;   // Historical accumulation
    averagePlacement: number;     // 1.0 - 4.0 scale
    disconnects: number;          // Track rage-quitters
  };
  
  // Ranking
  elo: number;                    // Current ELO rating
  rank: PlayerRank;               // Bronze, Silver, Gold, etc.
  seasonHighestElo: number;
  
  // Economy
  wallet: {
    coins: number;                // Soft currency
    gems: number;                 // Premium currency
  };
  
  // Social
  friendIds: string[];            // Array of user IDs
  blockedIds: string[];
  
  // Inventory (future)
  inventory: {
    cardBacks: string[];
    avatars: string[];
    emotes: string[];
  };
  
  // Metadata
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  lastGameAt?: Timestamp;
  settings: {
    language: string;             // 'en', 'tr', etc.
    soundEnabled: boolean;
    notificationsEnabled: boolean;
  };
}

// Rank thresholds
enum PlayerRank {
  BRONZE = 'bronze',       // 0 - 1199
  SILVER = 'silver',       // 1200 - 1399
  GOLD = 'gold',           // 1400 - 1599
  PLATINUM = 'platinum',   // 1600 - 1799
  DIAMOND = 'diamond',     // 1800 - 1999
  MASTER = 'master',       // 2000+
}
```

### 3.2 Matches Collection

```typescript
// Collection: matches
// Document ID: Auto-generated UUID

interface MatchDocument {
  // Identity
  id: string;
  
  // Timing
  startedAt: Timestamp;
  endedAt: Timestamp;
  duration: number;               // Seconds
  
  // Participants (denormalized for query efficiency)
  participants: ParticipantSummary[];
  participantIds: string[];       // Array for querying
  
  // Results
  results: MatchResult[];         // Sorted by placement
  
  // Game data
  totalRounds: number;            // Always 3
  totalMoves: number;
  
  // Replay (compressed)
  replayData?: string;            // Base64 encoded, zlib compressed
  replayVersion: number;          // For format compatibility
  
  // Matchmaking info
  matchType: 'ranked' | 'casual' | 'private';
  averageElo: number;             // For matchmaking analysis
}

interface ParticipantSummary {
  odindex: number;                  // Turn order
  odindexerId: string;
  nickname: string;
  eloBefore: number;
  eloAfter: number;
  eloChange: number;
}

interface MatchResult {
  playerId: string;
  placement: number;              // 1-4 (1 = winner)
  penaltyPoints: number;
  sealedStacks: number;           // How many seals they had
  cardsPlayed: number;
}
```

### 3.3 Leaderboards Collection

```typescript
// Collection: leaderboards
// Subcollection pattern for scalability

// Document: leaderboards/season_2026_q1
interface SeasonDocument {
  seasonId: string;
  name: string;                   // "Season 1 - 2026"
  startDate: Timestamp;
  endDate: Timestamp;
  isActive: boolean;
  rewards: SeasonReward[];
}

// Subcollection: leaderboards/season_2026_q1/entries/{userId}
interface LeaderboardEntry {
  odindexerId: string;                    // Same as document ID
  nickname: string;                 // Denormalized
  elo: number;
  rank: PlayerRank;
  gamesPlayed: number;
  wins: number;
  lastUpdated: Timestamp;
}
```

### 3.4 Transactions Collection (IAP)

```typescript
// Collection: transactions
// Document ID: Store transaction ID (for idempotency)

interface TransactionDocument {
  id: string;                     // Store transaction ID
  userId: string;
  
  // Store info
  store: 'apple' | 'google';
  productId: string;
  receiptData: string;            // Encrypted/hashed
  
  // Fulfillment
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  itemsGranted: {
    coins?: number;
    gems?: number;
    items?: string[];
  };
  
  // Audit
  createdAt: Timestamp;
  processedAt?: Timestamp;
  errorMessage?: string;
}
```

### 3.5 Friend Requests Collection

```typescript
// Collection: friendRequests
// Document ID: Auto-generated

interface FriendRequestDocument {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Timestamp;
  respondedAt?: Timestamp;
}
```

---

## 4. ACID Transactions

### 4.1 Why Transactions Matter

Game-end updates must be **atomic**. If any part fails, nothing should be written.

```
GAME END OPERATIONS:
====================
1. Update Player 1 ELO     ─┐
2. Update Player 2 ELO      │
3. Update Player 3 ELO      ├── Must ALL succeed or ALL fail
4. Update Player 4 ELO      │
5. Create match record      │
6. Update leaderboard      ─┘
```

### 4.2 Game End Transaction

```typescript
// game-end-transaction.service.ts
import * as admin from 'firebase-admin';

interface GameEndData {
  matchId: string;
  participants: {
    odindexerId: string;
    eloBefore: number;
    eloAfter: number;
    placement: number;
    penaltyPoints: number;
  }[];
  replayData: string;
  duration: number;
}

async function processGameEnd(data: GameEndData): Promise<void> {
  const db = admin.firestore();
  
  await db.runTransaction(async (transaction) => {
    // 1. Read all player documents (required before writes)
    const playerRefs = data.participants.map(p => 
      db.collection('users').doc(p.odindexerId)
    );
    const playerDocs = await Promise.all(
      playerRefs.map(ref => transaction.get(ref))
    );
    
    // 2. Validate all players exist
    for (const doc of playerDocs) {
      if (!doc.exists) {
        throw new Error(`Player ${doc.id} not found`);
      }
    }
    
    // 3. Update each player's ELO and stats
    for (let i = 0; i < data.participants.length; i++) {
      const p = data.participants[i];
      const playerRef = playerRefs[i];
      const currentData = playerDocs[i].data()!;
      
      const isWin = p.placement === 1;
      const currentStreak = isWin 
        ? currentData.stats.currentStreak + 1 
        : 0;
      
      transaction.update(playerRef, {
        'elo': p.eloAfter,
        'rank': calculateRank(p.eloAfter),
        'stats.totalGames': admin.firestore.FieldValue.increment(1),
        'stats.wins': isWin 
          ? admin.firestore.FieldValue.increment(1) 
          : currentData.stats.wins,
        'stats.losses': !isWin 
          ? admin.firestore.FieldValue.increment(1) 
          : currentData.stats.losses,
        'stats.currentStreak': currentStreak,
        'stats.bestStreak': Math.max(currentStreak, currentData.stats.bestStreak),
        'stats.totalPenaltyPoints': admin.firestore.FieldValue.increment(p.penaltyPoints),
        'lastGameAt': admin.firestore.FieldValue.serverTimestamp(),
      });
      
      // 4. Update leaderboard entry
      const leaderboardRef = db
        .collection('leaderboards')
        .doc('season_2026_q1')
        .collection('entries')
        .doc(p.odindexerId);
      
      transaction.set(leaderboardRef, {
        odindexerId: p.odindexerId,
        nickname: currentData.nickname,
        elo: p.eloAfter,
        rank: calculateRank(p.eloAfter),
        gamesPlayed: admin.firestore.FieldValue.increment(1),
        wins: isWin 
          ? admin.firestore.FieldValue.increment(1) 
          : currentData.stats.wins,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    
    // 5. Create match document
    const matchRef = db.collection('matches').doc(data.matchId);
    transaction.set(matchRef, {
      id: data.matchId,
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
      endedAt: admin.firestore.FieldValue.serverTimestamp(),
      duration: data.duration,
      participants: data.participants.map(p => ({
        odindexerId: p.odindexerId,
        eloBefore: p.eloBefore,
        eloAfter: p.eloAfter,
        eloChange: p.eloAfter - p.eloBefore,
      })),
      participantIds: data.participants.map(p => p.odindexerId),
      results: data.participants.map(p => ({
        odindexerId: p.odindexerId,
        placement: p.placement,
        penaltyPoints: p.penaltyPoints,
      })),
      replayData: data.replayData,
      replayVersion: 1,
      matchType: 'ranked',
      averageElo: data.participants.reduce((sum, p) => sum + p.eloBefore, 0) / 4,
    });
  });
}
```

### 4.3 Transaction Retry Logic

Firestore transactions automatically retry on contention. Add explicit error handling:

```typescript
async function safeTransaction<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Check if retryable
      if (error.code === 'aborted' || error.code === 'unavailable') {
        console.warn(`Transaction attempt ${attempt} failed, retrying...`);
        await sleep(Math.pow(2, attempt) * 100); // Exponential backoff
        continue;
      }
      
      // Non-retryable error
      throw error;
    }
  }
  
  throw lastError!;
}
```

---

## 5. Cost Optimization

### 5.1 Caching Strategy

**In-Memory Cache for Hot Data:**

```typescript
// user-cache.service.ts
import { Injectable } from '@nestjs/common';
import NodeCache from 'node-cache';

@Injectable()
export class UserCacheService {
  private cache = new NodeCache({
    stdTTL: 300,          // 5 minutes default TTL
    checkperiod: 60,      // Check for expired keys every 60s
    maxKeys: 1000,        // Limit cache size
  });
  
  async getUser(userId: string): Promise<UserDocument | null> {
    // Try cache first
    const cached = this.cache.get<UserDocument>(userId);
    if (cached) {
      return cached;
    }
    
    // Fetch from Firestore
    const doc = await this.firestore
      .collection('users')
      .doc(userId)
      .get();
    
    if (!doc.exists) return null;
    
    const user = doc.data() as UserDocument;
    
    // Store in cache
    this.cache.set(userId, user);
    
    return user;
  }
  
  invalidateUser(userId: string): void {
    this.cache.del(userId);
  }
}
```

### 5.2 Batch Operations

When reading multiple documents, use batch reads:

```typescript
// ❌ BAD: N separate reads
async function getUsers(userIds: string[]) {
  const users = [];
  for (const id of userIds) {
    const doc = await db.collection('users').doc(id).get();
    users.push(doc.data());
  }
  return users; // N reads
}

// ✅ GOOD: Single batch read
async function getUsers(userIds: string[]) {
  const refs = userIds.map(id => db.collection('users').doc(id));
  const docs = await db.getAll(...refs);
  return docs.map(doc => doc.data()); // 1 read operation (billed as N)
}
```

### 5.3 Write Batching

```typescript
// Batch writes for non-transactional updates
async function updateManyUsers(updates: { userId: string; data: Partial<UserDocument> }[]) {
  const batch = db.batch();
  
  for (const update of updates) {
    const ref = db.collection('users').doc(update.userId);
    batch.update(ref, update.data);
  }
  
  await batch.commit(); // Single network call
}
```

### 5.4 Data Minimization

Don't read entire documents when you only need a few fields:

```typescript
// ❌ BAD: Reads entire document
const doc = await db.collection('users').doc(userId).get();
const nickname = doc.data()?.nickname;

// ✅ GOOD: Use projection (Note: Firestore still charges for full doc)
// Better approach: Keep frequently accessed data in smaller documents

// Split user data:
// users/{id}/public  → nickname, avatarUrl, rank (small, frequently read)
// users/{id}/private → wallet, settings, inventory (less frequent)
```

### 5.5 Estimated Daily Operations (250 CCU)

| Operation | Count | Notes |
|-----------|-------|-------|
| User reads (cached) | ~1,000 | On login, cache hit thereafter |
| User reads (uncached) | ~500 | Cache misses |
| Match writes | ~300 | ~50 games/hour × 6 docs |
| Leaderboard reads | ~2,000 | On menu load |
| Friend list reads | ~1,000 | On social tab |
| **Total Reads** | **~5,000/day** | Well under 50k free tier |
| **Total Writes** | **~400/day** | Well under 20k free tier |

---

## 6. Repository Pattern

### 6.1 Repository Interfaces

```typescript
// interfaces/user-repository.interface.ts
export interface IUserRepository {
  findById(userId: string): Promise<UserDocument | null>;
  findByNickname(nickname: string): Promise<UserDocument | null>;
  create(user: Partial<UserDocument>): Promise<UserDocument>;
  update(userId: string, data: Partial<UserDocument>): Promise<void>;
  updateElo(userId: string, newElo: number): Promise<void>;
  addFriend(userId: string, friendId: string): Promise<void>;
  removeFriend(userId: string, friendId: string): Promise<void>;
}

// interfaces/match-repository.interface.ts
export interface IMatchRepository {
  findById(matchId: string): Promise<MatchDocument | null>;
  findByUser(userId: string, limit?: number): Promise<MatchDocument[]>;
  create(match: MatchDocument): Promise<void>;
  getReplayData(matchId: string): Promise<string | null>;
}

// interfaces/leaderboard-repository.interface.ts
export interface ILeaderboardRepository {
  getTopPlayers(seasonId: string, limit: number): Promise<LeaderboardEntry[]>;
  getPlayerRank(seasonId: string, userId: string): Promise<number | null>;
  updateEntry(seasonId: string, entry: LeaderboardEntry): Promise<void>;
}
```

### 6.2 Firestore Implementation

```typescript
// repositories/user.repository.ts
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    private firestore: FirestoreService,
    private cache: UserCacheService,
  ) {}
  
  private get collection() {
    return this.firestore.getFirestore().collection('users');
  }
  
  async findById(userId: string): Promise<UserDocument | null> {
    // Try cache first
    const cached = await this.cache.getUser(userId);
    if (cached) return cached;
    
    const doc = await this.collection.doc(userId).get();
    if (!doc.exists) return null;
    
    const user = doc.data() as UserDocument;
    this.cache.setUser(userId, user);
    return user;
  }
  
  async findByNickname(nickname: string): Promise<UserDocument | null> {
    const snapshot = await this.collection
      .where('nickname', '==', nickname)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as UserDocument;
  }
  
  async create(user: Partial<UserDocument>): Promise<UserDocument> {
    const newUser: UserDocument = {
      uid: user.uid!,
      nickname: user.nickname!,
      elo: 1200,
      rank: PlayerRank.BRONZE,
      seasonHighestElo: 1200,
      stats: {
        totalGames: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        currentStreak: 0,
        bestStreak: 0,
        totalPenaltyPoints: 0,
        averagePlacement: 0,
        disconnects: 0,
      },
      wallet: {
        coins: 500,  // Starter bonus
        gems: 0,
      },
      friendIds: [],
      blockedIds: [],
      inventory: {
        cardBacks: ['default'],
        avatars: ['default'],
        emotes: [],
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      settings: {
        language: 'en',
        soundEnabled: true,
        notificationsEnabled: true,
      },
      ...user,
    };
    
    await this.collection.doc(newUser.uid).set(newUser);
    return newUser;
  }
  
  async update(userId: string, data: Partial<UserDocument>): Promise<void> {
    await this.collection.doc(userId).update(data);
    this.cache.invalidateUser(userId);
  }
  
  async updateElo(userId: string, newElo: number): Promise<void> {
    const rank = calculateRank(newElo);
    await this.collection.doc(userId).update({
      elo: newElo,
      rank,
    });
    this.cache.invalidateUser(userId);
  }
  
  async addFriend(userId: string, friendId: string): Promise<void> {
    await this.collection.doc(userId).update({
      friendIds: admin.firestore.FieldValue.arrayUnion(friendId),
    });
    this.cache.invalidateUser(userId);
  }
  
  async removeFriend(userId: string, friendId: string): Promise<void> {
    await this.collection.doc(userId).update({
      friendIds: admin.firestore.FieldValue.arrayRemove(friendId),
    });
    this.cache.invalidateUser(userId);
  }
}
```

### 6.3 Module Registration

```typescript
// persistence.module.ts
@Module({
  imports: [CommonModule],
  providers: [
    FirestoreService,
    UserCacheService,
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
    {
      provide: 'IMatchRepository',
      useClass: MatchRepository,
    },
    {
      provide: 'ILeaderboardRepository',
      useClass: LeaderboardRepository,
    },
  ],
  exports: [
    'IUserRepository',
    'IMatchRepository',
    'ILeaderboardRepository',
    FirestoreService,
  ],
})
export class PersistenceModule {}
```

---

## 7. Security Rules

### 7.1 Firestore Security Rules

Even though we use Admin SDK (which bypasses rules), define rules for client-side access (if ever needed):

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      // Anyone can read public profile data
      allow read: if request.auth != null;
      
      // Only owner can update, and only specific fields
      allow update: if request.auth.uid == userId
        && request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['settings', 'nickname', 'avatarUrl']);
      
      // Only server can create/delete (via Admin SDK)
      allow create, delete: if false;
    }
    
    // Matches are read-only for clients
    match /matches/{matchId} {
      allow read: if request.auth != null 
        && request.auth.uid in resource.data.participantIds;
      allow write: if false;  // Server only
    }
    
    // Leaderboards are public read
    match /leaderboards/{seasonId} {
      allow read: if true;
      allow write: if false;
      
      match /entries/{userId} {
        allow read: if true;
        allow write: if false;
      }
    }
    
    // Transactions are server-only
    match /transactions/{transactionId} {
      allow read, write: if false;
    }
    
    // Friend requests
    match /friendRequests/{requestId} {
      allow read: if request.auth != null
        && (request.auth.uid == resource.data.fromUserId 
            || request.auth.uid == resource.data.toUserId);
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.fromUserId;
      allow update: if request.auth != null
        && request.auth.uid == resource.data.toUserId
        && request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['status', 'respondedAt']);
      allow delete: if false;
    }
  }
}
```

---

## 8. Indexing Strategy

### 8.1 Required Indexes

Firestore requires composite indexes for complex queries:

```javascript
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "matches",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "participantIds", "arrayConfig": "CONTAINS" },
        { "fieldPath": "endedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "entries",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "elo", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "friendRequests",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "toUserId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### 8.2 Query Optimization

```typescript
// Get user's match history (most recent first)
async function getUserMatches(userId: string, limit: number = 10) {
  return await db.collection('matches')
    .where('participantIds', 'array-contains', userId)
    .orderBy('endedAt', 'desc')
    .limit(limit)
    .get();
}

// Get top 100 leaderboard
async function getLeaderboard(seasonId: string) {
  return await db.collection('leaderboards')
    .doc(seasonId)
    .collection('entries')
    .orderBy('elo', 'desc')
    .limit(100)
    .get();
}

// Get pending friend requests
async function getPendingRequests(userId: string) {
  return await db.collection('friendRequests')
    .where('toUserId', '==', userId)
    .where('status', '==', 'pending')
    .orderBy('createdAt', 'desc')
    .get();
}
```

---

## Quick Reference

### Collection Summary

| Collection | Document ID | Primary Use | Write Frequency |
|------------|-------------|-------------|-----------------|
| `users` | Firebase UID | Player profiles | On game end |
| `matches` | UUID | Match history | On game end |
| `leaderboards/{season}/entries` | Firebase UID | Rankings | On game end |
| `transactions` | Store TX ID | IAP records | On purchase |
| `friendRequests` | UUID | Social | On request |

### Key Design Decisions

1. **Game state NOT in Firestore** - Lives in server memory only
2. **Denormalized nicknames** - Avoid joins, duplicate in match docs
3. **Subcollection for leaderboards** - Prevents hotspot, scales better
4. **Cache aggressively** - 5-minute TTL for user profiles
5. **Batch game-end writes** - Single transaction for all updates

---

## References

- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Firestore Pricing](https://firebase.google.com/pricing)

---

*Document Version: 1.0 | Last Updated: February 2026*
