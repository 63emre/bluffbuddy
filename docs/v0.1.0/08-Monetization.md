# 08 - Monetization & In-App Purchases

> **Owner:** Developer 3 (Data & Social)  
> **Last Updated:** February 2026  
> **Status:** Specification

---

## Table of Contents

1. [Overview](#1-overview)
2. [Virtual Economy](#2-virtual-economy)
3. [IAP Products](#3-iap-products)
4. [Server-Side Validation](#4-server-side-validation)
5. [Apple App Store Integration](#5-apple-app-store-integration)
6. [Google Play Integration](#6-google-play-integration)
7. [Security Measures](#7-security-measures)
8. [Implementation](#8-implementation)

---

## 1. Overview

BluffBuddy Online uses a **free-to-play** model with optional in-app purchases (IAP). The monetization strategy focuses on cosmetics and convenience, NOT pay-to-win mechanics.

### Monetization Principles

| Principle | Description |
|-----------|-------------|
| **No Pay-to-Win** | Purchases don't affect gameplay or competitive advantage |
| **Fair Progression** | Free players can access all core features |
| **Cosmetic Focus** | Premium items are visual customizations only |
| **Transparent Pricing** | Clear value proposition for all purchases |

### Revenue Streams

```
┌─────────────────────────────────────────────────────────────────┐
│                    REVENUE STREAMS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   1. COSMETIC PURCHASES (Primary)                               │
│      • Card backs                                               │
│      • Avatars / Profile frames                                 │
│      • Emotes / Reactions                                       │
│      • Table themes                                             │
│                                                                  │
│   2. PREMIUM CURRENCY (Gems)                                    │
│      • Can buy cosmetics                                        │
│      • Faster unlock of items                                   │
│      • Battle Pass premium track                                │
│                                                                  │
│   3. BATTLE PASS (Future - v0.2.0)                              │
│      • Seasonal content                                         │
│      • Free + Premium tracks                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Virtual Economy

### 2.1 Currency Types

| Currency | Name | How to Earn | What It Buys |
|----------|------|-------------|--------------|
| 🪙 **Coins** | Soft currency | Win games, daily rewards, achievements | Basic cosmetics, common items |
| 💎 **Gems** | Premium currency | Real money purchase, rare achievements | Premium cosmetics, battle pass |

### 2.2 Economy Balance

```typescript
// Economy constants
const ECONOMY = {
  // Coin earnings
  COIN_REWARDS: {
    WIN_1ST: 100,
    WIN_2ND: 60,
    WIN_3RD: 30,
    WIN_4TH: 10,
    DAILY_LOGIN: 50,
    WEEKLY_BONUS: 200,
    ACHIEVEMENT: 50, // varies by achievement
  },
  
  // Gem earnings (rare)
  GEM_REWARDS: {
    FIRST_WIN: 10,        // One-time
    RANK_UP: 5,           // When reaching new rank
    SEASON_END: 50,       // Based on rank
  },
  
  // Prices (in coins)
  COIN_PRICES: {
    COMMON_CARD_BACK: 500,
    RARE_CARD_BACK: 1500,
    COMMON_AVATAR: 300,
    RARE_AVATAR: 1000,
    EMOTE: 200,
  },
  
  // Prices (in gems - premium items only)
  GEM_PRICES: {
    LEGENDARY_CARD_BACK: 200,
    LEGENDARY_AVATAR: 150,
    PREMIUM_EMOTE_PACK: 100,
    BATTLE_PASS: 500,
  },
};
```

### 2.3 Wallet Management

```typescript
interface UserWallet {
  coins: number;
  gems: number;
  lastDailyReward: Date | null;
  consecutiveLogins: number;
}

@Injectable()
export class WalletService {
  constructor(
    @Inject('IUserRepository')
    private userRepository: IUserRepository,
    private firestore: FirestoreService,
  ) {}

  /**
   * Add currency to wallet (server-side only)
   */
  async addCurrency(
    userId: string,
    type: 'coins' | 'gems',
    amount: number,
    reason: string,
  ): Promise<UserWallet> {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    const field = type === 'coins' ? 'wallet.coins' : 'wallet.gems';
    
    await this.firestore
      .getFirestore()
      .collection('users')
      .doc(userId)
      .update({
        [field]: admin.firestore.FieldValue.increment(amount),
      });

    // Log transaction for audit
    await this.logTransaction(userId, type, amount, reason);

    const user = await this.userRepository.findById(userId);
    return user!.wallet;
  }

  /**
   * Spend currency (with validation)
   */
  async spendCurrency(
    userId: string,
    type: 'coins' | 'gems',
    amount: number,
    reason: string,
  ): Promise<{ success: boolean; wallet?: UserWallet; error?: string }> {
    if (amount <= 0) {
      return { success: false, error: 'Invalid amount' };
    }

    const db = this.firestore.getFirestore();
    const userRef = db.collection('users').doc(userId);

    try {
      let newWallet: UserWallet;

      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
          throw new Error('User not found');
        }

        const wallet = userDoc.data()!.wallet as UserWallet;
        const currentBalance = type === 'coins' ? wallet.coins : wallet.gems;

        if (currentBalance < amount) {
          throw new Error('INSUFFICIENT_FUNDS');
        }

        const field = type === 'coins' ? 'wallet.coins' : 'wallet.gems';
        transaction.update(userRef, {
          [field]: currentBalance - amount,
        });

        newWallet = {
          ...wallet,
          [type]: currentBalance - amount,
        };
      });

      // Log transaction
      await this.logTransaction(userId, type, -amount, reason);

      return { success: true, wallet: newWallet! };
    } catch (error) {
      if (error.message === 'INSUFFICIENT_FUNDS') {
        return { success: false, error: 'ERR_INSUFFICIENT_FUNDS' };
      }
      throw error;
    }
  }

  /**
   * Process daily login reward
   */
  async processDailyReward(userId: string): Promise<{
    coins: number;
    streak: number;
    nextRewardAt: Date;
  } | null> {
    const db = this.firestore.getFirestore();
    const userRef = db.collection('users').doc(userId);

    return await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const wallet = userDoc.data()!.wallet as UserWallet;
      const now = new Date();

      // Check if already claimed today
      if (wallet.lastDailyReward) {
        const lastReward = wallet.lastDailyReward.toDate();
        if (this.isSameDay(lastReward, now)) {
          return null; // Already claimed
        }

        // Check streak
        const isConsecutive = this.isConsecutiveDay(lastReward, now);
        wallet.consecutiveLogins = isConsecutive
          ? wallet.consecutiveLogins + 1
          : 1;
      } else {
        wallet.consecutiveLogins = 1;
      }

      // Calculate reward with streak bonus
      const baseReward = ECONOMY.COIN_REWARDS.DAILY_LOGIN;
      const streakBonus = Math.min(wallet.consecutiveLogins - 1, 6) * 10; // Max +60 at 7 days
      const totalReward = baseReward + streakBonus;

      // Update wallet
      transaction.update(userRef, {
        'wallet.coins': admin.firestore.FieldValue.increment(totalReward),
        'wallet.lastDailyReward': now,
        'wallet.consecutiveLogins': wallet.consecutiveLogins,
      });

      return {
        coins: totalReward,
        streak: wallet.consecutiveLogins,
        nextRewardAt: this.getNextMidnight(now),
      };
    });
  }

  private async logTransaction(
    userId: string,
    currency: string,
    amount: number,
    reason: string,
  ): Promise<void> {
    await this.firestore
      .getFirestore()
      .collection('currencyLogs')
      .add({
        odindexerId: userId,
        currency,
        amount,
        reason,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
  }

  private isSameDay(d1: Date, d2: Date): boolean {
    return d1.toDateString() === d2.toDateString();
  }

  private isConsecutiveDay(d1: Date, d2: Date): boolean {
    const diff = d2.getTime() - d1.getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    return diff >= dayMs && diff < 2 * dayMs;
  }

  private getNextMidnight(date: Date): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 0, 0);
    return next;
  }
}
```

---

## 3. IAP Products

### 3.1 Product Catalog

| Product ID | Type | Price (USD) | Contents |
|------------|------|-------------|----------|
| `gems_100` | Consumable | $0.99 | 100 Gems |
| `gems_500` | Consumable | $4.99 | 500 Gems (+50 bonus) |
| `gems_1200` | Consumable | $9.99 | 1200 Gems (+200 bonus) |
| `gems_3000` | Consumable | $24.99 | 3000 Gems (+600 bonus) |
| `starter_pack` | Non-Consumable | $4.99 | 200 Gems + 1000 Coins + Rare Card Back |
| `battle_pass_s1` | Subscription* | $4.99 | Season 1 Battle Pass |

*Battle Pass is technically non-consumable per season

### 3.2 Product Configuration

```typescript
// config/iap-products.ts

interface IAPProduct {
  id: string;
  type: 'consumable' | 'non_consumable' | 'subscription';
  rewards: {
    gems?: number;
    coins?: number;
    items?: string[];
  };
  price: {
    usd: number;
    tier: string;  // Apple/Google price tier
  };
}

const IAP_PRODUCTS: Record<string, IAPProduct> = {
  'gems_100': {
    id: 'gems_100',
    type: 'consumable',
    rewards: { gems: 100 },
    price: { usd: 0.99, tier: 'tier_1' },
  },
  'gems_500': {
    id: 'gems_500',
    type: 'consumable',
    rewards: { gems: 550 },  // 500 + 50 bonus
    price: { usd: 4.99, tier: 'tier_5' },
  },
  'gems_1200': {
    id: 'gems_1200',
    type: 'consumable',
    rewards: { gems: 1400 },  // 1200 + 200 bonus
    price: { usd: 9.99, tier: 'tier_10' },
  },
  'gems_3000': {
    id: 'gems_3000',
    type: 'consumable',
    rewards: { gems: 3600 },  // 3000 + 600 bonus
    price: { usd: 24.99, tier: 'tier_25' },
  },
  'starter_pack': {
    id: 'starter_pack',
    type: 'non_consumable',
    rewards: {
      gems: 200,
      coins: 1000,
      items: ['card_back_royal'],
    },
    price: { usd: 4.99, tier: 'tier_5' },
  },
};
```

---

## 4. Server-Side Validation

### 4.1 Why Server-Side?

**CRITICAL:** Never trust client-side purchase claims. Always validate with store servers.

```
┌─────────────────────────────────────────────────────────────────┐
│                 WHY SERVER VALIDATION?                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Without server validation:                                    │
│   [Hacker] ──► "I bought gems_3000!" ──► Server trusts          │
│               (fake receipt)              Grants 3600 gems 💀    │
│                                                                  │
│   With server validation:                                       │
│   [Hacker] ──► "I bought gems_3000!" ──► Server validates ──►   │
│               (fake receipt)              with Apple/Google      │
│                                           REJECTED ✓             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Validation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  IAP VALIDATION FLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   1. CLIENT COMPLETES PURCHASE                                  │
│      [Mobile App] ◄──► [App Store / Play Store]                 │
│      Receives: receipt / purchase token                         │
│                                                                  │
│   2. CLIENT SENDS TO SERVER                                     │
│      POST /api/iap/verify                                       │
│      {                                                          │
│        store: 'apple' | 'google',                               │
│        productId: 'gems_500',                                   │
│        receipt: 'base64_encoded_receipt...',                    │
│        transactionId: 'unique_id'                               │
│      }                                                          │
│                                                                  │
│   3. SERVER VALIDATES WITH STORE                                │
│      [Server] ──► [Apple/Google API]                            │
│      Verifies: Receipt is valid, not used, for this product     │
│                                                                  │
│   4. SERVER GRANTS ITEMS (if valid)                             │
│      • Add gems/coins to wallet                                 │
│      • Add items to inventory                                   │
│      • Record transaction (idempotency)                         │
│                                                                  │
│   5. SERVER RESPONDS                                            │
│      { success: true, wallet: {...} }                           │
│                                                                  │
│   6. CLIENT CONFIRMS WITH STORE                                 │
│      [Mobile App] ──► finishTransaction()                       │
│      (Marks purchase as consumed)                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Apple App Store Integration

### 5.1 App Store Server API v2

Apple's modern API uses JWT-based authentication:

```typescript
// services/apple-verifier.service.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';

interface AppleVerificationResult {
  valid: boolean;
  productId?: string;
  transactionId?: string;
  purchaseDate?: Date;
  expirationDate?: Date;  // For subscriptions
  error?: string;
}

@Injectable()
export class AppleVerifierService {
  private readonly baseUrl: string;
  private readonly bundleId: string;
  private readonly keyId: string;
  private readonly issuerId: string;
  private readonly privateKey: string;

  constructor(private config: ConfigService) {
    const isProduction = config.get('NODE_ENV') === 'production';
    this.baseUrl = isProduction
      ? 'https://api.storekit.itunes.apple.com'
      : 'https://api.storekit-sandbox.itunes.apple.com';
    
    this.bundleId = config.get('APPLE_BUNDLE_ID')!;
    this.keyId = config.get('APPLE_KEY_ID')!;
    this.issuerId = config.get('APPLE_ISSUER_ID')!;
    this.privateKey = config.get('APPLE_PRIVATE_KEY')!;
  }

  /**
   * Verify a purchase receipt with Apple
   */
  async verifyPurchase(
    transactionId: string,
  ): Promise<AppleVerificationResult> {
    try {
      const token = this.generateJWT();
      
      const response = await axios.get(
        `${this.baseUrl}/inApps/v1/transactions/${transactionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const { signedTransactionInfo } = response.data;
      const decoded = this.decodeSignedTransaction(signedTransactionInfo);

      return {
        valid: true,
        productId: decoded.productId,
        transactionId: decoded.transactionId,
        purchaseDate: new Date(decoded.purchaseDate),
        expirationDate: decoded.expiresDate
          ? new Date(decoded.expiresDate)
          : undefined,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          return { valid: false, error: 'TRANSACTION_NOT_FOUND' };
        }
      }
      return { valid: false, error: 'VERIFICATION_FAILED' };
    }
  }

  /**
   * Generate JWT for App Store Server API authentication
   */
  private generateJWT(): string {
    const now = Math.floor(Date.now() / 1000);
    
    const payload = {
      iss: this.issuerId,
      iat: now,
      exp: now + 3600,  // 1 hour
      aud: 'appstoreconnect-v1',
      bid: this.bundleId,
    };

    return jwt.sign(payload, this.privateKey, {
      algorithm: 'ES256',
      keyid: this.keyId,
    });
  }

  /**
   * Decode and verify signed transaction from Apple
   */
  private decodeSignedTransaction(signedTransaction: string): any {
    // Apple signs with JWS - decode and verify
    const parts = signedTransaction.split('.');
    const payload = Buffer.from(parts[1], 'base64').toString();
    return JSON.parse(payload);
  }
}
```

### 5.2 Apple Configuration

Required App Store Connect setup:
1. Create In-App Purchase products
2. Generate API Key (P8 file)
3. Note Key ID and Issuer ID

Environment variables:
```env
APPLE_BUNDLE_ID=com.bluffbuddy.game
APPLE_KEY_ID=ABC123DEF4
APPLE_ISSUER_ID=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

---

## 6. Google Play Integration

### 6.1 Google Play Developer API

```typescript
// services/google-verifier.service.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';

interface GoogleVerificationResult {
  valid: boolean;
  productId?: string;
  orderId?: string;
  purchaseTime?: Date;
  purchaseState?: number;  // 0=Purchased, 1=Canceled, 2=Pending
  consumptionState?: number;
  error?: string;
}

@Injectable()
export class GoogleVerifierService {
  private androidPublisher;
  private readonly packageName: string;

  constructor(private config: ConfigService) {
    this.packageName = config.get('GOOGLE_PACKAGE_NAME')!;
    
    // Initialize with service account credentials
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: config.get('GOOGLE_CLIENT_EMAIL'),
        private_key: config.get('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    });

    this.androidPublisher = google.androidpublisher({
      version: 'v3',
      auth,
    });
  }

  /**
   * Verify a purchase with Google Play
   */
  async verifyPurchase(
    productId: string,
    purchaseToken: string,
  ): Promise<GoogleVerificationResult> {
    try {
      const response = await this.androidPublisher.purchases.products.get({
        packageName: this.packageName,
        productId,
        token: purchaseToken,
      });

      const purchase = response.data;

      // Check purchase state
      if (purchase.purchaseState !== 0) {
        return {
          valid: false,
          error: 'PURCHASE_NOT_COMPLETED',
          purchaseState: purchase.purchaseState,
        };
      }

      return {
        valid: true,
        productId,
        orderId: purchase.orderId,
        purchaseTime: new Date(parseInt(purchase.purchaseTimeMillis!)),
        purchaseState: purchase.purchaseState,
        consumptionState: purchase.consumptionState,
      };
    } catch (error) {
      if (error.code === 404) {
        return { valid: false, error: 'PURCHASE_NOT_FOUND' };
      }
      return { valid: false, error: 'VERIFICATION_FAILED' };
    }
  }

  /**
   * Acknowledge/Consume a purchase (required for consumables)
   */
  async acknowledgePurchase(
    productId: string,
    purchaseToken: string,
  ): Promise<boolean> {
    try {
      await this.androidPublisher.purchases.products.acknowledge({
        packageName: this.packageName,
        productId,
        token: purchaseToken,
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}
```

### 6.2 Google Configuration

Required Google Cloud Console setup:
1. Create service account with Android Publisher API access
2. Link service account in Google Play Console
3. Download JSON key file

Environment variables:
```env
GOOGLE_PACKAGE_NAME=com.bluffbuddy.game
GOOGLE_CLIENT_EMAIL=iap-verifier@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

---

## 7. Security Measures

### 7.1 Idempotency

Prevent double-granting from replay attacks:

```typescript
// Each transaction ID can only be used ONCE
async function processTransaction(
  transactionId: string,
  userId: string,
  productId: string,
): Promise<boolean> {
  const db = firestore.getFirestore();
  const txRef = db.collection('transactions').doc(transactionId);

  return await db.runTransaction(async (transaction) => {
    const txDoc = await transaction.get(txRef);
    
    if (txDoc.exists) {
      // Already processed!
      const existingTx = txDoc.data();
      if (existingTx.status === 'completed') {
        throw new Error('ERR_RECEIPT_ALREADY_USED');
      }
    }

    // Mark as processing
    transaction.set(txRef, {
      transactionId,
      odindexerId: userId,
      productId,
      status: 'completed',
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return true;
  });
}
```

### 7.2 Receipt Validation Best Practices

```typescript
const VALIDATION_RULES = {
  // Verify product ID matches what client claims
  verifyProductId: true,
  
  // Check transaction hasn't been refunded
  checkRefundStatus: true,
  
  // For subscriptions: verify still active
  checkSubscriptionStatus: true,
  
  // Rate limit verification attempts per user
  maxAttemptsPerHour: 10,
  
  // Log all attempts for audit
  auditLogging: true,
};
```

### 7.3 Fraud Indicators

Monitor for:
- Same receipt used by multiple accounts
- Jailbroken/rooted device indicators
- Velocity of purchases (too many too fast)
- Refund patterns

```typescript
interface FraudSignal {
  type: 'DUPLICATE_RECEIPT' | 'VELOCITY' | 'REFUND_PATTERN' | 'DEVICE_MODIFIED';
  severity: 'low' | 'medium' | 'high';
  userId: string;
  details: Record<string, any>;
}

// Flag suspicious activity for review
async function checkFraudSignals(
  userId: string,
  transactionId: string,
): Promise<FraudSignal[]> {
  const signals: FraudSignal[] = [];
  
  // Check velocity
  const recentPurchases = await getRecentPurchases(userId, '1h');
  if (recentPurchases.length > 5) {
    signals.push({
      type: 'VELOCITY',
      severity: 'medium',
      userId,
      details: { count: recentPurchases.length, window: '1h' },
    });
  }
  
  return signals;
}
```

---

## 8. Implementation

### 8.1 IAP Controller

```typescript
// iap.controller.ts

@Controller('iap')
@UseGuards(AuthGuard)
export class IapController {
  constructor(private iapService: IapService) {}

  @Post('verify')
  async verifyPurchase(
    @CurrentUser() user: AuthUser,
    @Body() payload: VerifyPurchaseDto,
  ): Promise<VerifyPurchaseResponse> {
    return this.iapService.verifyAndGrant(
      user.uid,
      payload.store,
      payload.productId,
      payload.receipt,
      payload.transactionId,
    );
  }

  @Get('products')
  async getProducts(): Promise<IAPProduct[]> {
    return Object.values(IAP_PRODUCTS);
  }
}

// DTOs
class VerifyPurchaseDto {
  @IsIn(['apple', 'google'])
  store: 'apple' | 'google';

  @IsString()
  productId: string;

  @IsString()
  receipt: string;  // Base64 for Apple, purchase token for Google

  @IsString()
  transactionId: string;
}

interface VerifyPurchaseResponse {
  success: boolean;
  wallet?: UserWallet;
  items?: string[];
  error?: string;
}
```

### 8.2 IAP Service

```typescript
// iap.service.ts

@Injectable()
export class IapService {
  constructor(
    private appleVerifier: AppleVerifierService,
    private googleVerifier: GoogleVerifierService,
    private walletService: WalletService,
    @Inject('IUserRepository')
    private userRepository: IUserRepository,
    private firestore: FirestoreService,
  ) {}

  async verifyAndGrant(
    userId: string,
    store: 'apple' | 'google',
    productId: string,
    receipt: string,
    transactionId: string,
  ): Promise<VerifyPurchaseResponse> {
    // 1. Check product exists
    const product = IAP_PRODUCTS[productId];
    if (!product) {
      return { success: false, error: 'ERR_INVALID_PRODUCT' };
    }

    // 2. Check idempotency
    const existingTx = await this.findTransaction(transactionId);
    if (existingTx) {
      if (existingTx.userId === userId && existingTx.status === 'completed') {
        // Return success (already granted)
        const user = await this.userRepository.findById(userId);
        return { success: true, wallet: user!.wallet };
      }
      return { success: false, error: 'ERR_RECEIPT_ALREADY_USED' };
    }

    // 3. Verify with store
    let verification: { valid: boolean; error?: string };
    
    if (store === 'apple') {
      verification = await this.appleVerifier.verifyPurchase(transactionId);
    } else {
      verification = await this.googleVerifier.verifyPurchase(productId, receipt);
    }

    if (!verification.valid) {
      // Log failed attempt
      await this.logFailedAttempt(userId, store, productId, verification.error);
      return { success: false, error: verification.error || 'ERR_INVALID_RECEIPT' };
    }

    // 4. Grant rewards in transaction
    const db = this.firestore.getFirestore();
    
    try {
      await db.runTransaction(async (transaction) => {
        const userRef = db.collection('users').doc(userId);
        const txRef = db.collection('transactions').doc(transactionId);

        // Record transaction
        transaction.set(txRef, {
          transactionId,
          odindexerId: userId,
          store,
          productId,
          status: 'completed',
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Grant rewards
        const updates: Record<string, any> = {};
        
        if (product.rewards.gems) {
          updates['wallet.gems'] = admin.firestore.FieldValue.increment(
            product.rewards.gems,
          );
        }
        
        if (product.rewards.coins) {
          updates['wallet.coins'] = admin.firestore.FieldValue.increment(
            product.rewards.coins,
          );
        }
        
        if (product.rewards.items) {
          for (const item of product.rewards.items) {
            // Add to appropriate inventory category
            updates[`inventory.${getItemCategory(item)}`] =
              admin.firestore.FieldValue.arrayUnion(item);
          }
        }

        transaction.update(userRef, updates);
      });

      // 5. For Google, acknowledge the purchase
      if (store === 'google') {
        await this.googleVerifier.acknowledgePurchase(productId, receipt);
      }

      // 6. Return updated wallet
      const user = await this.userRepository.findById(userId);
      return {
        success: true,
        wallet: user!.wallet,
        items: product.rewards.items,
      };
    } catch (error) {
      // Transaction failed
      return { success: false, error: 'ERR_INTERNAL' };
    }
  }

  private async findTransaction(transactionId: string) {
    const doc = await this.firestore
      .getFirestore()
      .collection('transactions')
      .doc(transactionId)
      .get();
    return doc.exists ? doc.data() : null;
  }

  private async logFailedAttempt(
    userId: string,
    store: string,
    productId: string,
    error?: string,
  ): Promise<void> {
    await this.firestore.getFirestore().collection('iapFailures').add({
      odindexerId: userId,
      store,
      productId,
      error,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}
```

### 8.3 IAP Module

```typescript
// iap.module.ts

@Module({
  imports: [CommonModule, AuthModule, PersistenceModule],
  controllers: [IapController],
  providers: [
    IapService,
    AppleVerifierService,
    GoogleVerifierService,
    WalletService,
  ],
  exports: [WalletService],
})
export class IapModule {}
```

---

## Quick Reference

### Purchase Flow Summary

1. **Client** completes purchase with App Store / Play Store
2. **Client** sends receipt to `POST /iap/verify`
3. **Server** validates with Apple/Google API
4. **Server** checks idempotency (transaction ID not used)
5. **Server** grants rewards in database transaction
6. **Server** returns updated wallet
7. **Client** calls `finishTransaction()` on store SDK

### Environment Variables

```env
# Apple App Store
APPLE_BUNDLE_ID=com.bluffbuddy.game
APPLE_KEY_ID=ABC123DEF4
APPLE_ISSUER_ID=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# Google Play
GOOGLE_PACKAGE_NAME=com.bluffbuddy.game
GOOGLE_CLIENT_EMAIL=iap-verifier@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

---

## References

- [App Store Server API](https://developer.apple.com/documentation/appstoreserverapi)
- [Google Play Developer API](https://developers.google.com/android-publisher)
- [IAP Best Practices](https://developer.android.com/google/play/billing/security)

---

*Document Version: 1.0 | Last Updated: February 2026*
