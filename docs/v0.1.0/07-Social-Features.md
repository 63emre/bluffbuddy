# 07 - Social Features

> **Owner:** Developer 3 (Data & Social)  
> **Last Updated:** February 2026  
> **Status:** Specification

---

## Table of Contents

1. [Overview](#1-overview)
2. [Friends System](#2-friends-system)
3. [Party System](#3-party-system)
4. [Presence System](#4-presence-system)
5. [Chat System](#5-chat-system)
6. [Replay System](#6-replay-system)
7. [Leaderboards](#7-leaderboards)
8. [Implementation](#8-implementation)

---

## 1. Overview

Social features are critical for player retention and engagement. BluffBuddy Online implements:

- **Friends:** Add, remove, and manage friend relationships
- **Party:** Group up with friends to queue together
- **Presence:** See who's online and what they're doing
- **Chat:** In-game communication (Quick Chat + Emojis)
- **Replay:** Watch past games for learning and verification
- **Leaderboards:** Competitive rankings by season

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      SOCIAL MODULE                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    SocialGateway                            │ │
│  │  (WebSocket namespace: /social)                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│      ┌───────────┬───────────┼───────────┬───────────┐          │
│      ▼           ▼           ▼           ▼           ▼          │
│  ┌────────┐ ┌────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐    │
│  │Friends │ │ Party  │ │ Presence │ │  Chat  │ │  Replay  │    │
│  │Service │ │Service │ │ Service  │ │Service │ │ Service  │    │
│  └────────┘ └────────┘ └──────────┘ └────────┘ └──────────┘    │
│         │                    │                    │              │
│         └────────────────────┴────────────────────┘              │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  PersistenceModule                          │ │
│  │  (Firestore: users, friendRequests)                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Friends System

### 2.1 Friend Request Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRIEND REQUEST FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   [User A]                              [User B]                │
│      │                                      │                    │
│      │  1. Send Request                     │                    │
│      │ ─────────────────────────────────►   │                    │
│      │     friend:request:send              │                    │
│      │     { targetId: B }                  │                    │
│      │                                      │                    │
│      │                         2. Receive Notification          │
│      │                    ◄─────────────────│                    │
│      │                    friend:request:received               │
│      │                    { from: A, nickname }                 │
│      │                                      │                    │
│      │                         3a. Accept   │                    │
│      │                    ◄─────────────────│                    │
│      │                    friend:request:respond                │
│      │                    { requestId, accept: true }           │
│      │                                      │                    │
│      │  4. Both receive confirmation        │                    │
│      │ ◄────────────────────────────────►   │                    │
│      │     friend:added                     │                    │
│      │     { friend: {...} }                │                    │
│      │                                      │                    │
│                                                                  │
│   Alternative: 3b. Reject                                       │
│      │                    ◄─────────────────│                    │
│      │                    friend:request:respond                │
│      │                    { requestId, accept: false }          │
│      │                                      │                    │
│      │  Requester notified (optional)       │                    │
│      │ ◄────────────────────────────────    │                    │
│      │     friend:request:rejected          │                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Friends Service

```typescript
// services/friends.service.ts

@Injectable()
export class FriendsService {
  constructor(
    @Inject('IUserRepository')
    private userRepository: IUserRepository,
    private firestore: FirestoreService,
    private presenceService: PresenceService,
  ) {}

  /**
   * Send a friend request
   */
  async sendRequest(fromUserId: string, toUserId: string): Promise<FriendRequest> {
    // Validate users exist
    const [fromUser, toUser] = await Promise.all([
      this.userRepository.findById(fromUserId),
      this.userRepository.findById(toUserId),
    ]);

    if (!toUser) {
      throw new NotFoundException('ERR_USER_NOT_FOUND');
    }

    // Check if already friends
    if (fromUser.friendIds.includes(toUserId)) {
      throw new ConflictException('ERR_ALREADY_FRIENDS');
    }

    // Check for existing pending request
    const existing = await this.findPendingRequest(fromUserId, toUserId);
    if (existing) {
      throw new ConflictException('ERR_REQUEST_PENDING');
    }

    // Check if blocked
    if (toUser.blockedIds.includes(fromUserId)) {
      throw new ForbiddenException('ERR_USER_BLOCKED_YOU');
    }

    // Create request
    const request: FriendRequest = {
      id: uuidv4(),
      fromUserId,
      toUserId,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await this.firestore
      .getFirestore()
      .collection('friendRequests')
      .doc(request.id)
      .set(request);

    return request;
  }

  /**
   * Respond to a friend request
   */
  async respondToRequest(
    userId: string,
    requestId: string,
    accept: boolean,
  ): Promise<void> {
    const db = this.firestore.getFirestore();
    const requestRef = db.collection('friendRequests').doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      throw new NotFoundException('ERR_REQUEST_NOT_FOUND');
    }

    const request = requestDoc.data() as FriendRequest;

    // Verify recipient
    if (request.toUserId !== userId) {
      throw new ForbiddenException('ERR_NOT_YOUR_REQUEST');
    }

    if (request.status !== 'pending') {
      throw new ConflictException('ERR_REQUEST_ALREADY_RESOLVED');
    }

    if (accept) {
      // Use transaction to update both users and request atomically
      await db.runTransaction(async (transaction) => {
        const user1Ref = db.collection('users').doc(request.fromUserId);
        const user2Ref = db.collection('users').doc(request.toUserId);

        // Add each other as friends
        transaction.update(user1Ref, {
          friendIds: admin.firestore.FieldValue.arrayUnion(request.toUserId),
        });
        transaction.update(user2Ref, {
          friendIds: admin.firestore.FieldValue.arrayUnion(request.fromUserId),
        });

        // Update request status
        transaction.update(requestRef, {
          status: 'accepted',
          respondedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });
    } else {
      // Just update request status
      await requestRef.update({
        status: 'rejected',
        respondedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }

  /**
   * Remove a friend
   */
  async removeFriend(userId: string, friendId: string): Promise<void> {
    const db = this.firestore.getFirestore();

    await db.runTransaction(async (transaction) => {
      const userRef = db.collection('users').doc(userId);
      const friendRef = db.collection('users').doc(friendId);

      transaction.update(userRef, {
        friendIds: admin.firestore.FieldValue.arrayRemove(friendId),
      });
      transaction.update(friendRef, {
        friendIds: admin.firestore.FieldValue.arrayRemove(userId),
      });
    });
  }

  /**
   * Block a user
   */
  async blockUser(userId: string, blockedId: string): Promise<void> {
    // Remove from friends if present, then add to blocked
    await this.removeFriend(userId, blockedId).catch(() => {});
    
    await this.userRepository.update(userId, {
      blockedIds: admin.firestore.FieldValue.arrayUnion(blockedId) as any,
    });
  }

  /**
   * Get friends list with presence info
   */
  async getFriendsList(userId: string): Promise<FriendInfo[]> {
    const user = await this.userRepository.findById(userId);
    if (!user || user.friendIds.length === 0) {
      return [];
    }

    // Batch get friends
    const friends = await Promise.all(
      user.friendIds.map(id => this.userRepository.findById(id)),
    );

    // Get presence for all friends
    const presenceMap = await this.presenceService.getBulkPresence(user.friendIds);

    return friends
      .filter(f => f !== null)
      .map(f => ({
        id: f!.id,
        nickname: f!.nickname,
        avatarUrl: f!.avatarUrl,
        rank: f!.rank,
        elo: f!.elo,
        presence: presenceMap.get(f!.id) || { status: 'offline' },
      }));
  }

  /**
   * Get pending requests (incoming)
   */
  async getPendingRequests(userId: string): Promise<FriendRequest[]> {
    const snapshot = await this.firestore
      .getFirestore()
      .collection('friendRequests')
      .where('toUserId', '==', userId)
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    return snapshot.docs.map(doc => doc.data() as FriendRequest);
  }

  private async findPendingRequest(
    fromId: string,
    toId: string,
  ): Promise<FriendRequest | null> {
    // Check both directions
    const snapshot = await this.firestore
      .getFirestore()
      .collection('friendRequests')
      .where('status', '==', 'pending')
      .where('fromUserId', 'in', [fromId, toId])
      .get();

    for (const doc of snapshot.docs) {
      const req = doc.data() as FriendRequest;
      if (
        (req.fromUserId === fromId && req.toUserId === toId) ||
        (req.fromUserId === toId && req.toUserId === fromId)
      ) {
        return req;
      }
    }
    return null;
  }
}
```

### 2.3 Friend Types

```typescript
interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Timestamp;
  respondedAt?: Timestamp;
}

interface FriendInfo {
  id: string;
  nickname: string;
  avatarUrl?: string;
  rank: PlayerRank;
  elo: number;
  presence: PresenceInfo;
}

interface PresenceInfo {
  status: 'online' | 'in_game' | 'in_menu' | 'offline';
  lastSeen?: Date;
  currentActivity?: string;  // "Playing Ranked Match"
}
```

---

## 3. Party System

### 3.1 Party Concept

A **Party** is a temporary group of friends who want to play together. When the party leader queues for a match, all party members are matched together.

### 3.2 Party Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        PARTY FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   1. CREATE PARTY                                               │
│      [Leader] ──► party:create ──► Server creates party         │
│                                    { partyId, leaderId }        │
│                                                                  │
│   2. INVITE FRIENDS                                             │
│      [Leader] ──► party:invite ──► [Friend receives]            │
│                   { friendId }      party:invite:received       │
│                                                                  │
│   3. FRIEND ACCEPTS                                             │
│      [Friend] ──► party:join ──► Server adds to party           │
│                   { partyId }    Broadcasts: party:member:joined│
│                                                                  │
│   4. QUEUE AS PARTY                                             │
│      [Leader] ──► match:queue ──► All members enter queue       │
│                   { partyId }                                   │
│                                                                  │
│   5. MATCH FOUND                                                │
│      Server ──► match:found ──► All members join same room      │
│                                                                  │
│   6. PARTY DISSOLVED (after game or manual leave)               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Party Rules

| Rule | Value |
|------|-------|
| Max Party Size | 4 (one full game) |
| Min for Ranked | 1 (solo allowed) |
| Can mix ranks? | Yes, but affects matchmaking |
| Timeout for invite | 60 seconds |
| Party persists after game? | Yes, until manually left |

### 3.4 Party Service

```typescript
// services/party.service.ts

interface Party {
  id: string;
  leaderId: string;
  memberIds: string[];
  createdAt: Date;
  status: 'idle' | 'queuing' | 'in_game';
  invites: Map<string, PartyInvite>;  // pendingUserId -> invite
}

interface PartyInvite {
  odindexerId: string;
  invitedAt: Date;
  expiresAt: Date;
}

@Injectable()
export class PartyService {
  private parties = new Map<string, Party>();
  private userPartyMap = new Map<string, string>(); // odindexerId -> partyId

  /**
   * Create a new party
   */
  createParty(leaderId: string): Party {
    // Check if user already in a party
    if (this.userPartyMap.has(leaderId)) {
      throw new ConflictException('ERR_ALREADY_IN_PARTY');
    }

    const party: Party = {
      id: uuidv4(),
      leaderId,
      memberIds: [leaderId],
      createdAt: new Date(),
      status: 'idle',
      invites: new Map(),
    };

    this.parties.set(party.id, party);
    this.userPartyMap.set(leaderId, party.id);

    return party;
  }

  /**
   * Invite a user to the party
   */
  inviteToParty(partyId: string, inviterId: string, inviteeId: string): PartyInvite {
    const party = this.getParty(partyId);

    // Validate inviter is leader
    if (party.leaderId !== inviterId) {
      throw new ForbiddenException('ERR_NOT_PARTY_LEADER');
    }

    // Check party size
    if (party.memberIds.length >= 4) {
      throw new ConflictException('ERR_PARTY_FULL');
    }

    // Check if already invited
    if (party.invites.has(inviteeId)) {
      throw new ConflictException('ERR_ALREADY_INVITED');
    }

    // Check if invitee already in a party
    if (this.userPartyMap.has(inviteeId)) {
      throw new ConflictException('ERR_USER_IN_PARTY');
    }

    const invite: PartyInvite = {
      odindexerId: inviteeId,
      invitedAt: new Date(),
      expiresAt: new Date(Date.now() + 60000), // 60 second expiry
    };

    party.invites.set(inviteeId, invite);

    // Schedule invite expiry
    setTimeout(() => {
      party.invites.delete(inviteeId);
    }, 60000);

    return invite;
  }

  /**
   * Accept a party invite
   */
  joinParty(partyId: string, userId: string): Party {
    const party = this.getParty(partyId);

    // Validate invite exists and not expired
    const invite = party.invites.get(userId);
    if (!invite) {
      throw new NotFoundException('ERR_INVITE_NOT_FOUND');
    }
    if (new Date() > invite.expiresAt) {
      party.invites.delete(userId);
      throw new ConflictException('ERR_INVITE_EXPIRED');
    }

    // Check party not full
    if (party.memberIds.length >= 4) {
      throw new ConflictException('ERR_PARTY_FULL');
    }

    // Add to party
    party.memberIds.push(userId);
    party.invites.delete(userId);
    this.userPartyMap.set(userId, partyId);

    return party;
  }

  /**
   * Leave a party
   */
  leaveParty(userId: string): void {
    const partyId = this.userPartyMap.get(userId);
    if (!partyId) {
      throw new NotFoundException('ERR_NOT_IN_PARTY');
    }

    const party = this.parties.get(partyId);
    if (!party) {
      this.userPartyMap.delete(userId);
      return;
    }

    // Remove from party
    party.memberIds = party.memberIds.filter(id => id !== userId);
    this.userPartyMap.delete(userId);

    // If leader left, transfer or dissolve
    if (party.leaderId === userId) {
      if (party.memberIds.length > 0) {
        party.leaderId = party.memberIds[0];
      } else {
        // Dissolve empty party
        this.parties.delete(partyId);
      }
    }
  }

  /**
   * Get party by ID
   */
  getParty(partyId: string): Party {
    const party = this.parties.get(partyId);
    if (!party) {
      throw new NotFoundException('ERR_PARTY_NOT_FOUND');
    }
    return party;
  }

  /**
   * Get user's current party
   */
  getUserParty(userId: string): Party | null {
    const partyId = this.userPartyMap.get(userId);
    return partyId ? this.parties.get(partyId) || null : null;
  }
}
```

---

## 4. Presence System

### 4.1 Presence States

```typescript
enum PresenceStatus {
  ONLINE = 'online',      // Connected, in menus
  IN_QUEUE = 'in_queue',  // Looking for match
  IN_GAME = 'in_game',    // Playing a game
  AWAY = 'away',          // Idle for 5+ minutes
  OFFLINE = 'offline',    // Not connected
}

interface UserPresence {
  status: PresenceStatus;
  lastActivity: Date;
  currentRoomId?: string;
  activity?: string;       // Human-readable, e.g., "In Ranked Match"
}
```

### 4.2 Presence Service (In-Memory)

For our single-server architecture, presence is stored in memory:

```typescript
// services/presence.service.ts

@Injectable()
export class PresenceService {
  private presence = new Map<string, UserPresence>();
  private readonly AWAY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  setOnline(userId: string): void {
    this.presence.set(userId, {
      status: PresenceStatus.ONLINE,
      lastActivity: new Date(),
    });
  }

  setOffline(userId: string): void {
    this.presence.delete(userId);
    // Alternatively, keep last seen:
    // this.presence.set(userId, {
    //   status: PresenceStatus.OFFLINE,
    //   lastActivity: new Date(),
    // });
  }

  setInGame(userId: string, roomId: string): void {
    this.presence.set(userId, {
      status: PresenceStatus.IN_GAME,
      lastActivity: new Date(),
      currentRoomId: roomId,
      activity: 'In Game',
    });
  }

  setInQueue(userId: string): void {
    this.presence.set(userId, {
      status: PresenceStatus.IN_QUEUE,
      lastActivity: new Date(),
      activity: 'Looking for match',
    });
  }

  updateActivity(userId: string): void {
    const current = this.presence.get(userId);
    if (current) {
      current.lastActivity = new Date();
      if (current.status === PresenceStatus.AWAY) {
        current.status = PresenceStatus.ONLINE;
      }
    }
  }

  getPresence(userId: string): UserPresence | null {
    return this.presence.get(userId) || null;
  }

  async getBulkPresence(userIds: string[]): Promise<Map<string, UserPresence>> {
    const result = new Map<string, UserPresence>();
    for (const id of userIds) {
      const p = this.presence.get(id);
      if (p) {
        result.set(id, p);
      }
    }
    return result;
  }

  // Run periodically to mark inactive users as away
  @Cron('* * * * *') // Every minute
  checkIdleUsers(): void {
    const now = Date.now();
    for (const [userId, presence] of this.presence) {
      if (
        presence.status === PresenceStatus.ONLINE &&
        now - presence.lastActivity.getTime() > this.AWAY_TIMEOUT
      ) {
        presence.status = PresenceStatus.AWAY;
      }
    }
  }
}
```

### 4.3 Presence Notifications

Notify friends when someone comes online/offline:

```typescript
// social.gateway.ts

@SubscribeMessage('presence:subscribe')
handlePresenceSubscribe(
  @ConnectedSocket() client: AuthenticatedSocket,
) {
  const userId = client.user.uid;
  
  // Get friend list
  const friends = await this.friendsService.getFriendsList(userId);
  
  // Subscribe to each friend's presence room
  for (const friend of friends) {
    client.join(`presence:${friend.id}`);
  }
  
  // Return current presence of all friends
  return friends.map(f => ({
    id: f.id,
    presence: f.presence,
  }));
}

// When a user's presence changes:
private broadcastPresenceChange(userId: string, presence: UserPresence) {
  this.server.to(`presence:${userId}`).emit('presence:update', {
    userId,
    presence,
  });
}
```

---

## 5. Chat System

In-game communication is critical for BluffBuddy's social experience. Players can taunt, bluff verbally, and react to plays.

> ⚠️ **Design Decision: Quick Chat + Emojis Only (No Free Text)**
>
> For v0.1.0, we use predefined messages only. This avoids:
> - Toxic language moderation complexity
> - Bad word filter implementation
> - Report system requirements
> - Legal compliance issues

### 5.1 Chat Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CHAT SYSTEM OVERVIEW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                   QUICK CHAT                             │   │
│   │   Predefined messages in categories:                     │   │
│   │   • Greetings: "Merhaba!", "İyi oyunlar!"               │   │
│   │   • Reactions: "Vay be!", "Olamaz!", "Güzel hamle!"     │   │
│   │   • Taunts: "Sıkıyorsa sen de yap!", "Korktun mu?"      │   │
│   │   • Strategy: "Bekle...", "Hmm...", "Acele etme!"       │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                   EMOJI REACTIONS                        │   │
│   │   Quick-tap emojis visible to all players:              │   │
│   │   😀 😂 😱 😤 🤔 👏 👎 🔥 💀 🎉                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                   RATE LIMITING                          │   │
│   │   • Max 3 messages per 10 seconds                       │   │
│   │   • Spam detection → temporary mute                     │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Quick Chat Messages

```typescript
// constants/quick-chat.ts

enum QuickChatCategory {
  GREETING = 'greeting',
  REACTION = 'reaction',
  TAUNT = 'taunt',
  STRATEGY = 'strategy',
  GOODBYE = 'goodbye',
}

interface QuickChatMessage {
  id: string;
  category: QuickChatCategory;
  text_tr: string;  // Turkish
  text_en: string;  // English (future)
}

const QUICK_CHAT_MESSAGES: QuickChatMessage[] = [
  // Greetings
  { id: 'greet_1', category: QuickChatCategory.GREETING, text_tr: 'Merhaba!', text_en: 'Hello!' },
  { id: 'greet_2', category: QuickChatCategory.GREETING, text_tr: 'İyi oyunlar!', text_en: 'Good luck!' },
  { id: 'greet_3', category: QuickChatCategory.GREETING, text_tr: 'Hazır mısınız?', text_en: 'Ready?' },
  
  // Reactions
  { id: 'react_1', category: QuickChatCategory.REACTION, text_tr: 'Vay be!', text_en: 'Wow!' },
  { id: 'react_2', category: QuickChatCategory.REACTION, text_tr: 'Olamaz!', text_en: 'No way!' },
  { id: 'react_3', category: QuickChatCategory.REACTION, text_tr: 'Güzel hamle!', text_en: 'Nice move!' },
  { id: 'react_4', category: QuickChatCategory.REACTION, text_tr: 'Şanslısın!', text_en: 'Lucky!' },
  { id: 'react_5', category: QuickChatCategory.REACTION, text_tr: 'İnanılmaz!', text_en: 'Incredible!' },
  
  // Taunts
  { id: 'taunt_1', category: QuickChatCategory.TAUNT, text_tr: 'Sıkıyorsa sen de yap!', text_en: 'Try that yourself!' },
  { id: 'taunt_2', category: QuickChatCategory.TAUNT, text_tr: 'Korktun mu?', text_en: 'Scared?' },
  { id: 'taunt_3', category: QuickChatCategory.TAUNT, text_tr: 'Bu mu en iyisi?', text_en: 'Is that your best?' },
  { id: 'taunt_4', category: QuickChatCategory.TAUNT, text_tr: 'Kolay gelsin!', text_en: 'Good luck with that!' },
  
  // Strategy
  { id: 'strat_1', category: QuickChatCategory.STRATEGY, text_tr: 'Hmm...', text_en: 'Hmm...' },
  { id: 'strat_2', category: QuickChatCategory.STRATEGY, text_tr: 'Bekle...', text_en: 'Wait...' },
  { id: 'strat_3', category: QuickChatCategory.STRATEGY, text_tr: 'Acele etme!', text_en: 'Don\'t rush!' },
  { id: 'strat_4', category: QuickChatCategory.STRATEGY, text_tr: 'İlginç...', text_en: 'Interesting...' },
  
  // Goodbye
  { id: 'bye_1', category: QuickChatCategory.GOODBYE, text_tr: 'İyi oyundu!', text_en: 'Good game!' },
  { id: 'bye_2', category: QuickChatCategory.GOODBYE, text_tr: 'Tekrar görüşürüz!', text_en: 'See you!' },
  { id: 'bye_3', category: QuickChatCategory.GOODBYE, text_tr: 'Tebrikler!', text_en: 'Congratulations!' },
];
```

### 5.3 Emoji Reactions

```typescript
// constants/emojis.ts

const ALLOWED_EMOJIS = [
  '😀', // Smile
  '😂', // Laugh
  '😱', // Shock
  '😤', // Angry
  '🤔', // Thinking
  '👏', // Clap
  '👎', // Thumbs down
  '🔥', // Fire (hot play)
  '💀', // Dead (ouch)
  '🎉', // Celebrate
];

interface EmojiReaction {
  senderId: string;
  emoji: string;
  timestamp: Date;
}
```

### 5.4 Chat Service Implementation

```typescript
// services/chat.service.ts

interface ChatMessage {
  type: 'quick_chat' | 'emoji';
  senderId: string;
  senderNickname: string;
  content: string;  // quickChatId or emoji
  timestamp: Date;
}

@Injectable()
export class ChatService {
  private rateLimiters = new Map<string, RateLimiter>();
  
  constructor(private readonly logger: Logger) {}

  async sendQuickChat(
    roomId: string,
    senderId: string,
    quickChatId: string,
  ): Promise<ChatMessage | null> {
    // Validate quick chat ID
    const message = QUICK_CHAT_MESSAGES.find(m => m.id === quickChatId);
    if (!message) {
      throw new WsException('Invalid quick chat ID');
    }
    
    // Check rate limit
    if (!this.checkRateLimit(senderId)) {
      throw new WsException('Rate limited - slow down!');
    }
    
    return {
      type: 'quick_chat',
      senderId,
      senderNickname: await this.getNickname(senderId),
      content: quickChatId,
      timestamp: new Date(),
    };
  }

  async sendEmoji(
    roomId: string,
    senderId: string,
    emoji: string,
  ): Promise<ChatMessage | null> {
    // Validate emoji
    if (!ALLOWED_EMOJIS.includes(emoji)) {
      throw new WsException('Invalid emoji');
    }
    
    // Check rate limit
    if (!this.checkRateLimit(senderId)) {
      throw new WsException('Rate limited - slow down!');
    }
    
    return {
      type: 'emoji',
      senderId,
      senderNickname: await this.getNickname(senderId),
      content: emoji,
      timestamp: new Date(),
    };
  }

  private checkRateLimit(userId: string): boolean {
    let limiter = this.rateLimiters.get(userId);
    
    if (!limiter) {
      limiter = new RateLimiter({
        tokensPerInterval: 3,
        interval: 10000, // 10 seconds
      });
      this.rateLimiters.set(userId, limiter);
    }
    
    return limiter.tryRemoveTokens(1);
  }
}
```

### 5.5 Chat Gateway Events

```typescript
// game.gateway.ts - Chat Events

// Client → Server
@SubscribeMessage('chat:quick')
async handleQuickChat(
  @ConnectedSocket() client: AuthenticatedSocket,
  @MessageBody() data: { quickChatId: string },
) {
  const room = this.roomManager.findUserRoom(client.user.uid);
  if (!room) throw new WsException('Not in a room');
  
  const message = await this.chatService.sendQuickChat(
    room.id,
    client.user.uid,
    data.quickChatId,
  );
  
  // Broadcast to room
  this.server.to(`room:${room.id}`).emit('chat:message', message);
}

@SubscribeMessage('chat:emoji')
async handleEmoji(
  @ConnectedSocket() client: AuthenticatedSocket,
  @MessageBody() data: { emoji: string },
) {
  const room = this.roomManager.findUserRoom(client.user.uid);
  if (!room) throw new WsException('Not in a room');
  
  const message = await this.chatService.sendEmoji(
    room.id,
    client.user.uid,
    data.emoji,
  );
  
  // Broadcast to room
  this.server.to(`room:${room.id}`).emit('chat:message', message);
}

// Server → Client Events
// chat:message - { type, senderId, senderNickname, content, timestamp }
```

### 5.6 Mute System

Players can mute other players:

```typescript
interface MuteSettings {
  mutedPlayers: Set<string>;  // Player IDs
  muteAll: boolean;           // Mute everyone
}

// Client-side filtering
// Server still sends all messages, client filters based on mute list
// This prevents "is muted" information leakage
```

### 5.7 Future: Free Text Chat (v0.2.0+)

For future versions with free text:

```typescript
interface FreeTextConfig {
  // Bad word filter
  badWordsList: string[];           // Loaded from external source
  badWordRegex: RegExp;             // Compiled pattern
  
  // Moderation
  reportThreshold: number;          // Reports before auto-action
  autoMuteDuration: number;         // Minutes
  
  // Rate limiting
  maxCharsPerMessage: 100;
  maxMessagesPerMinute: 10;
}

// Would require:
// - [ ] Bad word dictionary (Turkish + English)
// - [ ] Leet speak detection (e.g., "4ss" → "ass")
// - [ ] Report system UI
// - [ ] Moderation dashboard
// - [ ] Appeal process
```

---

## 6. Replay System

### 6.1 Replay Data Structure

```typescript
interface ReplayData {
  version: number;          // Replay format version
  matchId: string;
  timestamp: Date;
  duration: number;         // seconds
  
  // Initial state
  initialState: {
    players: {
      id: string;
      nickname: string;
      position: number;     // 0-3, turn order
    }[];
    openCenter: Card[];
    deck: Card[];           // For deterministic replay
  };
  
  // Action log
  actions: ReplayAction[];
}

interface ReplayAction {
  timestamp: number;        // ms since game start
  type: ReplayActionType;
  playerId: string;
  data: Record<string, any>;
}

enum ReplayActionType {
  DEAL_CARDS = 'deal',
  PLAY_CARD = 'play',
  MATCH = 'match',
  DUMP = 'dump',
  SEAL = 'seal',
  ROUND_END = 'round_end',
  TIMEOUT = 'timeout',
  DISCONNECT = 'disconnect',
  RECONNECT = 'reconnect',
}
```

### 5.2 Recording Replays

```typescript
// services/replay.service.ts

@Injectable()
export class ReplayService {
  private activeReplays = new Map<string, ReplayData>();

  startRecording(roomId: string, initialState: any): void {
    this.activeReplays.set(roomId, {
      version: 1,
      matchId: roomId,
      timestamp: new Date(),
      duration: 0,
      initialState,
      actions: [],
    });
  }

  recordAction(
    roomId: string,
    type: ReplayActionType,
    playerId: string,
    data: any,
    gameStartTime: Date,
  ): void {
    const replay = this.activeReplays.get(roomId);
    if (!replay) return;

    replay.actions.push({
      timestamp: Date.now() - gameStartTime.getTime(),
      type,
      playerId,
      data,
    });
  }

  finishRecording(roomId: string, duration: number): ReplayData | null {
    const replay = this.activeReplays.get(roomId);
    if (!replay) return null;

    replay.duration = duration;
    this.activeReplays.delete(roomId);

    return replay;
  }

  /**
   * Compress replay for storage
   */
  compressReplay(replay: ReplayData): string {
    const json = JSON.stringify(replay);
    const compressed = zlib.gzipSync(Buffer.from(json));
    return compressed.toString('base64');
  }

  /**
   * Decompress replay for playback
   */
  decompressReplay(compressed: string): ReplayData {
    const buffer = Buffer.from(compressed, 'base64');
    const decompressed = zlib.gunzipSync(buffer);
    return JSON.parse(decompressed.toString());
  }
}
```

### 5.3 Replay Playback

Replay playback happens client-side. The server provides the compressed data:

```typescript
// match.controller.ts

@Controller('matches')
export class MatchController {
  @Get(':matchId/replay')
  @UseGuards(AuthGuard)
  async getReplay(
    @Param('matchId') matchId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<{ replayData: string }> {
    const match = await this.matchRepository.findById(matchId);
    
    if (!match) {
      throw new NotFoundException('ERR_MATCH_NOT_FOUND');
    }
    
    // Verify user was a participant
    if (!match.participantIds.includes(user.uid)) {
      throw new ForbiddenException('ERR_NOT_PARTICIPANT');
    }
    
    if (!match.replayData) {
      throw new NotFoundException('ERR_REPLAY_NOT_AVAILABLE');
    }
    
    return { replayData: match.replayData };
  }
}
```

---

## 6. Leaderboards

### 6.1 Leaderboard Structure

```typescript
interface LeaderboardEntry {
  odindexerId: string;
  nickname: string;
  elo: number;
  rank: PlayerRank;
  gamesPlayed: number;
  wins: number;
  winRate: number;
  position: number;      // Leaderboard position
}

interface SeasonInfo {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  rewards: SeasonReward[];
}

interface SeasonReward {
  rankThreshold: PlayerRank;
  rewards: {
    coins?: number;
    gems?: number;
    items?: string[];
    title?: string;
  };
}
```

### 6.2 Leaderboard Queries

```typescript
// repositories/leaderboard.repository.ts

@Injectable()
export class LeaderboardRepository {
  constructor(private firestore: FirestoreService) {}

  /**
   * Get top N players
   */
  async getTopPlayers(
    seasonId: string,
    limit: number = 100,
  ): Promise<LeaderboardEntry[]> {
    const snapshot = await this.firestore
      .getFirestore()
      .collection('leaderboards')
      .doc(seasonId)
      .collection('entries')
      .orderBy('elo', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc, index) => ({
      ...doc.data() as LeaderboardEntry,
      position: index + 1,
    }));
  }

  /**
   * Get player's position and nearby players
   */
  async getPlayerContext(
    seasonId: string,
    userId: string,
  ): Promise<{
    player: LeaderboardEntry | null;
    position: number | null;
    nearby: LeaderboardEntry[];
  }> {
    const entryRef = this.firestore
      .getFirestore()
      .collection('leaderboards')
      .doc(seasonId)
      .collection('entries')
      .doc(userId);

    const entryDoc = await entryRef.get();
    
    if (!entryDoc.exists) {
      return { player: null, position: null, nearby: [] };
    }

    const playerEntry = entryDoc.data() as LeaderboardEntry;

    // Count players with higher ELO to get position
    const higherCount = await this.firestore
      .getFirestore()
      .collection('leaderboards')
      .doc(seasonId)
      .collection('entries')
      .where('elo', '>', playerEntry.elo)
      .count()
      .get();

    const position = higherCount.data().count + 1;

    // Get nearby players (5 above and 5 below)
    const [above, below] = await Promise.all([
      this.firestore
        .getFirestore()
        .collection('leaderboards')
        .doc(seasonId)
        .collection('entries')
        .where('elo', '>', playerEntry.elo)
        .orderBy('elo', 'asc')
        .limit(5)
        .get(),
      this.firestore
        .getFirestore()
        .collection('leaderboards')
        .doc(seasonId)
        .collection('entries')
        .where('elo', '<', playerEntry.elo)
        .orderBy('elo', 'desc')
        .limit(5)
        .get(),
    ]);

    const nearby = [
      ...above.docs.map(d => d.data() as LeaderboardEntry).reverse(),
      playerEntry,
      ...below.docs.map(d => d.data() as LeaderboardEntry),
    ];

    return {
      player: { ...playerEntry, position },
      position,
      nearby,
    };
  }
}
```

---

## 7. Implementation

### 7.1 Social Gateway

```typescript
// gateways/social.gateway.ts

@WebSocketGateway({ namespace: '/social' })
export class SocialGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private friendsService: FriendsService,
    private partyService: PartyService,
    private presenceService: PresenceService,
  ) {}

  afterInit(server: Server) {
    server.use(wsAuthMiddleware);
  }

  handleConnection(client: AuthenticatedSocket) {
    const userId = client.user.uid;
    
    // Set online
    this.presenceService.setOnline(userId);
    
    // Join personal room
    client.join(`user:${userId}`);
    
    // Notify friends
    this.notifyFriendsOfPresenceChange(userId);
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.user?.uid;
    if (!userId) return;

    // Set offline
    this.presenceService.setOffline(userId);
    
    // Notify friends
    this.notifyFriendsOfPresenceChange(userId);
    
    // Handle party leave
    const party = this.partyService.getUserParty(userId);
    if (party) {
      this.partyService.leaveParty(userId);
      this.broadcastPartyUpdate(party.id);
    }
  }

  // Friend events
  @SubscribeMessage('friend:request:send')
  async handleFriendRequest(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { targetId: string },
  ) {
    const request = await this.friendsService.sendRequest(
      client.user.uid,
      payload.targetId,
    );
    
    // Notify target
    this.server.to(`user:${payload.targetId}`).emit('friend:request:received', {
      requestId: request.id,
      from: {
        id: client.user.uid,
        // Include nickname, etc.
      },
    });

    return { success: true, requestId: request.id };
  }

  @SubscribeMessage('friend:request:respond')
  async handleFriendResponse(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { requestId: string; accept: boolean },
  ) {
    await this.friendsService.respondToRequest(
      client.user.uid,
      payload.requestId,
      payload.accept,
    );

    if (payload.accept) {
      // Notify both users
      // ... emit friend:added to both
    }

    return { success: true };
  }

  // Party events
  @SubscribeMessage('party:create')
  handlePartyCreate(@ConnectedSocket() client: AuthenticatedSocket) {
    const party = this.partyService.createParty(client.user.uid);
    client.join(`party:${party.id}`);
    return { party };
  }

  @SubscribeMessage('party:invite')
  async handlePartyInvite(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { friendId: string },
  ) {
    const party = this.partyService.getUserParty(client.user.uid);
    if (!party) throw new WsException('ERR_NOT_IN_PARTY');

    const invite = this.partyService.inviteToParty(
      party.id,
      client.user.uid,
      payload.friendId,
    );

    // Notify invited user
    this.server.to(`user:${payload.friendId}`).emit('party:invite:received', {
      partyId: party.id,
      from: client.user.uid,
      expiresAt: invite.expiresAt,
    });

    return { success: true };
  }

  @SubscribeMessage('party:join')
  handlePartyJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { partyId: string },
  ) {
    const party = this.partyService.joinParty(payload.partyId, client.user.uid);
    client.join(`party:${party.id}`);

    // Notify party members
    this.server.to(`party:${party.id}`).emit('party:member:joined', {
      userId: client.user.uid,
    });

    return { party };
  }

  @SubscribeMessage('party:leave')
  handlePartyLeave(@ConnectedSocket() client: AuthenticatedSocket) {
    const party = this.partyService.getUserParty(client.user.uid);
    if (!party) return { success: true };

    const partyId = party.id;
    this.partyService.leaveParty(client.user.uid);
    client.leave(`party:${partyId}`);

    // Notify remaining members
    this.broadcastPartyUpdate(partyId);

    return { success: true };
  }

  private async notifyFriendsOfPresenceChange(userId: string) {
    const presence = this.presenceService.getPresence(userId);
    this.server.to(`presence:${userId}`).emit('presence:update', {
      userId,
      presence,
    });
  }

  private broadcastPartyUpdate(partyId: string) {
    const party = this.partyService.getParty(partyId);
    this.server.to(`party:${partyId}`).emit('party:update', { party });
  }
}
```

### 7.2 Social Module

```typescript
// social.module.ts

@Module({
  imports: [
    CommonModule,
    AuthModule,
    PersistenceModule,
  ],
  providers: [
    SocialGateway,
    FriendsService,
    PartyService,
    PresenceService,
    LeaderboardRepository,
  ],
  exports: [
    FriendsService,
    PartyService,
    PresenceService,
  ],
})
export class SocialModule {}
```

---

## Event Summary

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `friend:request:send` | `{ targetId }` | Send friend request |
| `friend:request:respond` | `{ requestId, accept }` | Accept/reject request |
| `friend:remove` | `{ friendId }` | Remove friend |
| `friend:block` | `{ userId }` | Block user |
| `party:create` | `{}` | Create party |
| `party:invite` | `{ friendId }` | Invite to party |
| `party:join` | `{ partyId }` | Accept party invite |
| `party:leave` | `{}` | Leave party |
| `presence:subscribe` | `{}` | Subscribe to friend presence |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `friend:request:received` | `{ requestId, from }` | Incoming request |
| `friend:added` | `{ friend }` | Friend added |
| `friend:removed` | `{ friendId }` | Friend removed |
| `party:invite:received` | `{ partyId, from }` | Party invitation |
| `party:member:joined` | `{ userId }` | Someone joined party |
| `party:member:left` | `{ userId }` | Someone left party |
| `party:update` | `{ party }` | Party state changed |
| `presence:update` | `{ userId, presence }` | Friend presence changed |

---

## References

- [Firebase Firestore Arrays](https://firebase.google.com/docs/firestore/manage-data/add-data#update_elements_in_an_array)
- [Socket.io Rooms](https://socket.io/docs/v4/rooms/)

---

*Document Version: 1.0 | Last Updated: February 2026*
