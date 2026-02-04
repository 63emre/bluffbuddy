# 06 - ELO Rating System

> **Owner:** Developer 2 (Game Engine)  
> **Last Updated:** February 2026  
> **Status:** Specification

---

## Table of Contents

1. [Overview](#1-overview)
2. [Standard ELO Basics](#2-standard-elo-basics)
3. [4-Player FFA Adaptation](#3-4-player-ffa-adaptation)
4. [K-Factor Configuration](#4-k-factor-configuration)
5. [Rank System](#5-rank-system)
6. [Implementation](#6-implementation)
7. [Anti-Abuse Measures](#7-anti-abuse-measures)

---

## 1. Overview

BluffBuddy uses a modified **ELO rating system** adapted for 4-player Free-For-All (FFA) matches. Unlike traditional chess ELO (1v1), our system treats each game as a series of pairwise comparisons.

### Goals

- **Skill Representation:** Rating accurately reflects player skill
- **Fair Matchmaking:** Similar-rated players compete together
- **Volatility Control:** New players calibrate quickly; veterans are stable
- **Anti-Abuse:** Prevent rating manipulation through collusion or smurfing

### Rating Scale

| Rating Range | Interpretation |
|--------------|----------------|
| < 800 | Beginner |
| 800 - 1199 | Below Average |
| 1200 (default) | Average |
| 1200 - 1599 | Above Average |
| 1600 - 1999 | Skilled |
| 2000+ | Expert |

---

## 2. Standard ELO Basics

### 2.1 Expected Score Formula

In standard ELO, the expected score of Player A against Player B:

$$E_A = \frac{1}{1 + 10^{(R_B - R_A) / 400}}$$

Where:
- $R_A$ = Rating of Player A
- $R_B$ = Rating of Player B
- $E_A$ = Expected score (0 to 1)

### 2.2 Rating Update Formula

After a match:

$$R'_A = R_A + K \times (S_A - E_A)$$

Where:
- $R'_A$ = New rating
- $R_A$ = Old rating
- $K$ = K-factor (volatility constant)
- $S_A$ = Actual score (1 for win, 0.5 for draw, 0 for loss)
- $E_A$ = Expected score

---

## 3. 4-Player FFA Adaptation

### 3.1 The Challenge

Standard ELO handles 1v1. In a 4-player game, we need to:
1. Determine who "beat" whom
2. Calculate expected scores against multiple opponents
3. Weight the importance of each placement

### 3.2 Pairwise Comparison Model

We treat a 4-player game as **6 pairwise matchups**:

```
4 Players: A, B, C, D

Pairwise Matchups:
  A vs B    A vs C    A vs D
            B vs C    B vs D
                      C vs D

Total: 6 matchups (4 choose 2)
```

### 3.3 Score Assignment by Placement

| Placement | Opponents Beaten | Score per Matchup |
|-----------|------------------|-------------------|
| 1st | 3 (beats 2nd, 3rd, 4th) | 3 × 1.0 = 3.0 |
| 2nd | 2 (beats 3rd, 4th) | 1 loss + 2 × 1.0 = 2.0 |
| 3rd | 1 (beats 4th) | 2 losses + 1 × 1.0 = 1.0 |
| 4th | 0 | 3 losses = 0.0 |

**Total score distributed per player:**
- 1st place: S = 1.0 (normalized: 3/3)
- 2nd place: S = 0.67 (normalized: 2/3)
- 3rd place: S = 0.33 (normalized: 1/3)
- 4th place: S = 0.0 (normalized: 0/3)

### 3.4 Expected Score Calculation

For Player A against all opponents:

$$E_A = \frac{1}{3} \sum_{X \in \{B,C,D\}} \frac{1}{1 + 10^{(R_X - R_A) / 400}}$$

This is the **average expected score** against all opponents.

### 3.5 Complete Rating Update

For each player:

$$R'_i = R_i + K \times (S_i - E_i)$$

Where $S_i$ is the placement-based score and $E_i$ is the expected score.

---

## 4. K-Factor Configuration

### 4.1 What is K-Factor?

K-factor controls rating volatility:
- **High K:** Ratings change quickly (good for new players calibrating)
- **Low K:** Ratings change slowly (good for stable veteran rankings)

### 4.2 Dynamic K-Factor

```typescript
function getKFactor(player: Player): number {
  const { gamesPlayed, rating } = player;
  
  // New players: High volatility for quick calibration
  if (gamesPlayed < 30) {
    return 40;
  }
  
  // Intermediate players
  if (gamesPlayed < 100) {
    return 32;
  }
  
  // High-rated players: Lower volatility to protect rankings
  if (rating >= 2000) {
    return 16;
  }
  
  // Standard players
  return 24;
}
```

### 4.3 K-Factor Table

| Condition | K-Factor | Reason |
|-----------|----------|--------|
| Games < 30 | 40 | Rapid calibration |
| Games < 100 | 32 | Still learning |
| Rating ≥ 2000 | 16 | Protect high ranks |
| Default | 24 | Standard volatility |

---

## 5. Rank System

### 5.1 Rank Tiers

```typescript
enum PlayerRank {
  BRONZE = 'bronze',       // 0 - 1199
  SILVER = 'silver',       // 1200 - 1399
  GOLD = 'gold',           // 1400 - 1599
  PLATINUM = 'platinum',   // 1600 - 1799
  DIAMOND = 'diamond',     // 1800 - 1999
  MASTER = 'master',       // 2000+
}

const RANK_THRESHOLDS: Record<PlayerRank, number> = {
  [PlayerRank.BRONZE]: 0,
  [PlayerRank.SILVER]: 1200,
  [PlayerRank.GOLD]: 1400,
  [PlayerRank.PLATINUM]: 1600,
  [PlayerRank.DIAMOND]: 1800,
  [PlayerRank.MASTER]: 2000,
};

function calculateRank(rating: number): PlayerRank {
  if (rating >= 2000) return PlayerRank.MASTER;
  if (rating >= 1800) return PlayerRank.DIAMOND;
  if (rating >= 1600) return PlayerRank.PLATINUM;
  if (rating >= 1400) return PlayerRank.GOLD;
  if (rating >= 1200) return PlayerRank.SILVER;
  return PlayerRank.BRONZE;
}
```

### 5.2 Rank Distribution Goals

Target distribution for a healthy competitive ecosystem:

| Rank | Target % | Rating Range |
|------|----------|--------------|
| Bronze | 20% | < 1200 |
| Silver | 35% | 1200 - 1399 |
| Gold | 25% | 1400 - 1599 |
| Platinum | 12% | 1600 - 1799 |
| Diamond | 6% | 1800 - 1999 |
| Master | 2% | 2000+ |

### 5.3 Rank Icons & Colors

| Rank | Color Code | Emoji/Icon |
|------|------------|------------|
| Bronze | #CD7F32 | 🥉 |
| Silver | #C0C0C0 | 🥈 |
| Gold | #FFD700 | 🥇 |
| Platinum | #E5E4E2 | 💎 |
| Diamond | #B9F2FF | 💠 |
| Master | #FF4500 | 👑 |

---

## 6. Implementation

### 6.1 ELO Service

```typescript
// services/elo.service.ts

interface EloCalculationResult {
  odindexerId: string;
  oldRating: number;
  newRating: number;
  change: number;
  placement: number;
}

@Injectable()
export class EloService {
  /**
   * Calculate new ratings for all players in a match
   * @param players Array of players with their ratings
   * @param placements Array of player IDs in order of placement (1st to 4th)
   */
  calculateMatchRatings(
    players: { id: string; rating: number; gamesPlayed: number }[],
    placements: string[],
  ): EloCalculationResult[] {
    if (players.length !== 4 || placements.length !== 4) {
      throw new Error('Exactly 4 players required');
    }
    
    const results: EloCalculationResult[] = [];
    
    for (const player of players) {
      const placement = placements.indexOf(player.id) + 1;
      const opponents = players.filter(p => p.id !== player.id);
      
      // Calculate expected score
      const expectedScore = this.calculateExpectedScore(player.rating, opponents);
      
      // Get actual score based on placement
      const actualScore = this.getActualScore(placement);
      
      // Get K-factor for this player
      const kFactor = this.getKFactor(player.gamesPlayed, player.rating);
      
      // Calculate rating change
      const change = Math.round(kFactor * (actualScore - expectedScore));
      const newRating = Math.max(0, player.rating + change); // Floor at 0
      
      results.push({
        odindexerId: player.id,
        oldRating: player.rating,
        newRating,
        change,
        placement,
      });
    }
    
    return results;
  }
  
  /**
   * Calculate expected score against all opponents
   */
  private calculateExpectedScore(
    playerRating: number,
    opponents: { rating: number }[],
  ): number {
    let totalExpected = 0;
    
    for (const opponent of opponents) {
      const expected = 1 / (1 + Math.pow(10, (opponent.rating - playerRating) / 400));
      totalExpected += expected;
    }
    
    // Normalize to 0-1 scale
    return totalExpected / opponents.length;
  }
  
  /**
   * Get actual score based on placement
   * 1st = 1.0, 2nd = 0.67, 3rd = 0.33, 4th = 0.0
   */
  private getActualScore(placement: number): number {
    const scores: Record<number, number> = {
      1: 1.0,
      2: 2/3,
      3: 1/3,
      4: 0.0,
    };
    return scores[placement] ?? 0;
  }
  
  /**
   * Get K-factor based on player experience and rating
   */
  private getKFactor(gamesPlayed: number, rating: number): number {
    if (gamesPlayed < 30) return 40;  // Calibration phase
    if (gamesPlayed < 100) return 32; // Learning phase
    if (rating >= 2000) return 16;    // Protect high ratings
    return 24;                         // Standard
  }
}
```

### 6.2 Match End Integration

```typescript
// game-engine.service.ts

async processGameEnd(roomId: string): Promise<GameEndResult> {
  const room = this.rooms.get(roomId);
  
  // Calculate placements based on penalty points
  const sortedPlayers = room.players
    .map(p => ({
      id: p.id,
      penaltyPoints: this.calculatePenaltyPoints(room, p.id),
    }))
    .sort((a, b) => a.penaltyPoints - b.penaltyPoints);
  
  const placements = sortedPlayers.map(p => p.id);
  
  // Get current player data
  const playerData = await Promise.all(
    room.players.map(async p => {
      const user = await this.userRepository.findById(p.id);
      return {
        id: p.id,
        rating: user.elo,
        gamesPlayed: user.stats.totalGames,
      };
    })
  );
  
  // Calculate new ratings
  const eloResults = this.eloService.calculateMatchRatings(playerData, placements);
  
  // Return results for transaction
  return {
    placements,
    eloResults,
    penaltyPoints: sortedPlayers.map(p => ({
      playerId: p.id,
      points: p.penaltyPoints,
    })),
  };
}
```

### 6.3 Example Calculation

```
Match Setup:
============
Player A: 1500 ELO
Player B: 1400 ELO
Player C: 1300 ELO
Player D: 1600 ELO

Result: D wins (1st), A (2nd), B (3rd), C (4th)

Calculations for Player A (2nd place):
======================================
Expected vs B: 1 / (1 + 10^((1400-1500)/400)) = 0.64
Expected vs C: 1 / (1 + 10^((1300-1500)/400)) = 0.76
Expected vs D: 1 / (1 + 10^((1600-1500)/400)) = 0.36

Average Expected: (0.64 + 0.76 + 0.36) / 3 = 0.587
Actual Score (2nd): 0.667

Change: K × (S - E) = 24 × (0.667 - 0.587) = 24 × 0.08 = +2
New Rating: 1500 + 2 = 1502

Full Results:
=============
D: 1600 → 1619 (+19)  [1st - beat expectations]
A: 1500 → 1502 (+2)   [2nd - slight overperform]
B: 1400 → 1395 (-5)   [3rd - underperformed]
C: 1300 → 1284 (-16)  [4th - as expected]
```

---

## 7. Anti-Abuse Measures

### 7.1 Collusion Detection

Detect players who repeatedly queue together and help each other:

```typescript
interface CollusionIndicators {
  frequentPairing: boolean;      // Same players match often
  asymmetricResults: boolean;    // One always wins vs another
  suspiciousPatterns: boolean;   // Throwing games intentionally
}

@Injectable()
export class CollusionDetectionService {
  async checkForCollusion(matchId: string, players: string[]): Promise<boolean> {
    // Check match history between these players
    const recentMatches = await this.getRecentMatchesBetweenPlayers(players, 20);
    
    // Flag 1: Do these players match together suspiciously often?
    const pairingFrequency = this.calculatePairingFrequency(recentMatches, players);
    if (pairingFrequency > 0.3) { // Same players in 30%+ of recent games
      this.flagForReview(players, 'FREQUENT_PAIRING');
      return true;
    }
    
    // Flag 2: Does one player always lose to another?
    const asymmetry = this.checkAsymmetricResults(recentMatches, players);
    if (asymmetry > 0.9) { // 90%+ same winner between two players
      this.flagForReview(players, 'ASYMMETRIC_RESULTS');
      return true;
    }
    
    return false;
  }
}
```

### 7.2 Smurfing Prevention

Detect experienced players on new accounts:

```typescript
// Indicators of a smurf account
interface SmurfIndicators {
  winRateAboveExpected: boolean;  // >70% win rate in first 20 games
  ratingClimbRate: boolean;       // Gaining >50 ELO/game average
  gameplayPatterns: boolean;      // Advanced strategies from game 1
}

function checkSmurfIndicators(player: Player): SmurfIndicators {
  const { stats, elo, gamesPlayed } = player;
  
  return {
    winRateAboveExpected: gamesPlayed >= 10 && stats.winRate > 0.7,
    ratingClimbRate: gamesPlayed >= 10 && (elo - 1200) / gamesPlayed > 50,
    gameplayPatterns: false, // Would need gameplay analysis
  };
}
```

### 7.3 Bot Detection

> ⚠️ **CRITICAL: Bot/Automation Detection**
>
> Players may create bots to farm coins/rewards. The game must detect non-human behavior.

```typescript
interface BotIndicators {
  constantReactionTime: boolean;   // Always same time to react
  perfectPatterns: boolean;        // Inhuman precision
  noIdleVariance: boolean;         // No "thinking" pauses
  suspicious24h: boolean;          // Playing 24/7
}

@Injectable()
export class BotDetectionService {
  private playerMetrics = new Map<string, PlayerBehaviorMetrics>();

  async analyzePlayerBehavior(
    playerId: string,
    action: GameAction,
  ): Promise<BotSuspicionLevel> {
    let metrics = this.playerMetrics.get(playerId);
    if (!metrics) {
      metrics = this.initializeMetrics();
      this.playerMetrics.set(playerId, metrics);
    }

    // Track reaction times
    metrics.reactionTimes.push(action.reactionTimeMs);
    
    // Check for bot indicators
    const indicators = this.calculateIndicators(metrics);
    
    return this.assessSuspicionLevel(indicators);
  }

  private calculateIndicators(metrics: PlayerBehaviorMetrics): BotIndicators {
    const reactionTimes = metrics.reactionTimes.slice(-50); // Last 50 actions
    
    return {
      // Bot indicator 1: Constant reaction time (< 50ms variance)
      constantReactionTime: this.calculateVariance(reactionTimes) < 2500, // 50ms std dev
      
      // Bot indicator 2: Suspiciously fast or perfect timing
      perfectPatterns: this.checkForPatterns(reactionTimes),
      
      // Bot indicator 3: No natural pauses (humans hesitate)
      noIdleVariance: !this.hasNaturalPauses(reactionTimes),
      
      // Bot indicator 4: Playing continuously for hours
      suspicious24h: metrics.consecutivePlayMinutes > 240, // 4+ hours straight
    };
  }

  private calculateVariance(times: number[]): number {
    const mean = times.reduce((a, b) => a + b, 0) / times.length;
    const squaredDiffs = times.map(t => Math.pow(t - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / times.length;
  }

  private checkForPatterns(times: number[]): boolean {
    // Check if reaction times follow a suspicious pattern
    // E.g., always exactly 3000ms, or always multiples of 1000ms
    const modulos = times.map(t => t % 1000);
    const sameModulo = modulos.every(m => Math.abs(m - modulos[0]) < 50);
    return sameModulo;
  }

  private hasNaturalPauses(times: number[]): boolean {
    // Humans occasionally take longer (thinking, distracted)
    const longPauses = times.filter(t => t > 5000); // > 5 seconds
    return longPauses.length >= times.length * 0.1; // At least 10% are long
  }

  private assessSuspicionLevel(indicators: BotIndicators): BotSuspicionLevel {
    const flagCount = Object.values(indicators).filter(Boolean).length;
    
    if (flagCount >= 3) return BotSuspicionLevel.HIGH;
    if (flagCount >= 2) return BotSuspicionLevel.MEDIUM;
    if (flagCount >= 1) return BotSuspicionLevel.LOW;
    return BotSuspicionLevel.NONE;
  }
}

enum BotSuspicionLevel {
  NONE = 'none',
  LOW = 'low',       // Log for analysis
  MEDIUM = 'medium', // Shadow ban from rewards
  HIGH = 'high',     // Flag for manual review, temporary suspend
}

interface PlayerBehaviorMetrics {
  reactionTimes: number[];        // Last N reaction times in ms
  consecutivePlayMinutes: number; // How long playing without break
  lastActionTime: Date;
  sessionStart: Date;
  actionsPerMinute: number[];     // APM over time
}
```

### 7.3.1 Bot Detection Actions

```typescript
async function handleBotSuspicion(
  playerId: string,
  level: BotSuspicionLevel,
): Promise<void> {
  switch (level) {
    case BotSuspicionLevel.LOW:
      // Just log for pattern analysis
      await this.logSuspiciousActivity(playerId, 'LOW_BOT_SUSPICION');
      break;
      
    case BotSuspicionLevel.MEDIUM:
      // Shadow ban: Play normally but earn 0 coins
      await this.applyShadowBan(playerId, 'MEDIUM_BOT_SUSPICION');
      // Player doesn't know they're shadow banned
      break;
      
    case BotSuspicionLevel.HIGH:
      // Immediate action
      await this.flagForManualReview(playerId, 'HIGH_BOT_SUSPICION');
      // Optionally require CAPTCHA verification
      await this.requireCaptcha(playerId);
      break;
  }
}
```

### 7.3.2 Human Verification (CAPTCHA)

For high-suspicion cases:

```typescript
interface CaptchaChallenge {
  type: 'image_select' | 'simple_math' | 'card_match';
  data: unknown;
  expiresAt: Date;
}

// Example: "Select all Queens from these cards"
// This uses domain knowledge to create game-relevant CAPTCHAs
```

### 7.4 Rating Floor

Prevent intentional deranking:

```typescript
const RATING_FLOOR = 100; // Cannot go below 100

function applyRatingChange(currentRating: number, change: number): number {
  const newRating = currentRating + change;
  return Math.max(RATING_FLOOR, newRating);
}
```

### 7.5 Abandon Penalty

Players who abandon games receive ELO penalty as if they placed last:

```typescript
function handleAbandon(player: Player, match: Match): number {
  // Treat as 4th place
  const eloResult = calculateMatchRatings(
    match.players,
    [...match.placements.slice(0, 3), player.id], // Force to 4th
  );
  
  // Additional penalty for abandoning
  const abandonPenalty = -15;
  
  return eloResult.find(r => r.id === player.id).change + abandonPenalty;
}
```

---

## Mathematical Reference

### Expected Score Formula

$$E_A = \frac{1}{n-1} \sum_{i \neq A} \frac{1}{1 + 10^{(R_i - R_A) / 400}}$$

### Rating Update Formula

$$R'_A = R_A + K \times (S_A - E_A)$$

### Score by Placement

| Placement | Score $(S)$ |
|-----------|-------------|
| 1st | $1.0$ |
| 2nd | $\frac{2}{3} \approx 0.667$ |
| 3rd | $\frac{1}{3} \approx 0.333$ |
| 4th | $0.0$ |

### K-Factor Values

| Condition | $K$ |
|-----------|-----|
| Games < 30 | 40 |
| Games < 100 | 32 |
| ELO ≥ 2000 | 16 |
| Default | 24 |

---

## References

- [Elo Rating System - Wikipedia](https://en.wikipedia.org/wiki/Elo_rating_system)
- [Multiplayer Elo Rating - Gautam Narula](https://gautamnarula.com/rating/)
- [Chess.com 4-Player Chess Ratings](https://support.chess.com/en/articles/8724787)

---

*Document Version: 1.0 | Last Updated: February 2026*
