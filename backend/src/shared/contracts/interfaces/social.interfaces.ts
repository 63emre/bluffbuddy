/**
 * ==========================================================
 * SOCIAL MODULE INTERFACES
 * ==========================================================
 * BluffBuddy Online - Social Features Abstractions
 *
 * @owner DEV3 (Social)
 * @version v0.2.0
 * @see docs/v0.1.0/07-Social-Features.md
 *
 * PURPOSE:
 * These interfaces define the social features API.
 * Game module can use these without knowing implementation.
 *
 * RULES:
 * 1. Keep interfaces focused (ISP)
 * 2. Use DTOs for validation at gateway level
 * ==========================================================
 */

import { IParty, IFriendRequest, IUserProfile } from '../entities';
import { ConnectionStatus } from '../enums';

// ============================================
// FRIEND SERVICE INTERFACE
// ============================================

/**
 * Friend Service Interface
 * Manages friend relationships
 *
 * @see docs/v0.1.0/07-Social-Features.md
 */
export interface IFriendService {
  /**
   * Send a friend request
   * @param fromUserId Sender's UID
   * @param toUserId Recipient's UID
   * @returns Created request
   */
  sendRequest(fromUserId: string, toUserId: string): Promise<IFriendRequest>;

  /**
   * Accept a friend request
   * @param requestId Request ID
   * @param userId User accepting (must be recipient)
   */
  acceptRequest(requestId: string, userId: string): Promise<void>;

  /**
   * Reject a friend request
   * @param requestId Request ID
   * @param userId User rejecting (must be recipient)
   */
  rejectRequest(requestId: string, userId: string): Promise<void>;

  /**
   * Remove a friend
   * @param userId User's UID
   * @param friendId Friend's UID
   */
  removeFriend(userId: string, friendId: string): Promise<void>;

  /**
   * Get user's friend list with profiles
   * @param userId User's UID
   * @returns Array of friend profiles
   */
  getFriends(userId: string): Promise<IUserProfile[]>;

  /**
   * Get pending friend requests
   * @param userId User's UID
   * @returns Incoming requests
   */
  getPendingRequests(userId: string): Promise<IFriendRequest[]>;

  /**
   * Check if two users are friends
   * @param userId1 First user
   * @param userId2 Second user
   * @returns True if friends
   */
  areFriends(userId1: string, userId2: string): Promise<boolean>;

  /**
   * Get online friends
   * @param userId User's UID
   * @returns Online friend profiles
   */
  getOnlineFriends(userId: string): Promise<IUserProfile[]>;
}

// ============================================
// PARTY SERVICE INTERFACE
// ============================================

/**
 * Party Service Interface
 * Manages pre-game lobby groups
 *
 * @see docs/v0.1.0/07-Social-Features.md
 */
export interface IPartyService {
  /**
   * Create a new party
   * @param leaderId Party leader's UID
   * @returns Created party
   */
  createParty(leaderId: string): Promise<IParty>;

  /**
   * Invite a user to party
   * @param partyId Party ID
   * @param inviterId Inviter's UID (must be leader)
   * @param inviteeId Invitee's UID
   */
  inviteToParty(
    partyId: string,
    inviterId: string,
    inviteeId: string,
  ): Promise<void>;

  /**
   * Accept party invitation
   * @param partyId Party ID
   * @param userId User accepting
   */
  acceptInvite(partyId: string, userId: string): Promise<void>;

  /**
   * Decline party invitation
   * @param partyId Party ID
   * @param userId User declining
   */
  declineInvite(partyId: string, userId: string): Promise<void>;

  /**
   * Leave a party
   * @param partyId Party ID
   * @param userId User leaving
   */
  leaveParty(partyId: string, userId: string): Promise<void>;

  /**
   * Kick a member from party
   * @param partyId Party ID
   * @param leaderId Leader's UID (authorization)
   * @param memberId Member to kick
   */
  kickMember(
    partyId: string,
    leaderId: string,
    memberId: string,
  ): Promise<void>;

  /**
   * Disband a party
   * @param partyId Party ID
   * @param leaderId Leader's UID (authorization)
   */
  disbandParty(partyId: string, leaderId: string): Promise<void>;

  /**
   * Get party by ID
   * @param partyId Party ID
   * @returns Party or null
   */
  getParty(partyId: string): Promise<IParty | null>;

  /**
   * Get user's current party
   * @param userId User's UID
   * @returns Party or null
   */
  getUserParty(userId: string): Promise<IParty | null>;

  /**
   * Check if party is ready for matchmaking
   * @param partyId Party ID
   * @returns True if all members online
   */
  isPartyReady(partyId: string): Promise<boolean>;
}

// ============================================
// CHAT SERVICE INTERFACE
// ============================================

/**
 * Chat Message
 */
export interface IChatMessage {
  readonly messageId: string;
  readonly senderId: string;
  readonly roomId: string;
  readonly content: string;
  readonly timestamp: string;
  readonly type: 'quick' | 'emoji';
}

/**
 * Chat Service Interface
 * Handles in-game quick chat
 *
 * @see docs/v0.1.0/07-Social-Features.md
 */
export interface IChatService {
  /**
   * Send a quick chat message
   * @param senderId Sender's UID
   * @param roomId Room ID
   * @param messageId Predefined message ID
   * @returns Created message
   */
  sendQuickChat(
    senderId: string,
    roomId: string,
    messageId: string,
  ): Promise<IChatMessage>;

  /**
   * Send an emoji reaction
   * @param senderId Sender's UID
   * @param roomId Room ID
   * @param emoji Emoji string
   * @param targetPlayerId Optional target
   * @returns Created message
   */
  sendEmoji(
    senderId: string,
    roomId: string,
    emoji: string,
    targetPlayerId?: string,
  ): Promise<IChatMessage>;

  /**
   * Get available quick chat messages
   * @returns Map of messageId to text
   */
  getQuickChatOptions(): Map<string, string>;

  /**
   * Check if user is muted
   * @param userId User's UID
   * @param roomId Room ID
   * @returns True if muted
   */
  isUserMuted(userId: string, roomId: string): Promise<boolean>;

  /**
   * Mute a user in room
   * @param userId User to mute
   * @param roomId Room ID
   * @param durationSeconds Mute duration
   */
  muteUser(
    userId: string,
    roomId: string,
    durationSeconds: number,
  ): Promise<void>;
}

// ============================================
// PRESENCE SERVICE INTERFACE
// ============================================

/**
 * Presence Info
 */
export interface IPresenceInfo {
  readonly userId: string;
  readonly status: ConnectionStatus;
  readonly lastSeen: string;
  readonly currentRoomId?: string;
  readonly isInGame: boolean;
}

/**
 * Presence Service Interface
 * Tracks user online status
 *
 * @see docs/v0.1.0/07-Social-Features.md
 */
export interface IPresenceService {
  /**
   * Set user online
   * @param userId User's UID
   * @param socketId Socket connection ID
   */
  setOnline(userId: string, socketId: string): Promise<void>;

  /**
   * Set user offline
   * @param userId User's UID
   */
  setOffline(userId: string): Promise<void>;

  /**
   * Update user's current room
   * @param userId User's UID
   * @param roomId Room ID or null
   */
  setCurrentRoom(userId: string, roomId: string | null): Promise<void>;

  /**
   * Get user's presence info
   * @param userId User's UID
   * @returns Presence info
   */
  getPresence(userId: string): Promise<IPresenceInfo | null>;

  /**
   * Get multiple users' presence
   * @param userIds Array of UIDs
   * @returns Map of userId to presence
   */
  getPresenceMany(userIds: string[]): Promise<Map<string, IPresenceInfo>>;

  /**
   * Check if user is online
   * @param userId User's UID
   * @returns True if online
   */
  isOnline(userId: string): Promise<boolean>;

  /**
   * Get user's socket ID
   * @param userId User's UID
   * @returns Socket ID or null
   */
  getSocketId(userId: string): Promise<string | null>;

  /**
   * Subscribe to presence updates
   * @param userId User to watch
   * @param callback Callback on change
   * @returns Unsubscribe function
   */
  subscribeToPresence(
    userId: string,
    callback: (info: IPresenceInfo) => void,
  ): () => void;
}
