/**
 * ==========================================================
 * ECONOMY SERVICES INDEX
 * ==========================================================
 *
 * ARCHITECTURAL NOTE:
 * This barrel file is INTERNAL to the economy module.
 * External modules should NOT import from here.
 * Use DI_TOKENS to inject economy services.
 */

// Primary services (implement interfaces)
export { WalletService } from './wallet.service';
export { TransactionService, LedgerService } from './ledger.service';
export { PurchaseService, IapService } from './iap.service';
export { RewardService, RewardedAdsService } from './rewarded-ads.service';

// Helper services (internal only)
export { ChipService } from './chip.service';
export { AppleVerifierService } from './apple-verifier.service';
export { GoogleVerifierService } from './google-verifier.service';
