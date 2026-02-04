# 03 - Game Engine & Core Mechanics

> **Owner:** Developer 2 (Game Engine)  
> **Last Updated:** February 2026  
> **Status:** Specification

---

## Table of Contents

1. [Overview](#1-overview)
2. [Authoritative Server Architecture](#2-authoritative-server-architecture)
3. [State Machine](#3-state-machine)
4. [Card System](#4-card-system)
5. [Matching System](#5-matching-system)
6. [Seal (Mühür) Algorithm](#6-seal-mühür-algorithm)
7. [Scoring System](#7-scoring-system)
8. [State Masking (Anti-Cheat)](#8-state-masking-anti-cheat)
9. [Turn Management](#9-turn-management)
10. [Implementation Guide](#10-implementation-guide)

---

## 1. Overview

The Game Engine is the heart of BluffBuddy Online. It implements all game rules as defined in the [Game Rules Document](./10-GameRules.md) and ensures:

- **Deterministic gameplay** - Same inputs always produce same outputs
- **Server authority** - All game state lives on server
- **Cheat prevention** - Clients cannot manipulate game state
- **Fair play** - Rules enforced consistently for all players

### Core Responsibilities

```
┌─────────────────────────────────────────────────────────────────┐
│                      GAME ENGINE                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ State       │  │ Rule        │  │ Event                   │  │
│  │ Machine     │  │ Validator   │  │ Broadcaster             │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Seal        │  │ Matching    │  │ Scoring                 │  │
│  │ Calculator  │  │ Engine      │  │ Calculator              │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Card        │  │ Turn        │  │ Replay                  │  │
│  │ Shuffler    │  │ Timer       │  │ Logger                  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Authoritative Server Architecture

### 2.1 Why Authoritative?

In an **authoritative server** model, the server is the single source of truth:

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHORITATIVE MODEL                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Client says: "I play Queen of Hearts"                         │
│                        │                                         │
│                        ▼                                         │
│   Server validates:                                              │
│     ✓ Is it this player's turn?                                 │
│     ✓ Does player have Queen of Hearts?                         │
│     ✓ Is this move legal?                                       │
│                        │                                         │
│            ┌──────────┴──────────┐                              │
│            │                     │                               │
│         VALID                 INVALID                            │
│            │                     │                               │
│            ▼                     ▼                               │
│   Server updates state      Server rejects                       │
│   Broadcasts to all         Sends error to client                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Client-Server Communication

```
┌─────────────┐                              ┌─────────────┐
│   CLIENT    │                              │   SERVER    │
└──────┬──────┘                              └──────┬──────┘
       │                                            │
       │  1. REQUEST: playCard                      │
       │ ─────────────────────────────────────────► │
       │  { rank: 'Q', suit: 'hearts' }            │
       │                                            │
       │                              2. VALIDATE   │
       │                              3. PROCESS    │
       │                              4. UPDATE     │
       │                                            │
       │  5. BROADCAST: gameStateUpdate             │
       │ ◄───────────────────────────────────────── │
       │  (to ALL players in room)                  │
       │                                            │
       │  6. EVENT: cardPlayed                      │
       │ ◄───────────────────────────────────────── │
       │  { player, card, result }                  │
       │                                            │
```

### 2.3 What Server Tracks (Full State)

```typescript
interface FullGameState {
  // Room metadata
  roomId: string;
  createdAt: Date;
  
  // Game phase
  phase: GamePhase;
  round: number;  // 1, 2, or 3
  
  // Deck (server only - never sent to clients)
  deck: Card[];
  
  // All player hands (server only)
  hands: Map<PlayerId, Card[]>;
  
  // Board state
  openCenter: (Card | null)[];  // 4 slots
  pool: Card[];                  // Full stack, not just top
  
  // Penalty slots (full information)
  penaltySlots: Map<PlayerId, PenaltyStack>;
  
  // Turn management
  currentPlayerIndex: number;
  turnOrder: PlayerId[];
  turnStartTime: Date;
  
  // Tracking for Seal algorithm
  cardLocations: Map<CardId, CardLocation>;
  accessibleCounts: Map<Rank, number>;  // How many of each rank are reachable
  
  // Replay log
  actionLog: GameAction[];
}
```

### 2.4 What Client Receives (Masked State)

```typescript
interface MaskedGameState {
  roomId: string;
  phase: GamePhase;
  round: number;
  
  // My hand only (full information)
  myHand: Card[];
  
  // Other players (card count only)
  opponents: {
    id: string;
    nickname: string;
    cardCount: number;
    isConnected: boolean;
  }[];
  
  // Board (visible only)
  openCenter: (Card | null)[];
  poolTopCard: Card | null;
  
  // Penalty slots (top cards only)
  penaltySlots: {
    playerId: string;
    topCards: Card[];
    buriedCount: number;
  }[];
  
  // Turn info
  currentPlayerId: string;
  turnTimeRemaining: number;
  
  // My position
  myIndex: number;
}
```

---

## 3. State Machine

### 3.1 Game Phases

```
┌─────────────────────────────────────────────────────────────────┐
│                     GAME STATE MACHINE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────────┐                                          │
│   │ WAITING_FOR_     │◄────────── Room created                  │
│   │ PLAYERS          │                                          │
│   └────────┬─────────┘                                          │
│            │ 4 players joined                                    │
│            ▼                                                     │
│   ┌──────────────────┐                                          │
│   │ INITIALIZING     │ Setup: shuffle, deal center cards        │
│   └────────┬─────────┘                                          │
│            │ Setup complete                                      │
│            ▼                                                     │
│   ┌──────────────────┐                                          │
│   │ DEALING          │ Deal 4 cards to each player              │
│   └────────┬─────────┘                                          │
│            │ Cards dealt                                         │
│            ▼                                                     │
│   ┌──────────────────┐◄──────────┐                              │
│   │ PLAYER_TURN      │           │                              │
│   └────────┬─────────┘           │                              │
│            │ Player acts         │                              │
│            ▼                     │                              │
│   ┌──────────────────┐           │                              │
│   │ RESOLVING_MOVE   │           │                              │
│   └────────┬─────────┘           │                              │
│            │                     │                              │
│      ┌─────┴─────┐               │                              │
│      ▼           ▼               │                              │
│   [Match]     [No Match]         │                              │
│      │           │               │                              │
│      ▼           ▼               │                              │
│   Apply       To Pool            │                              │
│   Penalty                        │                              │
│      │           │               │                              │
│      └─────┬─────┘               │                              │
│            │                     │                              │
│            ▼                     │                              │
│   ┌──────────────────┐           │                              │
│   │ CHECK_SEALS      │───────────┘ More cards? → PLAYER_TURN   │
│   └────────┬─────────┘                                          │
│            │ Round ends (all hands empty)                        │
│            ▼                                                     │
│   ┌──────────────────┐                                          │
│   │ ROUND_END        │ Round < 3? → DEALING                     │
│   └────────┬─────────┘                                          │
│            │ Round == 3                                          │
│            ▼                                                     │
│   ┌──────────────────┐                                          │
│   │ GAME_OVER        │ Calculate scores, update ELO             │
│   └──────────────────┘                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Phase Implementation

```typescript
enum GamePhase {
  WAITING_FOR_PLAYERS = 'waiting_for_players',
  INITIALIZING = 'initializing',
  DEALING = 'dealing',
  PLAYER_TURN = 'player_turn',
  RESOLVING_MOVE = 'resolving_move',
  CHECK_SEALS = 'check_seals',
  ROUND_END = 'round_end',
  GAME_OVER = 'game_over',
}

interface PhaseTransition {
  from: GamePhase;
  to: GamePhase;
  condition: (state: GameState) => boolean;
  action?: (state: GameState) => void;
}

const transitions: PhaseTransition[] = [
  {
    from: GamePhase.WAITING_FOR_PLAYERS,
    to: GamePhase.INITIALIZING,
    condition: (s) => s.players.length === 4,
    action: (s) => initializeGame(s),
  },
  {
    from: GamePhase.INITIALIZING,
    to: GamePhase.DEALING,
    condition: (s) => s.openCenter.every(c => c !== null),
  },
  {
    from: GamePhase.DEALING,
    to: GamePhase.PLAYER_TURN,
    condition: (s) => allPlayersHaveCards(s),
    action: (s) => startTurnTimer(s),
  },
  {
    from: GamePhase.PLAYER_TURN,
    to: GamePhase.RESOLVING_MOVE,
    condition: (s) => s.pendingMove !== null,
  },
  {
    from: GamePhase.RESOLVING_MOVE,
    to: GamePhase.CHECK_SEALS,
    condition: (s) => s.moveResolved,
  },
  {
    from: GamePhase.CHECK_SEALS,
    to: GamePhase.PLAYER_TURN,
    condition: (s) => !isRoundOver(s),
    action: (s) => advanceTurn(s),
  },
  {
    from: GamePhase.CHECK_SEALS,
    to: GamePhase.ROUND_END,
    condition: (s) => isRoundOver(s),
  },
  {
    from: GamePhase.ROUND_END,
    to: GamePhase.DEALING,
    condition: (s) => s.round < 3,
    action: (s) => { s.round++; dealCards(s); },
  },
  {
    from: GamePhase.ROUND_END,
    to: GamePhase.GAME_OVER,
    condition: (s) => s.round === 3,
    action: (s) => calculateFinalScores(s),
  },
];
```

---

## 4. Card System

### 4.1 Card Representation

```typescript
interface Card {
  id: string;           // Unique identifier (e.g., 'Q-hearts')
  rank: Rank;           // '2'-'10', 'J', 'Q', 'K', 'A'
  suit: Suit;           // 'hearts', 'diamonds', 'clubs', 'spades'
}

type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

// Card location tracking
enum CardZone {
  DECK = 'deck',           // Not yet dealt
  HAND = 'hand',           // In a player's hand
  OPEN_CENTER = 'center',  // On the board center
  POOL = 'pool',           // In the discard pile
  PENALTY = 'penalty',     // In a penalty slot
}

interface CardLocation {
  zone: CardZone;
  ownerId?: string;        // Player ID if in hand/penalty
  position?: number;       // Index in stack (0 = top)
  isAccessible: boolean;   // Can be matched/taken
}
```

### 4.2 Deck Generation & Shuffling

**CRITICAL:** Use cryptographically secure randomness for shuffling.

```typescript
import { randomBytes } from 'crypto';

function generateDeck(): Card[] {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  
  const deck: Card[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({
        id: `${rank}-${suit}`,
        rank,
        suit,
      });
    }
  }
  return deck;  // 52 cards
}

// Fisher-Yates shuffle with crypto randomness
function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Generate cryptographically random index
    const randomBuffer = randomBytes(4);
    const randomValue = randomBuffer.readUInt32BE(0);
    const j = randomValue % (i + 1);
    
    // Swap
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}
```

### 4.3 Card Dealing

```typescript
interface DealingConfig {
  cardsPerPlayer: number;     // 4
  centerCards: number;        // 4
  totalRounds: number;        // 3
}

function dealCards(state: GameState): void {
  const { deck, players, round } = state;
  
  // First round: also deal center cards
  if (round === 1) {
    for (let i = 0; i < 4; i++) {
      const card = deck.pop()!;
      state.openCenter[i] = card;
      updateCardLocation(state, card.id, {
        zone: CardZone.OPEN_CENTER,
        position: i,
        isAccessible: true,
      });
    }
  }
  
  // Deal 4 cards to each player
  for (const player of players) {
    for (let i = 0; i < 4; i++) {
      const card = deck.pop()!;
      state.hands.get(player.id)!.push(card);
      updateCardLocation(state, card.id, {
        zone: CardZone.HAND,
        ownerId: player.id,
        isAccessible: true,
      });
    }
  }
}
```

---

## 5. Matching System

### 5.1 Match Priority Order & Player Choice

When a player plays a card, the system finds ALL valid matches and **presents them to the player for selection**.

> ⚠️ **CRITICAL DESIGN DECISION: Player Agency**
> 
> Unlike auto-matching systems, BluffBuddy requires PLAYER CHOICE when multiple match targets exist.
> This is fundamental to the game's strategic depth - a player may prefer to send penalties
> to a specific opponent rather than taking the "optimal" match.

```
┌─────────────────────────────────────────────────────────────────┐
│                    MATCH FLOW DIAGRAM                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Player plays card (e.g., Queen ♥)                             │
│                        │                                         │
│                        ▼                                         │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │           findAllValidMatches(state, card)               │   │
│   │                                                          │   │
│   │   Returns: [                                             │   │
│   │     { zone: OPEN_CENTER, slot: 2, cards: [Q♠] },        │   │
│   │     { zone: PENALTY, owner: "player3", cards: [Q♦,Q♣] } │   │
│   │   ]                                                      │   │
│   └─────────────────────────────────────────────────────────┘   │
│                        │                                         │
│            ┌───────────┴───────────┐                            │
│            │                       │                             │
│     matches.length == 1      matches.length > 1                 │
│            │                       │                             │
│            ▼                       ▼                             │
│   AUTO-SELECT               REQUIRE PLAYER CHOICE               │
│   (proceed immediately)     (emit game:select_target)           │
│                                    │                             │
│                                    ▼                             │
│                             Wait for player response             │
│                             (timeout: 10 seconds)                │
│                                    │                             │
│                       ┌────────────┴────────────┐               │
│                       │                         │                │
│                  SELECTED                  TIMEOUT               │
│                       │                         │                │
│                       ▼                         ▼                │
│               Execute match           Auto-select first          │
│                                       (Priority Order)           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Priority Order (for timeout auto-selection only):**
```
Auto-Selection Fallback Order:
==============================
1. Open Center slots (left to right)
2. Pool top card
3. Penalty Slots (all players, counter-clockwise from current)
```

### 5.2 Match Detection Algorithm

```typescript
interface MatchResult {
  found: boolean;
  matches: MatchLocation[];
  totalCards: number;
  requiresSelection: boolean;  // true if matches.length > 1
}

interface MatchLocation {
  zone: CardZone;
  ownerId?: string;
  cards: Card[];
  priority: number;  // For auto-selection fallback
}

function findAllValidMatches(state: GameState, playedCard: Card): MatchResult {
  const matches: MatchLocation[] = [];
  const targetRank = playedCard.rank;
  let priorityCounter = 0;
  
  // 1. Check Open Center (Priority: 0, 1, 2, 3)
  for (let i = 0; i < state.openCenter.length; i++) {
    const centerCard = state.openCenter[i];
    if (centerCard && centerCard.rank === targetRank) {
      matches.push({
        zone: CardZone.OPEN_CENTER,
        cards: [centerCard],
        priority: priorityCounter++,
      });
    }
  }
  
  // 2. Check Pool (consecutive same-rank cards from top)
  const poolMatches = getPoolMatches(state.pool, targetRank);
  if (poolMatches.length > 0) {
    matches.push({
      zone: CardZone.POOL,
      cards: poolMatches,
      priority: priorityCounter++,
    });
  }
  
  // 3. Check all Penalty Slots (including own)
  const turnOrder = getTurnOrderFromCurrent(state);
  for (const playerId of turnOrder) {
    const penaltyStack = state.penaltySlots.get(playerId);
    if (penaltyStack && !penaltyStack.isSealed) {
      const topGroup = getTopMatchingGroup(penaltyStack, targetRank);
      if (topGroup.length > 0) {
        matches.push({
          zone: CardZone.PENALTY,
          ownerId: playerId,
          cards: topGroup,
          priority: priorityCounter++,
        });
      }
    }
  }
  
  const totalCards = matches.reduce((sum, m) => sum + m.cards.length, 0) + 1; // +1 for played card
  
  return {
    found: matches.length > 0,
    matches,
    totalCards,
    requiresSelection: matches.length > 1,
  };
}

// Get consecutive same-rank cards from pool top
function getPoolMatches(pool: Card[], targetRank: Rank): Card[] {
  const matches: Card[] = [];
  
  // Pool is array where last element = top
  for (let i = pool.length - 1; i >= 0; i--) {
    if (pool[i].rank === targetRank) {
      matches.push(pool[i]);
    } else {
      break; // Stop at first non-matching card
    }
  }
  
  return matches;
}
```

### 5.3 Onion Skin (Sıyırma) Logic

The "Onion Skin" rule: Only the top matching group can be taken from a penalty slot.

```typescript
interface PenaltyStack {
  cards: Card[];           // All cards, index 0 = bottom
  isSealed: boolean;
  sealedAtIndex?: number;  // Index where seal starts
}

function getTopMatchingGroup(stack: PenaltyStack, targetRank: Rank): Card[] {
  if (stack.isSealed) {
    return []; // Sealed stacks cannot be accessed
  }
  
  const topGroup: Card[] = [];
  
  // Read from top (end of array) going down
  for (let i = stack.cards.length - 1; i >= 0; i--) {
    const card = stack.cards[i];
    
    if (i === stack.cards.length - 1) {
      // First card must match
      if (card.rank !== targetRank) {
        return [];
      }
      topGroup.push(card);
    } else {
      // Continue only if same rank
      if (card.rank === targetRank) {
        topGroup.push(card);
      } else {
        break; // Different rank = stop
      }
    }
  }
  
  return topGroup.reverse(); // Return in bottom-to-top order
}
```

**Example: Onion Skin in Action**

```
Penalty Slot State:
===================
TOP    → [Q, Q]        ← Can be taken with Q
         [9, 9, 9]     ← Protected until Queens removed
BOTTOM → [J]           ← Protected

Player plays Q:
- Takes both Queens
- Reveals the 9s underneath
- 9s now vulnerable to matching
```

---

## 6. Seal (Mühür) Algorithm

The Seal mechanic is the most complex rule in BluffBuddy. A stack becomes **sealed** when it's mathematically impossible to match the top cards.

### 6.1 Seal Conditions

A penalty stack is sealed when:

```
SEAL CONDITION:
===============
TopStackRank Count == Accessible Copies of that Rank

OR

No accessible card of TopStackRank exists anywhere
```

### 6.2 Accessibility Tracking

```typescript
interface AccessibilityTracker {
  // For each rank, track how many are "accessible"
  accessibleCounts: Map<Rank, number>;
  
  // When cards become inaccessible
  onCardBuried(card: Card): void;
  
  // Check if a stack should seal
  shouldSeal(stack: PenaltyStack): boolean;
}

class SealService implements AccessibilityTracker {
  accessibleCounts = new Map<Rank, number>();
  
  constructor() {
    // Initialize: all 4 copies of each rank are accessible
    const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    for (const rank of ranks) {
      this.accessibleCounts.set(rank, 4);
    }
  }
  
  onCardBuried(card: Card): void {
    // When a card becomes inaccessible (buried under a seal)
    const current = this.accessibleCounts.get(card.rank) || 0;
    this.accessibleCounts.set(card.rank, current - 1);
  }
  
  shouldSeal(stack: PenaltyStack): boolean {
    if (stack.cards.length === 0) return false;
    if (stack.isSealed) return true; // Already sealed
    
    // Get the top card(s) rank
    const topRank = stack.cards[stack.cards.length - 1].rank;
    
    // Count how many of this rank are in the top group
    let topGroupCount = 0;
    for (let i = stack.cards.length - 1; i >= 0; i--) {
      if (stack.cards[i].rank === topRank) {
        topGroupCount++;
      } else {
        break;
      }
    }
    
    // Get accessible count for this rank
    const accessible = this.accessibleCounts.get(topRank) || 0;
    
    // Seal if top group equals all accessible copies
    return topGroupCount === accessible;
  }
}
```

### 6.3 Seal Check Algorithm

```typescript
function checkAndApplySeals(state: GameState): SealEvent[] {
  const sealEvents: SealEvent[] = [];
  
  for (const [playerId, stack] of state.penaltySlots) {
    if (stack.isSealed) continue;
    
    if (state.sealService.shouldSeal(stack)) {
      // Seal the stack
      stack.isSealed = true;
      stack.sealedAtIndex = stack.cards.length;
      
      // Mark buried cards as inaccessible
      // Cards under the sealed group become buried
      const topRank = stack.cards[stack.cards.length - 1].rank;
      for (let i = 0; i < stack.cards.length; i++) {
        const card = stack.cards[i];
        if (card.rank !== topRank || i < stack.cards.length - countTopGroup(stack)) {
          state.sealService.onCardBuried(card);
        }
      }
      
      sealEvents.push({
        playerId,
        sealedRank: topRank,
        buriedCards: getBuriedCards(stack),
      });
      
      // IMPORTANT: After a seal, check other stacks too
      // A seal might trigger cascade seals!
    }
  }
  
  // Recursive check for cascade seals
  if (sealEvents.length > 0) {
    const cascadeSeals = checkAndApplySeals(state);
    sealEvents.push(...cascadeSeals);
  }
  
  return sealEvents;
}
```

### 6.4 Seal Scenarios

**Scenario 1: Complete Set (4/4)**
```
Initial: Jack accessible count = 4

Player dumps 4 Jacks onto penalty slot:
Stack: [J, J, J, J]
Check: 4 Jacks == 4 accessible
Result: SEALED ✓
```

**Scenario 2: Reduced Threshold (3/3)**
```
Previous seal buried 1 Jack.
Jack accessible count = 3

Player has stack: [J, J, J]
Check: 3 Jacks == 3 accessible  
Result: SEALED ✓

Note: The 4th Jack exists but is unreachable (buried)
```

**Scenario 3: Cascade Seal**
```
Step 1: Player seals stack with [5, 5, 5, 5]
        Buried underneath: [Q]
        Queen accessible count: 4 → 3

Step 2: Another player has: [Q, Q, Q]
        Check: 3 Queens == 3 accessible
        Result: CASCADE SEAL ✓
```

### 6.5 Complete Seal Check Pseudocode

```typescript
function isStackSealed(
  stack: PenaltyStack,
  targetRank: Rank,
  gameState: GameState
): boolean {
  // Rule 1: Complete set (4 cards of same rank)
  const topGroupCount = countTopGroup(stack, targetRank);
  if (topGroupCount === 4) {
    return true;
  }
  
  // Rule 2: All accessible copies are in this stack
  const accessible = countAccessibleCards(targetRank, gameState);
  if (topGroupCount === accessible) {
    return true;
  }
  
  // Rule 3: No key card is reachable anywhere
  if (accessible === 0) {
    return true; // No card can ever match this
  }
  
  return false;
}

function countAccessibleCards(rank: Rank, state: GameState): number {
  let count = 0;
  
  for (const [cardId, location] of state.cardLocations) {
    const card = getCardById(cardId);
    if (card.rank !== rank) continue;
    
    if (location.isAccessible) {
      count++;
    }
  }
  
  return count;
}
```

---

## 7. Scoring System

### 7.1 Card Penalty Values

```typescript
const CARD_PENALTIES: Record<Rank, number> = {
  '3': 30,   // HIGHEST - The danger card!
  'J': 20,
  'Q': 15,
  'A': 11,
  'K': 10,
  '10': 10,
  '9': 9,
  '8': 8,
  '7': 7,
  '6': 6,
  '5': 5,
  '4': 4,
  '2': 2,
};

function getCardPenalty(card: Card): number {
  return CARD_PENALTIES[card.rank];
}
```

### 7.2 Final Score Calculation

```typescript
interface PlayerScore {
  playerId: string;
  penaltyCards: Card[];
  totalPenalty: number;
  rank: number;  // 1 = winner (lowest), 4 = last
}

function calculateFinalScores(state: GameState): PlayerScore[] {
  const scores: PlayerScore[] = [];
  
  for (const [playerId, stack] of state.penaltySlots) {
    const penaltyCards = stack.cards;
    const totalPenalty = penaltyCards.reduce(
      (sum, card) => sum + getCardPenalty(card),
      0
    );
    
    scores.push({
      playerId,
      penaltyCards,
      totalPenalty,
      rank: 0, // Will be set after sorting
    });
  }
  
  // Sort by penalty (ascending - lowest wins)
  scores.sort((a, b) => a.totalPenalty - b.totalPenalty);
  
  // Assign ranks (handle ties)
  let currentRank = 1;
  for (let i = 0; i < scores.length; i++) {
    if (i > 0 && scores[i].totalPenalty > scores[i - 1].totalPenalty) {
      currentRank = i + 1;
    }
    scores[i].rank = currentRank;
  }
  
  return scores;
}
```

---

## 8. State Masking (Anti-Cheat)

### 8.1 Masking Principles

**NEVER send to client:**
- Other players' cards
- Pool contents (except top card)
- Buried cards in penalty stacks
- Deck contents

```typescript
function maskGameState(
  fullState: FullGameState,
  forPlayerId: string
): MaskedGameState {
  return {
    roomId: fullState.roomId,
    phase: fullState.phase,
    round: fullState.round,
    
    // Full hand for this player only
    myHand: fullState.hands.get(forPlayerId) || [],
    
    // Other players: card count only
    opponents: fullState.players
      .filter(p => p.id !== forPlayerId)
      .map(p => ({
        id: p.id,
        nickname: p.nickname,
        cardCount: (fullState.hands.get(p.id) || []).length,
        isConnected: p.isConnected,
      })),
    
    // Board state
    openCenter: fullState.openCenter,
    poolTopCard: fullState.pool.length > 0 
      ? fullState.pool[fullState.pool.length - 1] 
      : null,
    
    // Penalty slots: visible cards only
    penaltySlots: Array.from(fullState.penaltySlots.entries()).map(
      ([playerId, stack]) => ({
        playerId,
        topCards: getVisibleTopCards(stack),
        buriedCount: stack.cards.length - getVisibleTopCards(stack).length,
        isSealed: stack.isSealed,
      })
    ),
    
    // Turn info
    currentPlayerId: fullState.turnOrder[fullState.currentPlayerIndex],
    turnTimeRemaining: calculateTimeRemaining(fullState.turnStartTime),
    
    myIndex: fullState.turnOrder.indexOf(forPlayerId),
  };
}

function getVisibleTopCards(stack: PenaltyStack): Card[] {
  if (stack.cards.length === 0) return [];
  
  const topRank = stack.cards[stack.cards.length - 1].rank;
  const visible: Card[] = [];
  
  // Only show consecutive same-rank cards from top
  for (let i = stack.cards.length - 1; i >= 0; i--) {
    if (stack.cards[i].rank === topRank) {
      visible.unshift(stack.cards[i]);
    } else {
      break;
    }
  }
  
  return visible;
}
```

### 8.2 Memory Game Enforcement & Invalid Move Penalty

> ⚠️ **CRITICAL DESIGN DECISION: No Information Leakage**
>
> The game is a MEMORY game. When a player makes an invalid move (e.g., targeting a sealed stack),
> the server MUST NOT reveal why the move failed. Instead, it applies an automatic penalty.

```typescript
/**
 * MEMORY GAME RULE:
 * ==================
 * If a player attempts to match a card that doesn't exist (because they miscounted
 * or forgot that the target is sealed), they pay the "memory penalty":
 * 
 * 1. Their played card goes directly to the Pool
 * 2. They do NOT get an error telling them the stack was sealed
 * 3. Turn advances normally
 * 
 * This prevents "fishing" for information about sealed stacks.
 */

interface PlayResult {
  success: boolean;
  result?: 'MATCHED' | 'NO_MATCH' | 'MEMORY_PENALTY' | 'AWAITING_TARGET_SELECTION';
  cardWentToPool?: boolean;
  matchedCards?: Card[];
  penaltyTarget?: string;
  availableTargets?: MatchLocation[];  // If multiple targets exist
}

function handlePlayCard(
  state: GameState,
  playerId: string,
  playedCard: Card,
  targetSelection?: MatchLocation  // Optional: player's chosen target
): PlayResult {
  // Remove card from player's hand
  removeFromHand(state, playerId, playedCard);
  
  // Find ALL valid matches (including checking seal status internally)
  const matchResult = findAllValidMatches(state, playedCard);
  
  // CASE 1: No matches exist → Card goes to Pool
  if (!matchResult.found) {
    state.pool.push(playedCard);
    updateCardLocation(state, playedCard.id, {
      zone: CardZone.POOL,
      isAccessible: true,
    });
    
    return {
      success: true,
      result: 'NO_MATCH',
      cardWentToPool: true,
    };
  }
  
  // CASE 2: Player specified a target that is NOT in valid matches
  // This means they targeted a sealed stack or invalid location
  // → MEMORY PENALTY: Card goes to Pool (no error message!)
  if (targetSelection) {
    const isValidTarget = matchResult.matches.some(m => 
      m.zone === targetSelection.zone && 
      m.ownerId === targetSelection.ownerId
    );
    
    if (!isValidTarget) {
      // MEMORY PENALTY - Don't reveal WHY it failed!
      state.pool.push(playedCard);
      updateCardLocation(state, playedCard.id, {
        zone: CardZone.POOL,
        isAccessible: true,
      });
      
      // Log for anti-cheat monitoring (server-side only)
      logSuspiciousActivity(playerId, 'SEALED_STACK_ATTEMPT', targetSelection);
      
      return {
        success: true,  // Move completed (penalty applied)
        result: 'MEMORY_PENALTY',
        cardWentToPool: true,
      };
    }
  }
  
  // CASE 3: Multiple valid targets & no selection made → Ask player to choose
  if (matchResult.requiresSelection && !targetSelection) {
    // Pause and wait for player to select target
    state.pendingMove = {
      playerId,
      playedCard,
      validTargets: matchResult.matches,
      selectionDeadline: Date.now() + 10000,  // 10 second timeout
    };
    
    return {
      success: true,
      result: 'AWAITING_TARGET_SELECTION',
      availableTargets: matchResult.matches,
    };
  }
  
  // CASE 4: Single target OR valid selection made → Execute match
  const finalTarget = targetSelection || matchResult.matches[0];
  executeMatch(state, playedCard, finalTarget, playerId);
  
  return {
    success: true,
    result: 'MATCHED',
    matchedCards: finalTarget.cards,
    penaltyTarget: finalTarget.ownerId,
  };
}

/**
 * Handle timeout when player doesn't select a target in time
 */
function handleTargetSelectionTimeout(state: GameState): void {
  if (!state.pendingMove) return;
  
  const { playedCard, validTargets } = state.pendingMove;
  
  // Auto-select based on priority order
  const autoTarget = validTargets.sort((a, b) => a.priority - b.priority)[0];
  
  // Execute with auto-selected target
  executeMatch(state, playedCard, autoTarget, state.pendingMove.playerId);
  
  state.pendingMove = null;
}
```

### 8.3 Why No Error Messages?

```
┌─────────────────────────────────────────────────────────────────┐
│                  INFORMATION LEAKAGE PREVENTION                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   WRONG (Information Leak):                                     │
│   ─────────────────────────                                     │
│   Player: "I play Q♥ targeting Player3's penalty slot"         │
│   Server: "ERROR: That stack is sealed!"                        │
│   Player: "Oh! Now I know to avoid that stack. Let me try       │
│            somewhere else..."                                   │
│                                                                  │
│   This gives FREE INFORMATION! The player just learned          │
│   that stack is sealed without paying any cost.                 │
│                                                                  │
│   ─────────────────────────────────────────────────────────────  │
│                                                                  │
│   CORRECT (Memory Penalty):                                     │
│   ─────────────────────────                                     │
│   Player: "I play Q♥ targeting Player3's penalty slot"         │
│   Server: *silently puts Q♥ into Pool*                         │
│   Server: "Your turn is complete. Next player..."               │
│   Player: "Wait, why didn't it match?! Oh... it must have       │
│            been sealed. I should have kept better track."       │
│                                                                  │
│   The player LOSES THEIR CARD as the "cost" of not knowing.    │
│   This is the MEMORY aspect of the game!                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Turn Management

**Direction: Counter-clockwise (Saat yönünün tersine)**

Turns proceed in counter-clockwise order around the table. This affects:
- Normal turn progression
- Penalty slot search order for matching cards
- Card dealing sequence

### 9.0 Turn Order Helper

```typescript
/**
 * Get players in counter-clockwise order starting from current player
 * Used for penalty slot search priority
 */
function getTurnOrderFromCurrent(state: GameState): PlayerId[] {
  const playerCount = state.turnOrder.length;
  const currentIdx = state.currentPlayerIndex;
  const result: PlayerId[] = [];
  
  // Counter-clockwise means decreasing index
  for (let i = 0; i < playerCount; i++) {
    const idx = (currentIdx - i + playerCount) % playerCount;
    result.push(state.turnOrder[idx]);
  }
  
  return result;
}

/**
 * Advance to next player (counter-clockwise)
 */
function advanceTurn(state: GameState): void {
  const playerCount = state.turnOrder.length;
  // Counter-clockwise = decreasing index
  state.currentPlayerIndex = (state.currentPlayerIndex - 1 + playerCount) % playerCount;
  state.turnStartTime = new Date();
}
```

### 9.1 Turn Timer

```typescript
const TURN_TIMEOUT_MS = 30_000; // 30 seconds

class TurnTimerService {
  private timers = new Map<string, NodeJS.Timeout>();
  
  startTurnTimer(roomId: string, playerId: string, onTimeout: () => void): void {
    // Clear existing timer
    this.clearTimer(roomId);
    
    const timer = setTimeout(() => {
      onTimeout();
    }, TURN_TIMEOUT_MS);
    
    this.timers.set(roomId, timer);
  }
  
  clearTimer(roomId: string): void {
    const timer = this.timers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(roomId);
    }
  }
  
  getRemainingTime(roomId: string, turnStartTime: Date): number {
    const elapsed = Date.now() - turnStartTime.getTime();
    return Math.max(0, TURN_TIMEOUT_MS - elapsed);
  }
}
```

### 9.2 Auto-Pass on Timeout

```typescript
function handleTurnTimeout(state: GameState): void {
  const currentPlayer = getCurrentPlayer(state);
  
  // Auto-play: discard random card to pool
  const hand = state.hands.get(currentPlayer.id);
  if (hand && hand.length > 0) {
    // Remove first card (could randomize)
    const discardedCard = hand.shift()!;
    state.pool.push(discardedCard);
    
    // Log action
    logAction(state, {
      type: 'AUTO_DISCARD',
      playerId: currentPlayer.id,
      card: discardedCard,
      reason: 'TIMEOUT',
    });
    
    // Advance turn
    advanceTurn(state);
  }
}
```

### 9.3 Disconnection Handling

```typescript
const RECONNECT_WINDOW_MS = 60_000; // 1 minute to reconnect

function handlePlayerDisconnect(
  state: GameState,
  playerId: string
): void {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return;
  
  player.isConnected = false;
  player.disconnectedAt = new Date();
  
  // If it's their turn, start reconnect timer
  if (isPlayersTurn(state, playerId)) {
    setTimeout(() => {
      if (!player.isConnected) {
        // Still disconnected - auto-pass
        handleTurnTimeout(state);
      }
    }, RECONNECT_WINDOW_MS);
  }
}

function handlePlayerReconnect(
  state: GameState,
  playerId: string
): MaskedGameState {
  const player = state.players.find(p => p.id === playerId);
  if (player) {
    player.isConnected = true;
    player.disconnectedAt = undefined;
  }
  
  // Send full current state
  return maskGameState(state, playerId);
}
```

---

## 10. Implementation Guide

### 10.1 File Structure

```
src/game/
├── game.module.ts
├── gateways/
│   └── game.gateway.ts
├── services/
│   ├── game-engine.service.ts      # Main orchestrator
│   ├── room-manager.service.ts     # Room lifecycle
│   └── matchmaking.service.ts      # Player matching
├── mechanics/
│   ├── seal.service.ts             # Seal algorithm
│   ├── matching.service.ts         # Card matching
│   ├── scoring.service.ts          # Score calculation
│   └── shuffler.service.ts         # Deck shuffling
├── state/
│   ├── game-state.interface.ts     # State types
│   ├── state-machine.ts            # Phase transitions
│   └── card-tracker.ts             # Card location tracking
├── dto/
│   ├── play-card.dto.ts
│   ├── join-room.dto.ts
│   └── game-state.dto.ts
└── constants/
    ├── game-rules.ts               # Card values, timings
    └── error-codes.ts              # Game-specific errors
```

### 10.2 Service Dependencies

```
GameGateway
    │
    ├── GameEngineService (orchestrates game flow)
    │       ├── SealService
    │       ├── MatchingService
    │       ├── ScoringService
    │       └── ShufflerService
    │
    ├── RoomManagerService (room lifecycle)
    │       └── MatchmakingService
    │
    └── TurnTimerService (timeout handling)
```

### 10.3 Testing Checklist

- [ ] Deck shuffling produces valid distribution
- [ ] All 52 cards dealt over 3 rounds (48 to players, 4 to center)
- [ ] Match priority order is correct
- [ ] Onion skin rule works correctly
- [ ] Seal algorithm detects all seal conditions
- [ ] Cascade seals work correctly
- [ ] State masking hides appropriate information
- [ ] Turn timer auto-passes correctly
- [ ] Disconnect/reconnect preserves state
- [ ] Final scoring is accurate

---

## References

- [Game Rules (Turkish)](./10-GameRules.md)
- [Original Game Logic](../GameLogic.md)
- [ELO Rating System](./06-ELO-Rating.md)

---

*Document Version: 1.0 | Last Updated: February 2026*
