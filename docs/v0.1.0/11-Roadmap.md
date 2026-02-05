# 11 - Product Roadmap & Versioning Strategy

> **Owner:** Product Manager / Lead Architect  
> **Last Updated:** February 2026  
> **Status:** Living Document

---

## Executive Summary

This roadmap synthesizes:
1. **Current TODOs** in the code skeleton (`// TODO vX.X.X` comments)
2. **Sprint tasks** from `00-DeveloperTasks.md`
3. **"Future" sections** from documentation files 07-Social and 08-Monetization
4. **Gap analysis** from the Reality Check review

---

## Version Overview

| Version | Codename | Target | Focus |
|---------|----------|--------|-------|
| **v0.1.0** | *Foundation* | Sprint 1 (Current) | Core game playable, 4-player match |
| **v0.2.0** | *Polish* | Sprint 2 | UX improvements, social features |
| **v0.3.0** | *Scale* | Sprint 3 | Security hardening, performance |
| **v1.0.0** | *Launch* | Q2 2026 | Production release, app stores |
| **v1.1.0** | *Engage* | Q3 2026 | Battle Pass, advanced features |

---

## v0.1.0 — Foundation (Current Sprint)

> **Goal:** A complete 4-player game session from matchmaking to final scores.
> **Success Criteria:** 4 devs can play a full game on staging server.

### Week 1-2: Core Infrastructure

| Task | Owner | File(s) | Status | Source |
|------|-------|---------|--------|--------|
| **Define shared contracts** | ALL | `src/shared/contracts.ts` | ✅ Done | Gap Analysis |
| Docker + Redis setup | DEV1 | `docker-compose.yml` | ⬜ TODO | 00-DeveloperTasks |
| Socket.io server config | DEV1 | `infrastructure/adapters/custom-io.adapter.ts` | ⬜ TODO | 05-Networking |
| Firebase Admin SDK | DEV3 | `auth/services/firebase.service.ts` | ⬜ TODO | 00-DeveloperTasks |
| **Event constants enum** | DEV1 | `shared/constants/events.constants.ts` | ⬜ TODO | Code Skeleton |
| User repository interface impl | DEV3 | `database/services/user.repository.ts` | ⬜ TODO | Code Skeleton |

### Week 2-3: Game Engine Core

| Task | Owner | File(s) | Status | Source |
|------|-------|---------|--------|--------|
| Deck creation + Fisher-Yates shuffle | DEV2 | `game/services/game.service.ts` | ✅ Partial | 03-GameEngine |
| State Machine (phases) | DEV2 | `game/services/state.service.ts` | ✅ Partial | 03-GameEngine §3 |
| Card dealing (3 rounds × 4 cards) | DEV2 | `game/services/game.service.ts` | ⬜ TODO | 03-GameEngine §4 |
| **Match detection with PLAYER CHOICE** | DEV2 | `game/services/matching.service.ts` | ⬜ TODO | 03-GameEngine §5 |
| **Mühür (Seal) algorithm** | DEV2 | `game/services/seal.service.ts` | ✅ Partial | 03-GameEngine §6 |
| **Memory Penalty handling** | DEV2 | `game/services/game.service.ts` | ⬜ TODO | 03-GameEngine §8.2 |
| State masking (anti-cheat) | DEV2 | `game/services/state.service.ts` | ⬜ TODO | 03-GameEngine §8 |
| Turn timer service | DEV2 | `game/services/timer.service.ts` | ⬜ TODO | Code Skeleton |

### Week 3-4: Networking & Data

| Task | Owner | File(s) | Status | Source |
|------|-------|---------|--------|--------|
| Gateway connection handlers | DEV2 | `game/gateways/game.gateway.ts` | ⬜ TODO v0.1.1 | Code Skeleton |
| Room create/join handlers | DEV2 | `game/gateways/game.gateway.ts` | ⬜ TODO | 05-Networking §4 |
| **Clock sync implementation** | DEV1 | `infrastructure/services/clock-sync.service.ts` | ⬜ TODO | 05-Networking §7 |
| Match repository save | DEV3 | `database/services/match.repository.ts` | ⬜ TODO v0.1.1 | Code Skeleton |
| Redis state persistence | DEV1+3 | `infrastructure/services/redis.service.ts` | ⬜ TODO | 04-Database |
| Basic matchmaking queue | DEV2 | `game/services/matchmaking.service.ts` | ⬜ TODO | 05-Networking |

### v0.1.0 Blockers (Must Fix Before Merge)

1. **`IUserRepository` not implemented** — DEV2 cannot write GameService tests
2. **Event constants empty** — String typos will cause silent failures
3. **No error codes enum** — Inconsistent error handling between devs

---

## v0.2.0 — Polish (Sprint 2)

> **Goal:** Production-quality UX with social features.
> **Success Criteria:** 20 beta testers play without major bugs.

### Social Features (DEV3 Priority)

| Feature | File(s) | Extracted From |
|---------|---------|----------------|
| Friends system (add/remove/block) | `social/services/friend.service.ts` | 07-Social §2 |
| Friend request flow | `social/services/friend.service.ts` | 07-Social §2.1 |
| Party system (create/invite/leave) | `social/services/party.service.ts` | 07-Social §3 |
| **Quick Chat service** | `social/services/chat.service.ts` | 07-Social §5 |
| **Emoji reactions** | `social/services/chat.service.ts` | 07-Social §5 |
| Presence system (online/in-game) | `social/services/presence.service.ts` | 07-Social §4 |
| Chat rate limiting | `social/services/chat.service.ts` | 07-Social §5 |

### UX Improvements (Code TODO Analysis)

| Feature | File | TODO Comment |
|---------|------|--------------|
| Better error messages | Multiple | `TODO v0.2.0` throughout |
| Animation state support | `shared/types/game/enums.ts` | `TODO v0.1.1: Add card animation states` |
| Spectator mode support | `game/gateways/game.gateway.ts` | `TODO v0.2.0: Add spectator mode` |
| Profile caching | `auth/services/user.service.ts` | `TODO v0.1.2: Add profile caching` |
| Avatar upload support | `auth/services/user.service.ts` | `TODO v0.2.0: Add avatar upload` |

### Data & Analytics

| Feature | File(s) | Source |
|---------|---------|--------|
| Player match history | `database/services/match.repository.ts` | `TODO v0.2.0` |
| User statistics | `database/services/user.repository.ts` | `TODO v0.2.0` |
| Replay system (basic) | `game/services/replay.service.ts` | 07-Social §6 |
| Leaderboard (global) | `database/services/leaderboard.repository.ts` | 07-Social §7 |

---

## v0.3.0 — Scale (Sprint 3)

> **Goal:** Security hardening and performance optimization.
> **Success Criteria:** 1000 concurrent users, <100ms p95 latency.

### Security Hardening

| Feature | Priority | Source |
|---------|----------|--------|
| Rate limiting middleware (WebSocket) | 🔴 Critical | 05-Networking §5 |
| Bot detection service | 🟡 High | 06-ELO-Rating |
| Collusion detection (basic) | 🟢 Normal | 00-DeveloperTasks |
| Input sanitization audit | 🟡 High | Security Best Practice |
| Token refresh mechanism | 🟡 High | 02-Architecture |

### Performance

| Feature | Priority | Source |
|---------|----------|--------|
| State serialization optimization | 🟡 High | 05-Networking §8 |
| Binary payload support | 🟢 Normal | `TODO v0.2.0` in payloads |
| Redis connection pooling | 🟡 High | 04-Database |
| Message compression | 🟢 Normal | 05-Networking §2.1 |

### Monitoring & Ops

| Feature | File(s) | Source |
|---------|---------|--------|
| Metrics service (Prometheus) | `infrastructure/services/metrics.service.ts` | Exists (empty) |
| Health check endpoints | `infrastructure/services/health.service.ts` | Exists (empty) |
| Pino logging configuration | Multiple | 00-DeveloperTasks |
| Error tracking (Sentry) | N/A | Infrastructure |

---

## v1.0.0 — Launch (Q2 2026)

> **Goal:** App Store release.
> **Success Criteria:** Passing Apple/Google review, <1% crash rate.

### IAP Integration (DEV3)

| Feature | File(s) | Source |
|---------|---------|--------|
| Apple App Store verification | `economy/services/apple-verifier.service.ts` | 08-Monetization §5 |
| Google Play verification | `economy/services/google-verifier.service.ts` | 08-Monetization §6 |
| Server-side receipt validation | `economy/services/iap.service.ts` | 08-Monetization §4 |
| Wallet service | `economy/services/wallet.service.ts` | 08-Monetization §2.3 |
| Transaction ledger | `economy/services/ledger.service.ts` | 08-Monetization §7 |
| Gem/Coin economy | `economy/services/chip.service.ts` | 08-Monetization §2 |

### Production Requirements

| Requirement | Status | Notes |
|-------------|--------|-------|
| SSL/TLS certificates | ⬜ | Caddy auto-SSL |
| CDN for static assets | ⬜ | Cloudflare R2 |
| Database backups | ⬜ | Firestore automatic |
| CI/CD pipeline | ⬜ | GitHub Actions |
| Privacy policy compliance | ⬜ | GDPR/CCPA |
| App Store assets | ⬜ | Screenshots, descriptions |

---

## v1.1.0+ — Engage (Future Roadmap)

> Features extracted from documentation "Nice to Have" and "Future" sections.

### Battle Pass System (08-Monetization §1)

```
┌─────────────────────────────────────────────────────────────────┐
│   BATTLE PASS (v1.1.0)                                          │
├─────────────────────────────────────────────────────────────────┤
│   • Seasonal content (3-month seasons)                          │
│   • Free track + Premium track ($4.99)                          │
│   • XP-based progression                                        │
│   • Exclusive cosmetics rewards                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Tournament System (v1.2.0)

| Feature | Complexity | Notes |
|---------|------------|-------|
| Tournament brackets | High | Requires scheduling service |
| Entry fees (gems) | Medium | Uses existing wallet |
| Prize pools | Medium | Gem distribution |
| Tournament leaderboards | Low | Extension of existing |

### Advanced Social (v1.2.0+)

| Feature | Source |
|---------|--------|
| Clubs/Guilds | 07-Social "Future" |
| Club leaderboards | 07-Social "Future" |
| Friend suggestions | `TODO v0.2.0` in code |
| Social achievements | 07-Social "Future" |

### Scaling (v1.3.0+)

| Feature | Trigger | Notes |
|---------|---------|-------|
| Horizontal scaling | >5000 CCU | Add more server instances |
| Redis Cluster | >10000 CCU | Replace single Redis |
| Database sharding | >1M users | Firestore collection groups |
| Geographic distribution | Global launch | Multi-region deployment |

---

## Appendix A: TODO Comment Inventory

Extracted from code skeleton using `grep "TODO"`:

| Version | Count | Files |
|---------|-------|-------|
| `v0.1.0` | 8 | events.constants.ts, game.gateway.ts, ... |
| `v0.1.1` | 23 | user.repository.ts, match.repository.ts, friend.service.ts, ... |
| `v0.1.2` | 6 | friend.service.ts, user.service.ts, ... |
| `v0.2.0` | 15 | enums.ts, payloads/index.ts, ... |
| `v0.3.0` | 2 | match.repository.ts |

**Observation:** 23 tasks marked `v0.1.1` should likely be `v0.1.0` per the sprint plan.

---

## Appendix B: Developer Dependencies

```
          ┌─────────────────────────────────────────┐
          │         DEPENDENCY GRAPH                 │
          └─────────────────────────────────────────┘
          
    ┌──────────┐
    │ contracts│ ◄─────── ALL DEVS import from here
    │   .ts    │
    └────┬─────┘
         │
    ┌────┴────┬────────────┬────────────┐
    │         │            │            │
    ▼         ▼            ▼            ▼
┌───────┐ ┌───────┐ ┌──────────┐ ┌──────────┐
│ DEV1  │ │ DEV2  │ │  DEV3    │ │  DEV3    │
│Socket │ │ Game  │ │  User    │ │  Match   │
│Events │ │Engine │ │  Repo    │ │  Repo    │
└───────┘ └───┬───┘ └────┬─────┘ └────┬─────┘
              │          │            │
              │    ┌─────┴────────────┘
              │    │
              ▼    ▼
         ┌─────────────┐
         │ Integration │
         │   Tests     │
         └─────────────┘
```

---

## Appendix C: Risk Mitigation

| Risk | Version | Mitigation |
|------|---------|------------|
| Interface mismatch at merge | v0.1.0 | `contracts.ts` as single source |
| Feature creep | All | Strict version scoping |
| Security vulnerabilities | v0.3.0 | Dedicated security sprint |
| App Store rejection | v1.0.0 | Pre-submission checklist |
| Scale issues at launch | v1.0.0+ | Load testing before release |

---

*Document Version: 1.0 | Last Updated: February 2026*
