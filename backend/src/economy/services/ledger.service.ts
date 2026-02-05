/**
 * ==========================================================
 * TRANSACTION SERVICE (LEDGER)
 * ==========================================================
 * BluffBuddy Online - Transaction Ledger Service
 *
 * @owner DEV3 (Social/Data)
 * @version v0.2.0
 * @see docs/v0.1.0/08-Monetization.md - Section 3
 * @implements ITransactionService
 *
 * SERVICE RESPONSIBILITIES:
 * - Record all chip transactions
 * - Provide audit trail
 * - Support transaction queries
 * ==========================================================
 */

import { Injectable, Inject } from '@nestjs/common';
import {
  DI_TOKENS,
  ITransactionService,
  IFirestoreService,
} from '../../shared/contracts';

@Injectable()
export class TransactionService implements ITransactionService {
  constructor(
    @Inject(DI_TOKENS.FIRESTORE_SERVICE)
    private readonly firestoreService: IFirestoreService,
  ) {}

  // TODO v0.2.0: Implement recordTransaction
  async recordTransaction(
    userId: string,
    type: string,
    amount: number,
    reason: string,
  ): Promise<string> {
    throw new Error('TransactionService.recordTransaction not implemented');
  }

  // TODO v0.2.0: Implement getTransactionHistory
  async getTransactionHistory(
    userId: string,
    limit?: number,
    cursor?: string,
  ): Promise<{ transactions: any[]; nextCursor?: string }> {
    throw new Error('TransactionService.getTransactionHistory not implemented');
  }

  // TODO v0.2.0: Implement getTransaction
  async getTransaction(transactionId: string): Promise<any | null> {
    throw new Error('TransactionService.getTransaction not implemented');
  }
}

// Legacy alias for backward compatibility
export { TransactionService as LedgerService };
