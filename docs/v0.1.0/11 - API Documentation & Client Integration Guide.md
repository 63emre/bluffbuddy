# 11 - API Documentation & Client Integration Guide

> **Owner:** Developer 1 (Infrastructure) + Developer 2 (Game Engine)  
> **Last Updated:** February 2026  
> **Status:** Specification v0.1.0  
> **Client Stack:** Flutter + Flame (Android & iOS)

---

## Table of Contents

1. [Overview](#1-overview)
2. [External Services (Third-Party)](#2-external-services-third-party)
3. [Backend Socket.io API](#3-backend-socketio-api)
4. [Backend REST API](#4-backend-rest-api)
5. [Data Flow Diagrams](#5-data-flow-diagrams)
6. [Authentication Flow](#6-authentication-flow)
7. [Game Session Lifecycle](#7-game-session-lifecycle)
8. [Error Codes & Responses](#8-error-codes--responses)
9. [Rate Limiting](#9-rate-limiting)

---

## 1. Overview

BluffBuddy backend, Flutter/Flame client'lara hizmet veren bir NestJS sunucusudur.

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BLUFFBUDDY SYSTEM                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                    EXTERNAL SERVICES                                  │  │
│   │                                                                       │  │
│   │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                 │  │
│   │  │  Firebase   │   │  Firebase   │   │   Google    │                 │  │
│   │  │    Auth     │   │  Firestore  │   │  Play/Apple │                 │  │
│   │  │             │   │             │   │  Game Center│                 │  │
│   │  └──────┬──────┘   └──────┬──────┘   └─────────────┘                 │  │
│   │         │                 │                                           │  │
│   └─────────┼─────────────────┼───────────────────────────────────────────┘  │
│             │                 │                                              │
│             ▼                 ▼                                              │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                    BLUFFBUDDY BACKEND (NestJS)                        │  │
│   │                                                                       │  │
│   │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                 │  │
│   │  │   Socket.io │   │   REST API  │   │    Redis    │                 │  │
│   │  │   Gateway   │   │  Endpoints  │   │   (State)   │                 │  │
│   │  │             │   │             │   │             │                 │  │
│   │  │  /game      │   │  /health    │   │  game:*     │                 │  │
│   │  │  /social    │   │  /admin     │   │  room:*     │                 │  │
│   │  └──────┬──────┘   └──────┬──────┘   └─────────────┘                 │  │
│   │         │                 │                                           │  │
│   └─────────┼─────────────────┼───────────────────────────────────────────┘  │
│             │                 │                                              │
│             ▼                 ▼                                              │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                    FLUTTER/FLAME CLIENTS                              │  │
│   │                                                                       │  │
│   │  ┌─────────────┐                      ┌─────────────┐                 │  │
│   │  │   Android   │                      │     iOS     │                 │  │
│   │  │   (Flame)   │                      │   (Flame)   │                 │  │
│   │  └─────────────┘                      └─────────────┘                 │  │
│   │                                                                       │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Connection Summary

| From | To | Protocol | Purpose |
|------|-----|----------|---------|
| Client | Firebase Auth | HTTPS | Kullanıcı girişi, token alma |
| Client | Backend | WSS (Socket.io) | Real-time oyun iletişimi |
| Client | Backend | HTTPS | Health check (optional) |
| Backend | Firebase Admin | HTTPS | Token doğrulama |
| Backend | Firestore | HTTPS | Kullanıcı profili, oyun geçmişi |
| Backend | Redis | TCP | Oyun state, session, cache |

---

## 2. External Services (Third-Party)

### 2.1 Firebase Authentication

**Backend tarafından kullanılır:** Token doğrulama için

#### Backend Konfigürasyonu

```typescript
// Backend - Firebase Admin SDK initialization
import * as admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  }),
});
```

#### Token Doğrulama (Backend)

```typescript
// auth.service.ts
async verifyToken(idToken: string): Promise<DecodedIdToken> {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    throw new UnauthorizedException('Invalid token');
  }
}
```

#### Client'ın Göndermesi Gereken Token Formatı

```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

veya Socket.io handshake'te:

```javascript
{
  auth: {
    token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Decoded Token İçeriği (Backend'in aldığı)

```json
{
  "iss": "https://securetoken.google.com/bluffbuddy-prod",
  "aud": "bluffbuddy-prod",
  "auth_time": 1706961600,
  "user_id": "abc123xyz",
  "sub": "abc123xyz",
  "iat": 1706961600,
  "exp": 1706965200,
  "email": "user@example.com",
  "email_verified": true,
  "firebase": {
    "identities": {
      "google.com": ["123456789"],
      "email": ["user@example.com"]
    },
    "sign_in_provider": "google.com"
  }
}
```

---

### 2.2 Firebase Firestore

**Backend tarafından kullanılır:** Kalıcı veri depolama

#### Collections (Backend tarafından yönetilir)

```
firestore/
│
├── users/{userId}
│   ├── nickname: string
│   ├── email: string
│   ├── avatarUrl: string | null
│   ├── elo: number (default: 1000)
│   ├── gamesPlayed: number
│   ├── gamesWon: number
│   ├── coins: number
│   ├── createdAt: Timestamp
│   ├── lastSeen: Timestamp
│   └── isBanned: boolean
│
├── matches/{matchId}
│   ├── players: string[] (userIds)
│   ├── results: PlayerResult[]
│   ├── type: 'casual' | 'ranked'
│   ├── duration: number (seconds)
│   ├── startedAt: Timestamp
│   └── endedAt: Timestamp
│
├── friends/{friendshipId}
│   ├── users: [userId1, userId2]
│   └── since: Timestamp
│
└── friendRequests/{requestId}
    ├── from: string (userId)
    ├── to: string (userId)
    ├── sentAt: Timestamp
    └── status: 'pending' | 'accepted' | 'declined'
```

#### Backend Firestore Kullanımı

```typescript
// user.service.ts
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

async createUser(userId: string, data: CreateUserDto): Promise<User> {
  const userRef = db.collection('users').doc(userId);
  await userRef.set({
    nickname: data.nickname,
    email: data.email,
    elo: 1000,
    gamesPlayed: 0,
    gamesWon: 0,
    coins: 100,
    createdAt: FieldValue.serverTimestamp(),
    lastSeen: FieldValue.serverTimestamp(),
    isBanned: false,
  });
  return this.getUserById(userId);
}

async updateElo(userId: string, newElo: number): Promise<void> {
  await db.collection('users').doc(userId).update({
    elo: newElo,
    lastSeen: FieldValue.serverTimestamp(),
  });
}

async recordMatch(matchData: MatchData): Promise<string> {
  const matchRef = await db.collection('matches').add({
    ...matchData,
    endedAt: FieldValue.serverTimestamp(),
  });
  return matchRef.id;
}
```

---

### 2.3 Redis

**Backend tarafından kullanılır:** Real-time state, caching, pub/sub

#### Key Patterns

| Pattern | TTL | Description |
|---------|-----|-------------|
| `game:{roomId}` | - | Aktif oyun state'i |
| `room:{roomId}` | - | Oda bilgisi (oyun öncesi) |
| `session:{socketId}` | 1h | Kullanıcı session bilgisi |
| `presence:{userId}` | 5m | Online durumu |
| `queue:casual` | - | Casual matchmaking queue |
| `queue:ranked` | - | Ranked matchmaking queue |
| `ratelimit:{userId}:{action}` | varies | Rate limit counters |
| `leaderboard:global` | - | Sorted set (ELO sıralaması) |

#### Redis Data Structures

```typescript
// Game State (Hash or JSON)
game:{roomId} = {
  phase: "playing",
  round: 1,
  turnIndex: 0,
  players: [...],
  openCenter: [...],
  pool: [...],
  lastUpdated: timestamp
}

// Matchmaking Queue (Sorted Set)
queue:ranked = {
  userId1: elo1,  // score = ELO
  userId2: elo2,
  ...
}

// Leaderboard (Sorted Set)
leaderboard:global = {
  userId1: elo1,
  userId2: elo2,
  ...
}

// Presence (String with TTL)
presence:{userId} = "online" | "in_game" | "in_lobby"
TTL: 300 seconds (5 min heartbeat)
```

---

## 3. Backend Socket.io API

### 3.1 Connection

#### Server Endpoints

| Environment | URL | Namespaces |
|-------------|-----|------------|
| Development | `ws://localhost:3000` | `/game`, `/social` |
| Staging | `wss://staging-api.bluffbuddy.com` | `/game`, `/social` |
| Production | `wss://api.bluffbuddy.com` | `/game`, `/social` |

#### Handshake Requirements

Client bağlanırken şunları sağlamalı:

```javascript
// Socket.io connection options
{
  auth: {
    token: "<Firebase ID Token>"  // REQUIRED
  },
  transports: ['websocket'],      // Recommended
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
}
```

#### Connection Response

Başarılı bağlantı sonrası backend şunu gönderir:

```typescript
// Event: 'connected'
{
  userId: string,
  serverTime: string  // ISO 8601 - Client clock sync için
}
```

---

### 3.2 Event Reference (Client → Server)

#### Authentication

| Event | Payload | Description |
|-------|---------|-------------|
| *(otomatik)* | `{ auth: { token } }` | Handshake'te token gönderilir |

#### Room Events

| Event | Payload | Response Event |
|-------|---------|----------------|
| `room:create` | `{ type: 'public' \| 'private' }` | `room:created` |
| `room:join` | `{ roomId: string }` | `room:joined` |
| `room:leave` | `{}` | - |
| `room:ready` | `{}` | `room:player:ready` |

#### Game Events

| Event | Payload | Response Event |
|-------|---------|----------------|
| `game:play` | `{ cardId: string, targetSlotOwnerId?: string }` | `game:played` |
| `game:target` | `{ playerId: string }` | `game:played` |

#### Matchmaking Events

| Event | Payload | Response Event |
|-------|---------|----------------|
| `match:queue` | `{ type: 'casual' \| 'ranked' }` | `match:searching` |
| `match:cancel` | `{}` | `match:cancelled` |

#### Social Events

| Event | Payload | Response Event |
|-------|---------|----------------|
| `social:friend:add` | `{ target: string }` | `social:friend:request` |
| `social:friend:accept` | `{ requestId: string }` | - |
| `social:friend:decline` | `{ requestId: string }` | - |
| `social:party:invite` | `{ userId: string }` | - |
| `social:party:accept` | `{ inviteId: string }` | - |
| `social:party:leave` | `{}` | - |

#### Chat Events

| Event | Payload | Response Event |
|-------|---------|----------------|
| `chat:message` | `{ messageId: string }` | `chat:message` (broadcast) |
| `chat:reaction` | `{ emojiId: string }` | `chat:reaction` (broadcast) |

---

### 3.3 Event Reference (Server → Client)

#### Connection Events

| Event | Payload | When |
|-------|---------|------|
| `connected` | `{ userId, serverTime }` | Bağlantı başarılı |
| `error` | `{ code, message, timestamp, details? }` | Hata oluştu |
| `kicked` | `{ reason }` | Zorla bağlantı kesildi |

#### Room Events

| Event | Payload | When |
|-------|---------|------|
| `room:created` | `{ roomId, inviteCode? }` | Oda oluşturuldu |
| `room:joined` | `RoomState` | Odaya katıldın |
| `room:player:joined` | `{ player: PublicPlayerState }` | Yeni oyuncu katıldı |
| `room:player:left` | `{ playerId, reason? }` | Oyuncu ayrıldı |
| `room:player:ready` | `{ playerId, ready }` | Hazır durumu değişti |

#### Game Events

| Event | Payload | When |
|-------|---------|------|
| `game:start` | `{ gameState: ClientGameView }` | Oyun başladı |
| `game:state` | `ClientGameView` | Tam state güncellemesi |
| `game:turn` | `{ playerId, timeLimit, serverTime }` | Sıra değişti |
| `game:played` | `CardPlayedPayload` | Kart oynandı |
| `game:awaiting:target` | `{ playerId, validTargets, timeLimit }` | Hedef seçimi bekleniyor |
| `game:seal` | `{ playerId, sealedRank, stackSize }` | Mühür oluştu |
| `game:round:end` | `{ roundNumber, scores, nextRound }` | Tur bitti |
| `game:end` | `{ results, matchId, duration }` | Oyun bitti |

#### Matchmaking Events

| Event | Payload | When |
|-------|---------|------|
| `match:searching` | `{ position, estimatedWait? }` | Kuyrukta |
| `match:found` | `{ roomId }` | Eşleşme bulundu |
| `match:cancelled` | `{}` | İptal edildi |

#### Social Events

| Event | Payload | When |
|-------|---------|------|
| `social:friend:request` | `{ requestId, from, sentAt }` | İstek alındı |
| `social:friend:accepted` | `{ userId }` | İstek kabul edildi |
| `social:party:invite` | `{ inviteId, from, partyId }` | Parti daveti |
| `social:presence` | `{ userId, status }` | Arkadaş durumu değişti |

#### Chat Events

| Event | Payload | When |
|-------|---------|------|
| `chat:message` | `{ from, messageId, timestamp }` | Mesaj alındı |
| `chat:reaction` | `{ from, emojiId, timestamp }` | Emoji alındı |

---

### 3.4 Payload Structures

Tüm payload yapıları için bkz: **`docs/GameLogic.md - Section 10`**

#### Özet Referans

```typescript
// Temel Tipler
interface Card {
  id: string;        // "Q-hearts"
  suit: CardSuit;    // "hearts" | "diamonds" | "clubs" | "spades"
  rank: CardRank;    // "A" | "2" | ... | "K"
}

interface PublicPlayerState {
  id: string;
  nickname: string;
  cardCount: number;
  isReady: boolean;
  connectionStatus: ConnectionStatus;
  penaltySlot: PenaltySlotState;
  seatIndex: number;
}

interface PenaltySlotState {
  topCards: Card[];
  buriedCount: number;
  isSealed: boolean;
}

interface ClientGameView {
  roomId: string;
  phase: GamePhase;
  round: RoundState;
  myHand: Card[];
  myIndex: number;
  openCenter: { cards: (Card | null)[] };
  poolTopCard: Card | null;
  players: PublicPlayerState[];
  turn: TurnState;
  serverTime: string;
}
```

---

## 4. Backend REST API

### 4.1 Health Endpoints

#### GET /health

**Auth:** None  
**Description:** Basic health check

```json
// Response 200 OK
{
  "status": "ok",
  "timestamp": "2026-02-04T15:30:00.000Z",
  "version": "0.1.0"
}
```

#### GET /health/detailed

**Auth:** None  
**Description:** Detailed health with metrics

```json
// Response 200 OK
{
  "status": "ok",
  "timestamp": "2026-02-04T15:30:00.000Z",
  "version": "0.1.0",
  "uptime": 86400,
  "services": {
    "redis": "connected",
    "firebase": "connected"
  },
  "metrics": {
    "activeConnections": 150,
    "activeGames": 25,
    "playersInQueue": 12
  }
}
```

### 4.2 Admin Endpoints (Internal)

> ⚠️ Bu endpointler sadece internal admin key ile erişilebilir

#### GET /admin/stats

**Auth:** `X-Admin-Key: {ADMIN_KEY}`

```json
// Response 200 OK
{
  "totalUsers": 10500,
  "dailyActiveUsers": 1200,
  "gamesPlayedToday": 350,
  "averageGameDuration": 542,
  "peakConcurrentUsers": 450,
  "revenue": { "today": 0, "month": 0 }
}
```

#### POST /admin/ban

**Auth:** `X-Admin-Key: {ADMIN_KEY}`

```json
// Request
{
  "userId": "abc123xyz",
  "reason": "Cheating",
  "durationSeconds": 86400  // 0 = permanent
}

// Response 200 OK
{
  "success": true,
  "bannedUntil": "2026-02-05T15:30:00.000Z"
}
```

#### POST /admin/broadcast

**Auth:** `X-Admin-Key: {ADMIN_KEY}`

```json
// Request
{
  "message": "Server bakıma alınacak",
  "type": "warning" | "info" | "maintenance"
}

// Response 200 OK
{
  "success": true,
  "recipientCount": 150
}
```

---

## 5. Data Flow Diagrams

### 5.1 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌────────┐         ┌────────────┐         ┌────────────┐      │
│   │ Client │         │  Firebase  │         │  Backend   │      │
│   │(Flutter)│         │    Auth    │         │  (NestJS)  │      │
│   └───┬────┘         └─────┬──────┘         └─────┬──────┘      │
│       │                    │                      │              │
│       │  1. signInWithGoogle()                    │              │
│       │ ─────────────────► │                      │              │
│       │                    │                      │              │
│       │  2. ID Token       │                      │              │
│       │ ◄───────────────── │                      │              │
│       │                    │                      │              │
│       │  3. Connect with token                    │              │
│       │ ─────────────────────────────────────────►│              │
│       │                    │                      │              │
│       │                    │  4. verifyIdToken()  │              │
│       │                    │ ◄────────────────────│              │
│       │                    │                      │              │
│       │                    │  5. DecodedToken     │              │
│       │                    │ ────────────────────►│              │
│       │                    │                      │              │
│       │  6. 'connected' event                     │              │
│       │ ◄─────────────────────────────────────────│              │
│       │                    │                      │              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Game Session Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    GAME SESSION FLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Client A        Client B,C,D         Backend          Redis   │
│   (Host)          (Players)                                      │
│      │                 │                  │               │      │
│      │  room:create    │                  │               │      │
│      │ ───────────────────────────────────►               │      │
│      │                 │                  │               │      │
│      │                 │                  │  SET room:*   │      │
│      │                 │                  │ ─────────────►│      │
│      │                 │                  │               │      │
│      │  room:created   │                  │               │      │
│      │ ◄───────────────────────────────────               │      │
│      │                 │                  │               │      │
│      │                 │  room:join       │               │      │
│      │                 │ ─────────────────►               │      │
│      │                 │                  │               │      │
│      │  room:player:joined (broadcast)    │               │      │
│      │ ◄───────────────────────────────────               │      │
│      │                 │ ◄─────────────────               │      │
│      │                 │                  │               │      │
│      │      [... tüm oyuncular hazır olunca ...]         │      │
│      │                 │                  │               │      │
│      │  game:start (4 oyuncuya)           │               │      │
│      │ ◄───────────────────────────────────               │      │
│      │                 │ ◄─────────────────               │      │
│      │                 │                  │               │      │
│      │                 │                  │  SET game:*   │      │
│      │                 │                  │ ─────────────►│      │
│      │                 │                  │               │      │
│      │      [... oyun döngüsü ...]        │               │      │
│      │                 │                  │               │      │
│      │  game:end       │                  │               │      │
│      │ ◄───────────────────────────────────               │      │
│      │                 │ ◄─────────────────               │      │
│      │                 │                  │               │      │
│      │                 │                  │  DEL game:*   │      │
│      │                 │                  │ ─────────────►│      │
│      │                 │                  │               │      │
│      │                 │                  │  Firestore    │      │
│      │                 │                  │  (match save) │      │
│      │                 │                  │               │      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Turn Flow (Kart Oynama)

```
┌─────────────────────────────────────────────────────────────────┐
│                    TURN FLOW (CARD PLAY)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Active Player      Other Players        Backend       Redis   │
│        │                  │                  │             │     │
│        │  game:play       │                  │             │     │
│        │  {cardId,target?}│                  │             │     │
│        │ ────────────────────────────────────►             │     │
│        │                  │                  │             │     │
│        │                  │        ┌─────────┴──────────┐  │     │
│        │                  │        │ 1. Validate turn   │  │     │
│        │                  │        │ 2. Validate card   │  │     │
│        │                  │        │ 3. Find matches    │  │     │
│        │                  │        │ 4. Apply result    │  │     │
│        │                  │        │ 5. Check seal      │  │     │
│        │                  │        │ 6. Next turn       │  │     │
│        │                  │        └─────────┬──────────┘  │     │
│        │                  │                  │             │     │
│        │                  │                  │ UPDATE game │     │
│        │                  │                  │ ───────────►│     │
│        │                  │                  │             │     │
│        │  game:played (broadcast to room)    │             │     │
│        │ ◄────────────────────────────────────             │     │
│        │                  │ ◄──────────────────            │     │
│        │                  │                  │             │     │
│        │  game:turn (next player)            │             │     │
│        │ ◄────────────────────────────────────             │     │
│        │                  │ ◄──────────────────            │     │
│        │                  │                  │             │     │
│                                                                  │
│   [Eğer hedef seçimi gerekiyorsa]                               │
│        │                  │                  │             │     │
│        │  game:awaiting:target               │             │     │
│        │ ◄────────────────────────────────────             │     │
│        │                  │                  │             │     │
│        │  game:target     │                  │             │     │
│        │  {playerId}      │                  │             │     │
│        │ ────────────────────────────────────►             │     │
│        │                  │                  │             │     │
│        │  game:played     │                  │             │     │
│        │ ◄────────────────────────────────────             │     │
│        │                  │ ◄──────────────────            │     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.4 Matchmaking Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    MATCHMAKING FLOW                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Player 1-4          Backend               Redis               │
│       │                  │                    │                  │
│       │  match:queue     │                    │                  │
│       │  {type:'ranked'} │                    │                  │
│       │ ─────────────────►                    │                  │
│       │                  │                    │                  │
│       │                  │  ZADD queue:ranked │                  │
│       │                  │  userId score=ELO  │                  │
│       │                  │ ──────────────────►│                  │
│       │                  │                    │                  │
│       │  match:searching │                    │                  │
│       │  {position:12}   │                    │                  │
│       │ ◄─────────────────                    │                  │
│       │                  │                    │                  │
│       │      [... MatchmakingService her 1s ...]                │
│       │                  │                    │                  │
│       │                  │  ZRANGEBYSCORE     │                  │
│       │                  │  (ELO ± 100)       │                  │
│       │                  │ ──────────────────►│                  │
│       │                  │                    │                  │
│       │                  │  4 player found    │                  │
│       │                  │ ◄──────────────────│                  │
│       │                  │                    │                  │
│       │                  │  ZREM (remove 4)   │                  │
│       │                  │ ──────────────────►│                  │
│       │                  │                    │                  │
│       │                  │  CREATE room       │                  │
│       │                  │ ──────────────────►│                  │
│       │                  │                    │                  │
│       │  match:found     │                    │                  │
│       │  {roomId}        │                    │                  │
│       │ ◄─────────────────  (4 oyuncuya)      │                  │
│       │                  │                    │                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Authentication Flow

### 6.1 Supported Auth Methods

| Method | Provider | Backend Support |
|--------|----------|-----------------|
| Google Sign-In | Firebase Auth | ✅ Full |
| Apple Sign-In | Firebase Auth | ✅ Full |
| Anonymous | Firebase Auth | ✅ Full |
| Email/Password | Firebase Auth | ❌ Not planned |

### 6.2 Token Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    TOKEN LIFECYCLE                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   1. Client Firebase'den ID Token alır (1 saat geçerli)         │
│                                                                  │
│   2. Client her Socket.io bağlantısında token gönderir          │
│                                                                  │
│   3. Backend token'ı Firebase Admin SDK ile doğrular            │
│                                                                  │
│   4. Token süresi dolmadan (55 dk) client yeni token alır       │
│                                                                  │
│   5. Yeni token ile reconnect (veya token refresh event)        │
│                                                                  │
│   Timeline:                                                      │
│   ├─────────────────────────────────────────────────────────┤   │
│   │ 0 min          55 min        60 min                     │   │
│   │ Token alındı   Refresh       Token expired              │   │
│   │     │             │              │                      │   │
│   │     ▼             ▼              ▼                      │   │
│   │ [Connect]    [Get new]      [Force logout]              │   │
│   │             [Reconnect]                                 │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 First Login Flow

```
1. Client: Firebase Google Sign-In
2. Client: Get ID Token
3. Client: Connect to Backend with token
4. Backend: Verify token
5. Backend: Check if user exists in Firestore
   - YES: Load user data
   - NO: Create new user with default values
6. Backend: Send 'connected' event with userId
7. Client: Ready to play
```

---

## 7. Game Session Lifecycle

### 7.1 States

```
┌─────────────────────────────────────────────────────────────────┐
│                    GAME SESSION STATES                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐  │
│   │ WAITING │ ──► │ DEALING │ ──► │ PLAYING │ ──► │ROUND_END│  │
│   │         │     │         │     │         │     │         │  │
│   └─────────┘     └─────────┘     └────┬────┘     └────┬────┘  │
│        ▲                               │               │        │
│        │                               │               │        │
│        │         ┌─────────┐           │               │        │
│        └─────────│ PAUSED  │◄──────────┘               │        │
│                  │(DC wait)│                           │        │
│                  └─────────┘                           │        │
│                                                        │        │
│                  ┌─────────┐                           │        │
│                  │GAME_END │◄──────────────────────────┘        │
│                  │         │                                    │
│                  └─────────┘                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 State Descriptions

| State | Description | Allowed Actions |
|-------|-------------|-----------------|
| `WAITING` | Oyuncular bekleniyor, hazır olma | `room:ready`, `room:leave` |
| `DEALING` | Kartlar dağıtılıyor (3 faz) | None |
| `PLAYING` | Aktif oyun, sıra bazlı | `game:play`, `game:target` |
| `ROUND_END` | Tur bitti, skorlar hesaplanıyor | None |
| `PAUSED` | Oyuncu disconnect, 30s bekleme | Reconnect |
| `GAME_END` | Oyun bitti, sonuçlar | None (auto-cleanup) |

### 7.3 Disconnect Handling

```
Player disconnects during game:
│
├─► Game enters PAUSED state
├─► 30 second timer starts
├─► Other players notified
│
├─► IF player reconnects within 30s:
│   ├─► Resume game
│   └─► Send full game:state to reconnected player
│
└─► IF 30s passes:
    ├─► Bot takes over
    ├─► Game continues
    └─► Disconnected player gets AFK penalty
```

---

## 8. Error Codes & Responses

### 8.1 Error Payload Format

```typescript
interface ErrorPayload {
  code: string;
  message: string;
  timestamp: string;
  details?: Record<string, unknown>;
}
```

### 8.2 Error Code Reference

| Code | HTTP Equiv | Description | Client Action |
|------|------------|-------------|---------------|
| `ERR_INVALID_TOKEN` | 401 | Token geçersiz/expired | Re-authenticate |
| `ERR_TOKEN_EXPIRED` | 401 | Token süresi dolmuş | Refresh token |
| `ERR_BANNED` | 403 | Kullanıcı yasaklı | Show ban info |
| `ERR_ROOM_FULL` | 400 | Oda dolu (4/4) | Show error |
| `ERR_ROOM_NOT_FOUND` | 404 | Oda bulunamadı | Return to lobby |
| `ERR_NOT_IN_ROOM` | 400 | Odada değilsiniz | Return to lobby |
| `ERR_ALREADY_IN_ROOM` | 400 | Zaten bir odadasınız | Leave first |
| `ERR_NOT_YOUR_TURN` | 400 | Sıra sizde değil | Wait |
| `ERR_INVALID_CARD` | 400 | Geçersiz kart ID | Refresh state |
| `ERR_CARD_NOT_IN_HAND` | 400 | Kart elinizde yok | Refresh state |
| `ERR_INVALID_TARGET` | 400 | Geçersiz hedef | Show valid targets |
| `ERR_TARGET_REQUIRED` | 400 | Hedef seçilmeli | Show target selection |
| `ERR_GAME_NOT_STARTED` | 400 | Oyun başlamadı | Wait |
| `ERR_GAME_ALREADY_STARTED` | 400 | Oyun zaten başladı | Spectate or leave |
| `ERR_NOT_HOST` | 403 | Host değilsiniz | - |
| `ERR_NOT_READY` | 400 | Hazır değilsiniz | Toggle ready |
| `ERR_ALREADY_READY` | 400 | Zaten hazırsınız | - |
| `ERR_ALREADY_IN_QUEUE` | 400 | Zaten kuyrukta | Show position |
| `ERR_NOT_IN_QUEUE` | 400 | Kuyrukta değilsiniz | - |
| `ERR_RATE_LIMITED` | 429 | Rate limit aşıldı | Wait & retry |
| `ERR_MAINTENANCE` | 503 | Sunucu bakımda | Show message |
| `ERR_INTERNAL` | 500 | Sunucu hatası | Retry or report |

### 8.3 Error Response Examples

```json
// Token expired
{
  "code": "ERR_TOKEN_EXPIRED",
  "message": "Token süresi dolmuş, yeniden giriş yapın",
  "timestamp": "2026-02-04T15:30:00.000Z"
}

// Not your turn
{
  "code": "ERR_NOT_YOUR_TURN",
  "message": "Sıra sizde değil",
  "timestamp": "2026-02-04T15:30:00.000Z",
  "details": {
    "currentPlayerId": "player456",
    "yourId": "player123"
  }
}

// Rate limited
{
  "code": "ERR_RATE_LIMITED",
  "message": "Çok fazla istek, lütfen bekleyin",
  "timestamp": "2026-02-04T15:30:00.000Z",
  "details": {
    "retryAfter": 5,
    "limit": 60,
    "window": 60
  }
}
```

---

## 9. Rate Limiting

### 9.1 Limits by Action

| Action Category | Limit | Window | Reset |
|-----------------|-------|--------|-------|
| Socket events (general) | 60 | 1 min | Rolling |
| `game:play` | 30 | 1 min | Rolling |
| `chat:message` | 5 | 10 sec | Rolling |
| `chat:reaction` | 10 | 10 sec | Rolling |
| `room:create` | 5 | 1 min | Rolling |
| `room:join` | 10 | 1 min | Rolling |
| `match:queue` | 3 | 1 min | Rolling |
| `social:friend:add` | 10 | 1 hour | Rolling |

### 9.2 Rate Limit Response

Limit aşıldığında `error` event'i gönderilir:

```json
{
  "code": "ERR_RATE_LIMITED",
  "message": "Rate limit exceeded",
  "timestamp": "2026-02-04T15:30:00.000Z",
  "details": {
    "action": "chat:message",
    "limit": 5,
    "window": 10,
    "retryAfter": 3
  }
}
```

### 9.3 Backend Rate Limit Implementation

```typescript
// Redis-based rate limiting
async checkRateLimit(userId: string, action: string): Promise<boolean> {
  const key = `ratelimit:${userId}:${action}`;
  const config = RATE_LIMITS[action];
  
  const current = await this.redis.incr(key);
  
  if (current === 1) {
    await this.redis.expire(key, config.windowSeconds);
  }
  
  return current <= config.limit;
}
```

---

## Appendix A: Quick Socket.io Event Reference

### Client → Server

```
room:create      { type }
room:join        { roomId }
room:leave       {}
room:ready       {}

game:play        { cardId, targetSlotOwnerId? }
game:target      { playerId }

match:queue      { type }
match:cancel     {}

social:friend:add       { target }
social:friend:accept    { requestId }
social:friend:decline   { requestId }
social:party:invite     { userId }
social:party:accept     { inviteId }
social:party:leave      {}

chat:message     { messageId }
chat:reaction    { emojiId }
```

### Server → Client

```
connected                { userId, serverTime }
error                    { code, message, timestamp, details? }
kicked                   { reason }

room:created             { roomId, inviteCode? }
room:joined              RoomState
room:player:joined       { player }
room:player:left         { playerId, reason? }
room:player:ready        { playerId, ready }

game:start               { gameState }
game:state               ClientGameView
game:turn                { playerId, timeLimit, serverTime }
game:played              CardPlayedPayload
game:awaiting:target     { playerId, validTargets, timeLimit }
game:seal                { playerId, sealedRank, stackSize }
game:round:end           { roundNumber, scores, nextRound }
game:end                 { results, matchId, duration }

match:searching          { position, estimatedWait? }
match:found              { roomId }
match:cancelled          {}

social:friend:request    { requestId, from, sentAt }
social:party:invite      { inviteId, from, partyId }
social:presence          { userId, status }

chat:message             { from, messageId, timestamp }
chat:reaction            { from, emojiId, timestamp }
```

---

## Appendix B: Environment Variables

### Backend Required

```env
# Server
PORT=3000
NODE_ENV=production

# Firebase Admin
FIREBASE_PROJECT_ID=bluffbuddy-prod
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Redis
REDIS_URL=redis://localhost:6379

# Security
ADMIN_API_KEY=your-secret-admin-key
ALLOWED_ORIGINS=https://bluffbuddy.com

# Rate Limiting
RATE_LIMIT_ENABLED=true
```

---

*Document Version: 2.0 | Last Updated: February 2026*
