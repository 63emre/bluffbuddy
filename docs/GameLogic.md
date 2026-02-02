# Buddy Bluff – Game Logic & Mechanics (v0.1.0)

This document serves as the **official source of truth** for the gameplay logic of Buddy Bluff. It covers the core loop, slot priorities, and the critical dynamic locking mechanism.

---

## 1. Core Logic Overview
*   **Players:** 4
*   **Deck:** Standard 52-card (No Jokers).
*   **Direction:** Clockwise.
*   **Objective:** Lowest penalty score wins.

## 2. The Board (Slot Definitions)
The game board manages state through specific "Slots".

### 2.1 Static Slots (Persistent)
*   **The Pool (1 Slot):** Central waste pile.
    *   *Behavior:* LIFO (Last In, First Out). Only the **Top Card** is interactive.
*   **Penalty Slots (4 Slots, 1 per Player):**
    *   *Behavior:* LIFO. Only the **Top Card** is interactive. This is where players accumulate debt.

### 2.2 Dynamic Slots (Temporary)
*   **Open Center (4 Slots):**
    *   *Setup:* Initialized with 4 face-up cards at game start.
    *   *Behavior:* These are "Single Card Slots". Once a card is matched and removed, the slot is destroyed/closed for the rest of the game.

---

## 3. Turn Execution Flow

A turn strictly follows this sequence: **Play Card** -> **Check Matches** -> **Resolve**.

### 3.1 Phase 1: Play
*   Player selects 1 card from hand (Hidden -> Public).

### 3.2 Phase 2: Match Scan (Priority System)
The system checks for a **Rank Match** (Suit is ignored). The scan order is hardcoded:

1.  **Open Center:** Iterate through remaining open slots.
2.  **The Pool:** Check the Top Card only.
3.  **Penalty Slots:** Check the Top Card of **ALL** players (including current player).

**Critical Rule:** Matches are strictly defined by the visible **Top Card**. Cards underneath are "protected" from matching but also "blocked" from use while covered.

### 3.3 Phase 3: Resolution

#### Path A: Match Found
If one or more matches are found:
1.  **Creation:** The played card + ALL matched cards generally combine into a "Package".
2.  **Action:** Player must place this Package on a Penalty Slot.
    *   **Targeting:** Can be **Any Player** (Self or Others).
    *   *Strategy:* "Attack" usually means giving to others. "Locking" usually means keeping on self (see Section 4).

#### Path B: No Match
1.  **Discard:** The played card is placed on top of **The Pool**.
2.  **Next Turn:** Play passes active player.

---

## 4. The Seal (Lock) Mechanic
The most complex logic in Buddy Bluff. A stack of identical ranks can become "Sealed," permanently securing points and removing cards from circulation.

### 4.1 Concept: "Accessible Copies"
To determine if a seal occurs, the game tracks the **Global Count** of available cards for every Rank (A-K).
*   **Start:** All Ranks have `count = 4`.
*   **Decremental Trigger:** When a Seal occurs, any cards *buried* underneath that seal are removed from the game's logic. If the buried cards belong to a specific Rank, that Rank's `Accessible Copy Count` decreases.

### 4.2 The Mühür (Seal) Condition
A seal triggers on a Penalty Slot instantly when:
> `Count(Top_Stack_Rank) == Accessible_Copies(Rank)`

### 4.3 Detailed Examples & Edge Cases

#### Scenario 1: Standard Lock (4/4)
*   **State:** Rank 'Jack' has `Accessible=4`.
*   **Action:** Player dumps 2 Jacks onto a stack that already has 2 Jacks.
*   **Result:** Top stack = 4 Jacks. `4 == 4`.
*   **Effect:** The 4 Jacks allow no further interaction. They are sealed.

#### Scenario 2: Reduced Threshold (3/3)
*   **Context:** Early game, a stack of '5s' was sealed. Underneath that stack was **one '9'**.
*   **State Update:** The '9' is buried. Rank '9' now has `Accessible=3`.
*   **Action:** Player plays a '9' and matches 2 '9s' from the board. They dump this package (3 cards total) onto an empty Penalty Slot.
*   **Result:** Top stack = 3 '9s'. `3 == 3`. **LOCK TRIGGERS.**
*   **Logic:** Even though there is a 4th '9' somewhere else (maybe in someone's hand or at the bottom of the Pool), it is mathematically impossible to form a stack of 4. Thus, 3 is the new "Full Set".

#### Scenario 3: The "Double Bury" (2/2)
*   **Context:** Two separate seals have occurred previously. Both seals accidentally buried a 'Queen' each.
*   **State Update:** Rank 'Queen' has `Accessible=2`.
*   **Action:** Player plays a Queen, matches a Queen, and stacks them.
*   **Result:** A simple pair of Queens (2 cards) now forms a Permanent Seal.

### 4.4 Effect of Sealing
1.  **Immutable:** Sealed cards cannot be moved, stolen, or matched.
2.  **Barrier:** No cards *under* the seal can ever be accessed again.
3.  **Scoring:** Sealed cards count towards the owner's final penalty score (they are "secured debt").

---

## 5. Scoring & End Game
*   **Trigger:** All cards dealt (3 rounds x 4 cards), all hands played.
*   **Calculation:** Sum of all cards in a player's Penalty Slot.
*   **Values:**
    *   3 = 30 pts
    *   J = 20 pts
    *   Q = 15 pts
    *   K = 10 pts
    *   A = 11 pts
    *   Others = Face Value
