/**
 * ==========================================================
 * ECONOMY MODULE
 * ==========================================================
 * BluffBuddy Online - In-Game Economy Module
 *
 * @owner DEV3 (Social/Data)
 * @version v0.2.0
 * @see docs/v0.1.0/08-Monetization.md
 *
 * MODULE RESPONSIBILITIES:
 * - Chip management via WalletService
 * - Transaction ledger via TransactionService
 * - IAP verification via PurchaseService
 * - Rewarded ads via RewardService
 *
 * DI PATTERN:
 * This module uses interface-based dependency injection.
 * Other modules inject via DI_TOKENS, not concrete classes.
 * ==========================================================
 */

import { Module, forwardRef } from '@nestjs/common';
import { DI_TOKENS } from '../shared/contracts';
import { EconomyController } from './controllers';
import {
  WalletService,
  TransactionService,
  PurchaseService,
  RewardService,
} from './services';
import { AuthModule } from '../auth';
import { DatabaseModule } from '../database';

/**
 * EconomyModule
 * In-game economy and monetization for BluffBuddy
 *
 * @see docs/v0.1.0/08-Monetization.md
 */
@Module({
  imports: [forwardRef(() => AuthModule), forwardRef(() => DatabaseModule)],
  controllers: [EconomyController],
  providers: [
    // ============================================
    // INTERFACE-BASED PROVIDERS (Public API)
    // ============================================
    {
      provide: DI_TOKENS.WALLET_SERVICE,
      useClass: WalletService,
    },
    {
      provide: DI_TOKENS.TRANSACTION_SERVICE,
      useClass: TransactionService,
    },
    {
      provide: DI_TOKENS.PURCHASE_SERVICE,
      useClass: PurchaseService,
    },
    {
      provide: DI_TOKENS.REWARD_SERVICE,
      useClass: RewardService,
    },

    // ============================================
    // CONCRETE CLASS PROVIDERS (Internal use)
    // ============================================
    WalletService,
    TransactionService,
    PurchaseService,
    RewardService,
  ],
  exports: [
    // ============================================
    // ONLY EXPORT DI TOKENS - NEVER CONCRETE CLASSES
    // ============================================
    DI_TOKENS.WALLET_SERVICE,
    DI_TOKENS.TRANSACTION_SERVICE,
    DI_TOKENS.PURCHASE_SERVICE,
    DI_TOKENS.REWARD_SERVICE,
  ],
})
export class EconomyModule {}
