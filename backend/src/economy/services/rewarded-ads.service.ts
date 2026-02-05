/**
 * ==========================================================
 * REWARD SERVICE (REWARDED ADS)
 * ==========================================================
 * BluffBuddy Online - Rewarded Advertisement Service
 *
 * @owner DEV3 (Social/Data)
 * @version v0.2.0
 * @see docs/v0.1.0/08-Monetization.md - Section 5
 * @implements IRewardService
 *
 * SERVICE RESPONSIBILITIES:
 * - Handle ad completion callbacks
 * - Verify ad completion with SSV
 * - Grant ad rewards
 * - Enforce daily limits
 * ==========================================================
 */

import { Injectable, Inject } from '@nestjs/common';
import {
  DI_TOKENS,
  IRewardService,
  IWalletService,
  ITransactionService,
} from '../../shared/contracts';

@Injectable()
export class RewardService implements IRewardService {
  constructor(
    @Inject(DI_TOKENS.WALLET_SERVICE)
    private readonly walletService: IWalletService,
    @Inject(DI_TOKENS.TRANSACTION_SERVICE)
    private readonly transactionService: ITransactionService,
  ) {}

  // TODO v0.3.0: Implement claimDailyReward
  async claimDailyReward(
    userId: string,
  ): Promise<{ coins: number; streak: number }> {
    throw new Error('RewardService.claimDailyReward not implemented');
  }

  // TODO v0.3.0: Implement claimAdReward
  async claimAdReward(
    userId: string,
    adId: string,
    signature: string,
  ): Promise<{ coins: number }> {
    throw new Error('RewardService.claimAdReward not implemented');
  }

  // TODO v0.3.0: Implement getRewardStatus
  async getRewardStatus(userId: string): Promise<{
    dailyRewardAvailable: boolean;
    adsWatchedToday: number;
    maxAdsPerDay: number;
    nextAdAvailableAt?: Date;
  }> {
    throw new Error('RewardService.getRewardStatus not implemented');
  }
}

// Legacy alias for backward compatibility
export { RewardService as RewardedAdsService };
