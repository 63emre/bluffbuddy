/**
 * ==========================================================
 * ECONOMY MODULE INTERFACES
 * ==========================================================
 * BluffBuddy Online - Economy Service Contracts
 *
 * @owner DEV3 (Social/Data)
 * @version v0.2.0
 * @see docs/v0.1.0/08-Monetization.md
 *
 * INTERFACE RESPONSIBILITIES:
 * - Define wallet operations
 * - Define transaction tracking
 * - Define purchase verification
 * - Define reward system
 * ==========================================================
 */

/**
 * Wallet balance structure
 */
export interface IWalletBalance {
  coins: number;
  gems: number;
}

/**
 * IWalletService
 * Manages user virtual currency wallets
 */
export interface IWalletService {
  /**
   * Get user's current wallet balance
   */
  getBalance(userId: string): Promise<IWalletBalance>;

  /**
   * Add coins to user wallet
   * @returns New coin balance
   */
  addCoins(userId: string, amount: number, reason: string): Promise<number>;

  /**
   * Add gems to user wallet
   * @returns New gem balance
   */
  addGems(userId: string, amount: number, reason: string): Promise<number>;

  /**
   * Deduct coins from user wallet
   * @returns New coin balance
   * @throws InsufficientFundsError if balance too low
   */
  deductCoins(userId: string, amount: number, reason: string): Promise<number>;

  /**
   * Deduct gems from user wallet
   * @returns New gem balance
   * @throws InsufficientFundsError if balance too low
   */
  deductGems(userId: string, amount: number, reason: string): Promise<number>;
}

/**
 * Transaction record structure
 */
export interface ITransaction {
  id: string;
  userId: string;
  type: string;
  amount: number;
  balanceAfter: number;
  reason: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

/**
 * ITransactionService
 * Records and queries transaction history
 */
export interface ITransactionService {
  /**
   * Record a new transaction
   * @returns Transaction ID
   */
  recordTransaction(
    userId: string,
    type: string,
    amount: number,
    reason: string,
  ): Promise<string>;

  /**
   * Get user's transaction history with pagination
   */
  getTransactionHistory(
    userId: string,
    limit?: number,
    cursor?: string,
  ): Promise<{ transactions: ITransaction[]; nextCursor?: string }>;

  /**
   * Get a single transaction by ID
   */
  getTransaction(transactionId: string): Promise<ITransaction | null>;
}

/**
 * Purchase verification result
 */
export interface IPurchaseVerifyResult {
  valid: boolean;
  productId?: string;
  transactionId?: string;
  error?: string;
}

/**
 * IPurchaseService
 * Verifies and fulfills in-app purchases
 */
export interface IPurchaseService {
  /**
   * Verify Apple App Store receipt
   */
  verifyApplePurchase(
    userId: string,
    receipt: string,
  ): Promise<IPurchaseVerifyResult>;

  /**
   * Verify Google Play purchase
   */
  verifyGooglePurchase(
    userId: string,
    token: string,
    productId: string,
  ): Promise<IPurchaseVerifyResult>;

  /**
   * Fulfill a verified purchase
   */
  fulfillPurchase(
    userId: string,
    productId: string,
    transactionId: string,
  ): Promise<void>;

  /**
   * Get user's purchase history
   */
  getPurchaseHistory(userId: string): Promise<any[]>;
}

/**
 * Reward status structure
 */
export interface IRewardStatus {
  dailyRewardAvailable: boolean;
  adsWatchedToday: number;
  maxAdsPerDay: number;
  nextAdAvailableAt?: Date;
  currentStreak: number;
}

/**
 * IRewardService
 * Manages daily rewards and ad rewards
 */
export interface IRewardService {
  /**
   * Claim daily login reward
   * @returns Coins awarded and current streak
   */
  claimDailyReward(userId: string): Promise<{ coins: number; streak: number }>;

  /**
   * Claim reward for watching ad
   * @param adId - Ad network's ad identifier
   * @param signature - SSV signature for verification
   */
  claimAdReward(
    userId: string,
    adId: string,
    signature: string,
  ): Promise<{ coins: number }>;

  /**
   * Get user's current reward status
   */
  getRewardStatus(userId: string): Promise<IRewardStatus>;
}

// Import ILeaderboardEntry from entities to avoid duplicate
import type { ILeaderboardEntry } from '../entities';
export type { ILeaderboardEntry };

/**
 * ILeaderboardService
 * Queries leaderboard rankings
 */
export interface ILeaderboardService {
  /**
   * Get global leaderboard
   */
  getGlobalLeaderboard(
    limit?: number,
    offset?: number,
  ): Promise<ILeaderboardEntry[]>;

  /**
   * Get user's rank and nearby players
   */
  getUserRankWithContext(
    userId: string,
    contextSize?: number,
  ): Promise<{
    userRank: ILeaderboardEntry;
    above: ILeaderboardEntry[];
    below: ILeaderboardEntry[];
  }>;

  /**
   * Get friends leaderboard
   */
  getFriendsLeaderboard(userId: string): Promise<ILeaderboardEntry[]>;
}
