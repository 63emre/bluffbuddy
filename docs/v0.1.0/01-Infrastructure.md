# 01 - Infrastructure & Server Planning

> **Owner:** Developer 1 (DevOps)  
> **Last Updated:** February 2026  
> **Status:** Specification

---

## Table of Contents

1. [Overview](#1-overview)
2. [Server Selection](#2-server-selection)
3. [Capacity Planning](#3-capacity-planning)
4. [Operating System Optimization](#4-operating-system-optimization)
5. [Network Configuration](#5-network-configuration)
6. [Cost Analysis](#6-cost-analysis)
7. [Scaling Strategy](#7-scaling-strategy)

---

## 1. Overview

BluffBuddy Online requires a high-performance, low-latency game server capable of handling real-time multiplayer card games. The infrastructure must support:

- **250 Concurrent Users (CCU)** target
- **€12/month** budget constraint
- **Authoritative Server** architecture (all game logic server-side)
- **Low latency** WebSocket connections
- **Anti-cheat** through server-side validation

### Key Constraints

| Constraint | Value | Impact |
|------------|-------|--------|
| Monthly Budget | €12 | Limits server tier selection |
| Target CCU | 250 | Determines memory/CPU requirements |
| Game Type | Real-time card game | Requires WebSocket, low latency |
| Architecture | Authoritative | Higher CPU usage for validation |

---

## 2. Server Selection

### 2.1 Candidate Comparison

Based on Hetzner Cloud offerings (Q1 2026), three candidates were evaluated:

| Server | Architecture | vCPU | RAM | Storage (NVMe) | Monthly Cost | Status |
| ------- | ----------- | ---- | --- | -------------- | ------------ | ------ |
| **CPX21** | AMD EPYC (x86) | 3 | 4 GB | 80 GB | €7.55 | ✅ **SELECTED** |
| CAX21 | Ampere Altra (ARM64) | 4 | 8 GB | 80 GB | €6.49 | ❌ Compatibility risks |
| CX31 | Intel (x86) | 2 | 8 GB | 80 GB | €10.60 | ❌ Insufficient vCPU |

### 2.2 Selection Rationale: CPX21

**Why CPX21 was chosen:**

1. **x86 Compatibility**
   - Native Node.js addons (`bcrypt`, `sharp`, cryptographic libraries) have pre-built binaries for x86
   - No multi-arch Docker build complexity
   - Eliminates risk of segmentation faults from ARM compilation issues

2. **Optimal vCPU Count**
   - 3 vCPUs provide parallelism for:
     - Node.js main event loop
     - Database connection pool management
     - OS-level operations (Docker daemon, SSH, logging)
   - Node.js is single-threaded but benefits from OS-level parallelism

3. **Budget Margin**
   - €7.55 cost leaves €4.45 operational margin
   - Margin can be used for:
     - Additional storage volumes (logs, backups)
     - Automated snapshots
     - Floating IP address

4. **AMD EPYC Performance**
   - High single-core performance critical for Node.js event loop
   - Modern IPC (Instructions Per Cycle) efficiency

### 2.3 Why NOT ARM (CAX21)

Despite better price/performance ratio, ARM was rejected due to:

```
Risk Assessment: ARM64 on Node.js Game Server
├── npm packages with native bindings may fail
├── CI/CD requires multi-arch builds (complexity)
├── Some cryptographic libraries lack ARM optimization
└── Production debugging more difficult
```

---

## 3. Capacity Planning

### 3.1 Memory Consumption Model

Socket.io-based real-time applications have memory that scales linearly with connected clients.

#### Per-Connection Memory Breakdown

| Component | Memory per User | Notes |
|-----------|-----------------|-------|
| Socket.io connection | 15-20 KB | Base WebSocket overhead |
| User session data | 50-100 KB | Auth tokens, preferences |
| Game state reference | 200-400 KB | Active game room pointer |
| Buffers & queues | 100-200 KB | Message queues, serialization |
| **Total per User** | **~500 KB - 1 MB** | Conservative estimate |

#### Total Memory Calculation

```
Memory Budget Analysis for 250 CCU:
=====================================

User Sessions:
  250 users × 750 KB (average) = 187.5 MB

Node.js Runtime:
  V8 Engine Heap                = 200 MB
  Application Code              = 100 MB
  Subtotal                      = 300 MB

Operating System:
  Docker daemon                 = 150 MB
  Linux kernel + services       = 200 MB
  SSH, logging agents           = 150 MB
  Subtotal                      = 500 MB

TOTAL ESTIMATED USAGE           = ~1,000 MB (1 GB)
AVAILABLE (CPX21)               = 4,096 MB (4 GB)
FREE CAPACITY                   = ~3 GB (75%)
```

#### Memory Safety Margin

The 75% free capacity ensures:
- Garbage Collection runs without performance degradation
- Traffic spikes can be absorbed
- Optional Redis cache can run on same server
- Room for memory leaks before OOM (Out of Memory)

### 3.2 CPU Utilization Model

Node.js game servers are **CPU-bound** during:
- Game state validation
- Seal algorithm calculations
- JSON serialization/deserialization
- Cryptographic operations (JWT verification)

#### Expected CPU Profile

```
CPU Usage Distribution (250 CCU):
==================================
[Event Loop Processing]     40%
[JSON Serialization]        20%
[Game Logic (Seal, Match)]  15%
[Crypto (JWT, Auth)]        10%
[I/O Wait (Firestore)]      10%
[OS Overhead]                5%
----------------------------------
Total Average Load:        ~60-70%
Peak Load (All games end):  ~90%
```

**3 vCPUs provide sufficient headroom** for peak scenarios.

---

## 4. Operating System Optimization

### 4.1 Kernel Parameters

Default Linux kernel settings are NOT optimized for high-concurrency WebSocket servers. Apply the following to `/etc/sysctl.conf`:

```bash
# /etc/sysctl.conf - BluffBuddy Server Optimizations

# =============================================
# FILE DESCRIPTORS
# =============================================
# Each WebSocket connection consumes a file descriptor
# Default limit (1024) is insufficient for 250+ connections
fs.file-max = 100000

# =============================================
# TCP KEEPALIVE
# =============================================
# Mobile clients frequently switch networks (WiFi ↔ 4G)
# Aggressive keepalive detects dead connections faster

# Start keepalive probes after 60 seconds of idle
net.ipv4.tcp_keepalive_time = 60

# Send probe every 10 seconds
net.ipv4.tcp_keepalive_intvl = 10

# Consider connection dead after 6 failed probes (60 seconds total)
net.ipv4.tcp_keepalive_probes = 6

# =============================================
# PORT RANGE
# =============================================
# Outgoing connections (to Firestore, Apple/Google APIs)
# need ephemeral ports. Expand range to prevent exhaustion
net.ipv4.ip_local_port_range = 1024 65535

# =============================================
# CONNECTION TRACKING
# =============================================
# Increase connection tracking table for NAT/firewall
net.netfilter.nf_conntrack_max = 65536

# =============================================
# SOCKET BUFFERS
# =============================================
# Increase socket buffer sizes for WebSocket traffic
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
```

### 4.2 Apply Changes

```bash
# Apply immediately without reboot
sudo sysctl -p

# Verify settings
sysctl fs.file-max
sysctl net.ipv4.tcp_keepalive_time
```

### 4.3 User Limits

Edit `/etc/security/limits.conf`:

```bash
# Increase file descriptor limits for the application user
node soft nofile 65535
node hard nofile 65535

# Or for all users
* soft nofile 65535
* hard nofile 65535
```

### 4.4 Systemd Service Limits

If running Node.js via systemd, add to service file:

```ini
[Service]
LimitNOFILE=65535
LimitNPROC=65535
```

---

## 5. Network Configuration

### 5.1 Firewall Rules (ufw)

```bash
# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# SSH (restrict to your IP if possible)
sudo ufw allow 22/tcp

# HTTP/HTTPS (for health checks, future web panel)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# WebSocket port (if not using 80/443)
sudo ufw allow 3000/tcp

# Enable firewall
sudo ufw enable
```

### 5.2 Recommended: Cloudflare Proxy

For DDoS protection and SSL termination:

```
[Client] → [Cloudflare] → [Hetzner Server]
                ↓
         SSL Termination
         DDoS Protection
         WebSocket Support ✓
```

**Cloudflare Configuration:**
- Enable WebSocket support (free tier)
- Use "Full (Strict)" SSL mode
- Enable "Under Attack" mode if needed

### 5.3 Network Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                 │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE (Optional)                        │
│  • SSL Termination  • DDoS Protection  • WebSocket Proxy        │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                 HETZNER CPX21 (€7.55/mo)                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    DOCKER HOST                            │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │           bluffbuddy-backend:latest                │  │   │
│  │  │  • NestJS Application                              │  │   │
│  │  │  • Socket.io Gateway (:3000)                       │  │   │
│  │  │  • Game Engine                                     │  │   │
│  │  └────────────────────────┬───────────────────────────┘  │   │
│  │                           │                               │   │
│  │  ┌────────────────────────▼───────────────────────────┐  │   │
│  │  │              redis:alpine (MANDATORY)              │  │   │
│  │  │  • Game State Persistence (Crash Recovery)         │  │   │
│  │  │  • Session Cache                                   │  │   │
│  │  │  • Pub/Sub (future scaling)                        │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   OUTBOUND CONNECTIONS                    │   │
│  │  → Firebase Firestore (Google Cloud)                      │   │
│  │  → Firebase Auth (Google Cloud)                           │   │
│  │  → Apple App Store API (IAP verification)                 │   │
│  │  → Google Play API (IAP verification)                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5.4 Redis - Game State Persistence (MANDATORY)

> ⚠️ **CRITICAL: Redis is MANDATORY, not optional!**
>
> Without Redis, a server crash/restart will lose ALL active games in progress.
> This is unacceptable for a competitive game where players invest time and potentially money.

### Why Redis is Required

```
┌─────────────────────────────────────────────────────────────────┐
│                  CRASH RECOVERY ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   WITHOUT REDIS (UNACCEPTABLE):                                 │
│   ──────────────────────────────                                │
│   Game State → RAM only                                         │
│   Server crashes → ALL GAMES LOST 💀                            │
│   Players reconnect → "Game not found" error                    │
│   Players RAGE → Bad reviews, refund requests                   │
│                                                                  │
│   ─────────────────────────────────────────────────────────────  │
│                                                                  │
│   WITH REDIS (REQUIRED):                                        │
│   ──────────────────────                                        │
│   Game State → RAM (fast) + Redis (persistent)                  │
│   Server crashes → Redis retains game state                     │
│   Server restarts → Hydrates games from Redis                   │
│   Players reconnect → Resume exactly where they left off ✓      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Redis Configuration

```yaml
# docker-compose.yml
services:
  redis:
    image: redis:7-alpine
    container_name: bluffbuddy-redis
    restart: always
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy volatile-lru
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  redis_data:
```

### Game State Persistence Strategy

```typescript
// services/game-state-persistence.service.ts

const GAME_STATE_TTL = 3600; // 1 hour (max game duration + buffer)
const SAVE_INTERVAL_MS = 5000; // Save every 5 seconds during active game

interface RedisPersistence {
  // Save game state to Redis
  saveGameState(roomId: string, state: GameState): Promise<void>;
  
  // Load game state from Redis (on server restart)
  loadGameState(roomId: string): Promise<GameState | null>;
  
  // Delete game state (on game completion)
  deleteGameState(roomId: string): Promise<void>;
  
  // Get all active game room IDs
  getAllActiveRoomIds(): Promise<string[]>;
}

@Injectable()
export class GameStatePersistenceService implements RedisPersistence {
  constructor(private readonly redis: Redis) {}

  async saveGameState(roomId: string, state: GameState): Promise<void> {
    const key = `game:state:${roomId}`;
    const serialized = this.serializeState(state);
    
    await this.redis.setex(key, GAME_STATE_TTL, serialized);
    
    // Also track active room IDs
    await this.redis.sadd('game:active_rooms', roomId);
  }

  async loadGameState(roomId: string): Promise<GameState | null> {
    const key = `game:state:${roomId}`;
    const data = await this.redis.get(key);
    
    if (!data) return null;
    
    return this.deserializeState(data);
  }

  async hydrateAllGames(): Promise<Map<string, GameState>> {
    const roomIds = await this.redis.smembers('game:active_rooms');
    const games = new Map<string, GameState>();
    
    for (const roomId of roomIds) {
      const state = await this.loadGameState(roomId);
      if (state) {
        games.set(roomId, state);
      } else {
        // State expired but room ID still in set - clean up
        await this.redis.srem('game:active_rooms', roomId);
      }
    }
    
    return games;
  }

  private serializeState(state: GameState): string {
    // Convert Maps to arrays for JSON serialization
    return JSON.stringify({
      ...state,
      hands: Array.from(state.hands.entries()),
      penaltySlots: Array.from(state.penaltySlots.entries()),
      cardLocations: Array.from(state.cardLocations.entries()),
    });
  }

  private deserializeState(data: string): GameState {
    const parsed = JSON.parse(data);
    return {
      ...parsed,
      hands: new Map(parsed.hands),
      penaltySlots: new Map(parsed.penaltySlots),
      cardLocations: new Map(parsed.cardLocations),
    };
  }
}
```

### Server Startup - Game Hydration

```typescript
// main.ts or app.module.ts

@Injectable()
export class GameHydrationService implements OnApplicationBootstrap {
  constructor(
    private readonly persistence: GameStatePersistenceService,
    private readonly gameEngine: GameEngineService,
    private readonly logger: Logger,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('🔄 Hydrating active games from Redis...');
    
    const games = await this.persistence.hydrateAllGames();
    
    if (games.size === 0) {
      this.logger.log('✅ No active games to hydrate');
      return;
    }
    
    for (const [roomId, state] of games) {
      this.gameEngine.restoreGame(roomId, state);
      this.logger.log(`✅ Restored game: ${roomId} (Phase: ${state.phase})`);
    }
    
    this.logger.log(`✅ Hydrated ${games.size} active games`);
  }
}
```

### Memory Budget Update (with Redis)

```
Memory Budget Analysis (with Redis):
====================================

User Sessions:
  250 users × 750 KB (average)    = 187.5 MB

Node.js Runtime:
  V8 Engine Heap                  = 200 MB
  Native Code + Libraries         = 100 MB
  Subtotal                        = 300 MB

Redis:
  In-container Redis              = 256 MB (capped)
  
Operating System:
  Docker daemon                   = 150 MB
  OS overhead                     = 200 MB
  SSH, monitoring                 = 50 MB
  Subtotal                        = 400 MB

TOTAL ESTIMATED USAGE             = ~1,150 MB (1.15 GB)
AVAILABLE (CPX21)                 = 4,096 MB (4 GB)
FREE CAPACITY                     = ~2.9 GB (72%)
```

---

## 6. Cost Analysis

### 6.1 Monthly Budget Breakdown

| Item | Cost | Notes |
|------|------|-------|
| CPX21 Server | €7.55 | 3 vCPU, 4GB RAM, 80GB NVMe |
| Automated Backups | €1.51 | 20% of server cost |
| Floating IP (optional) | €0.00 | First one free |
| **Subtotal** | **€9.06** | |
| **Remaining Budget** | **€2.94** | For volumes, snapshots |

### 6.2 External Services (Not in Hetzner Budget)

| Service | Cost | Notes |
|---------|------|-------|
| Firebase Firestore | $0-25/mo | Spark (free) or Blaze (pay-as-you-go) |
| Firebase Auth | Free | Up to 50k MAU |
| Cloudflare | Free | Free tier sufficient |
| Domain | ~€10/year | Optional |

### 6.3 Firestore Cost Optimization

⚠️ **Critical:** Firestore charges per read/write. Unoptimized usage can exceed budget!

**Strategy:** Minimize database writes during gameplay.

| Operation | Naive Approach | Optimized Approach |
|-----------|----------------|-------------------|
| Save game state | Every move (100+ writes/game) | Game end only (1 write/game) |
| Update ELO | Per game per player (4 writes) | Batch in transaction (1 write) |
| Read user profile | Every connection | Cache in memory |

**Estimated Firestore Usage (250 CCU, optimized):**
- Reads: ~50,000/day (within free tier)
- Writes: ~5,000/day (within free tier)

---

## 7. Scaling Strategy

### 7.1 Current Limits (Single CPX21)

| Metric | Comfortable | Maximum |
|--------|-------------|---------|
| CCU | 250 | 400-500 |
| Active Games | 62 | 100-125 |
| Games/Hour | ~120 | ~200 |

### 7.2 Horizontal Scaling Path

When exceeding single-server capacity:

```
Phase 1: Single Server (Current)
================================
[Load Balancer] → [CPX21]
                     ↓
              [Firestore]

Phase 2: Multi-Server (Future)
===============================
                    ┌──→ [CPX21 #1] ──┐
[Load Balancer] ────┼──→ [CPX21 #2] ──┼──→ [Firestore]
                    └──→ [CPX21 #3] ──┘
                            ↓
                    [Redis Cluster]
                    (Session Affinity)
```

### 7.3 Scaling Triggers

| Metric | Threshold | Action |
|--------|-----------|--------|
| CPU Usage | >80% sustained | Add server |
| Memory Usage | >85% | Add server |
| Avg Latency | >100ms | Investigate/scale |
| CCU | >400 | Add server |

### 7.4 Vertical Scaling Option

Before horizontal scaling, consider upgrading:

| Server | vCPU | RAM | Cost | CCU Capacity |
|--------|------|-----|------|--------------|
| CPX21 | 3 | 4 GB | €7.55 | ~250 |
| CPX31 | 4 | 8 GB | €14.00 | ~500 |
| CPX41 | 8 | 16 GB | €26.50 | ~1000 |

---

## 8. Checklist: Server Setup

### Initial Setup

- [ ] Create Hetzner Cloud account
- [ ] Deploy CPX21 in closest datacenter (fsn1 for EU)
- [ ] Set up SSH key authentication
- [ ] Disable password login
- [ ] Configure firewall (ufw)
- [ ] Apply sysctl optimizations
- [ ] Install Docker & Docker Compose
- [ ] Set up automatic security updates

### Application Deployment

- [ ] Pull Docker image from registry
- [ ] Configure environment variables
- [ ] Set up Docker log rotation
- [ ] Configure systemd for auto-restart
- [ ] Set up monitoring (optional: Prometheus/Grafana)
- [ ] Configure backup schedule

### Monitoring

- [ ] Set up uptime monitoring (UptimeRobot - free)
- [ ] Configure resource alerts (Hetzner Cloud)
- [ ] Set up error logging (application level)

---

## References

- [Hetzner Cloud CPX21 Specs](https://www.hetzner.com/cloud)
- [Socket.io Memory Usage](https://socket.io/docs/v4/memory-usage/)
- [Linux TCP Tuning Guide](https://www.kernel.org/doc/Documentation/networking/ip-sysctl.txt)
- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

---

*Document Version: 1.0 | Last Updated: February 2026*
