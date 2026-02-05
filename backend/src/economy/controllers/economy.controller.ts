/**
 * ==========================================================
 * ECONOMY CONTROLLER
 * ==========================================================
 * BluffBuddy Online - Economy HTTP Endpoints
 *
 * @owner DEV3 (Social/Data)
 * @version v0.2.0
 *
 * CONTROLLER RESPONSIBILITIES:
 * - Chip balance queries
 * - Transaction history
 * - IAP receipt verification
 * - Rewarded ad callbacks
 *
 * ECONOMY MODEL:
 * - Chips: In-game currency for betting
 * - Purchases: Real-money IAP for chip packs
 * - Rewards: Chips from watching ads, daily login
 * ==========================================================
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
  ApiProperty,
} from '@nestjs/swagger';
import { DI_TOKENS } from '@contracts';

// ============================================
// REQUEST DTOs
// ============================================

class VerifyIAPRequest {
  @ApiProperty({ enum: ['ios', 'android'], example: 'ios' })
  platform!: 'ios' | 'android';

  @ApiProperty({ example: 'com.bluffbuddy.chips.100' })
  productId!: string;

  @ApiProperty({ example: 'MIIbdgYJKoZIhvcN...' })
  receiptData!: string;

  @ApiProperty({ example: '1000000123456789' })
  transactionId!: string;
}

class RewardedAdCallbackRequest {
  @ApiProperty({ enum: ['admob', 'unity', 'applovin'], example: 'admob' })
  adNetwork!: 'admob' | 'unity' | 'applovin';

  @ApiProperty({ example: 'daily_reward' })
  placementId!: string;

  @ApiProperty({ enum: ['chips', 'spin'], example: 'chips' })
  rewardType!: 'chips' | 'spin';

  @ApiProperty({ example: 'abc123...' })
  verificationToken!: string;
}

// ============================================
// RESPONSE DTOs
// ============================================

class WalletResponse {
  @ApiProperty({ example: 1500 })
  chips!: number;

  @ApiProperty({ example: 0 })
  gems!: number;

  @ApiProperty({ example: 3 })
  freeSpins!: number;

  @ApiProperty({ example: '2026-02-05T10:00:00Z', nullable: true })
  lastFreeChipsClaim!: string | null;

  @ApiProperty({ example: true })
  canClaimFreeChips!: boolean;
}

class TransactionResponse {
  @ApiProperty({ example: 'txn_abc123' })
  id!: string;

  @ApiProperty({
    enum: ['purchase', 'reward', 'bet_win', 'bet_loss', 'free_claim'],
  })
  type!: 'purchase' | 'reward' | 'bet_win' | 'bet_loss' | 'free_claim';

  @ApiProperty({ example: 100 })
  amount!: number;

  @ApiProperty({ example: 1600 })
  balanceAfter!: number;

  @ApiProperty({ example: {} })
  metadata!: Record<string, unknown>;

  @ApiProperty({ example: '2026-02-05T10:00:00Z' })
  createdAt!: string;
}

class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 100 })
  total!: number;

  @ApiProperty({ example: true })
  hasMore!: boolean;
}

class TransactionHistoryResponse {
  @ApiProperty({ type: [TransactionResponse] })
  transactions!: TransactionResponse[];

  @ApiProperty({ type: () => PaginationMetaDto })
  pagination!: PaginationMetaDto;
}

class ChipPackResponse {
  @ApiProperty({ example: 'pack_100' })
  id!: string;

  @ApiProperty({ example: 100 })
  chips!: number;

  @ApiProperty({ example: 10 })
  bonusChips!: number;

  @ApiProperty({ example: 0.99 })
  price!: number;

  @ApiProperty({ example: 'USD' })
  currency!: string;

  @ApiProperty({ example: 'com.bluffbuddy.chips.100' })
  productId!: string;

  @ApiProperty({ example: false })
  isPopular!: boolean;

  @ApiProperty({ example: false })
  isBestValue!: boolean;
}

class ShopResponse {
  @ApiProperty({ type: [ChipPackResponse] })
  chipPacks!: ChipPackResponse[];

  @ApiProperty({ type: [ChipPackResponse] })
  dailyDeals!: ChipPackResponse[];

  @ApiProperty({ example: 50 })
  freeChipsAmount!: number;

  @ApiProperty({ example: 4 })
  freeChipsCooldownHours!: number;
}

// ============================================
// CONTROLLER
// ============================================

@ApiTags('Economy')
@ApiBearerAuth('firebase-auth')
@Controller('economy')
export class EconomyController {
  constructor(
    @Inject(DI_TOKENS.WALLET_SERVICE) private readonly walletService: unknown,
    @Inject(DI_TOKENS.TRANSACTION_SERVICE)
    private readonly transactionService: unknown,
  ) {}

  @Get('wallet')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get wallet balance',
    description:
      'Returns the current chip balance and economy state for the user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Wallet retrieved',
    type: WalletResponse,
  })
  async getWallet(): Promise<WalletResponse> {
    // TODO: Implement wallet retrieval
    throw new Error('Not implemented - ECONOMY_WALLET');
  }

  @Get('shop')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get shop items',
    description: 'Returns available chip packs and deals for purchase.',
  })
  @ApiResponse({
    status: 200,
    description: 'Shop items retrieved',
    type: ShopResponse,
  })
  async getShop(): Promise<ShopResponse> {
    // TODO: Implement shop retrieval
    throw new Error('Not implemented - ECONOMY_SHOP');
  }

  @Get('transactions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get transaction history',
    description: 'Returns paginated transaction history for the user.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['purchase', 'reward', 'bet_win', 'bet_loss', 'free_claim'],
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction history retrieved',
    type: TransactionHistoryResponse,
  })
  async getTransactions(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
  ): Promise<TransactionHistoryResponse> {
    // TODO: Implement transaction history
    throw new Error('Not implemented - ECONOMY_TRANSACTIONS');
  }

  @Post('claim-free')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Claim free chips',
    description: 'Claims free chips if cooldown has expired (every 4 hours).',
  })
  @ApiResponse({
    status: 200,
    description: 'Free chips claimed',
    type: WalletResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Cooldown not expired',
  })
  async claimFreeChips(): Promise<WalletResponse> {
    // TODO: Implement free chip claim
    throw new Error('Not implemented - ECONOMY_CLAIM_FREE');
  }

  @Post('iap/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify IAP receipt',
    description: `
Verifies an in-app purchase receipt with Apple/Google servers.

**Flow:**
1. Client completes purchase in app store
2. Client sends receipt to this endpoint
3. Server validates with Apple/Google
4. Server credits chips if valid
5. Returns updated wallet

**Idempotency:**
Each transaction ID can only be used once. Duplicate requests return success
but don't credit additional chips.
    `,
  })
  @ApiBody({ type: VerifyIAPRequest })
  @ApiResponse({
    status: 200,
    description: 'Purchase verified and chips credited',
    type: WalletResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid receipt or already processed',
  })
  async verifyIAP(@Body() dto: VerifyIAPRequest): Promise<WalletResponse> {
    // TODO: Implement IAP verification
    throw new Error('Not implemented - ECONOMY_IAP_VERIFY');
  }

  @Post('ads/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rewarded ad callback',
    description: `
Server-to-server callback for rewarded ad completion.

**Security:**
This endpoint validates the callback using the ad network's
server-to-server verification system to prevent fraud.
    `,
  })
  @ApiBody({ type: RewardedAdCallbackRequest })
  @ApiResponse({
    status: 200,
    description: 'Reward credited',
    type: WalletResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid verification token',
  })
  async rewardedAdCallback(
    @Body() dto: RewardedAdCallbackRequest,
  ): Promise<WalletResponse> {
    // TODO: Implement rewarded ad callback
    throw new Error('Not implemented - ECONOMY_AD_CALLBACK');
  }
}
