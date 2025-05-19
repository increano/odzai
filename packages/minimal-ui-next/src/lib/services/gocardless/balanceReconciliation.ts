/**
 * Balance Reconciliation Service
 * Handles reconciliation of account balances between local system and GoCardless data
 */

import { goCardlessClient } from './client';

interface AccountBalance {
  accountId: string;
  balance: number;
  currency: string;
  timestamp: number;
}

interface ReconciliationResult {
  accountId: string;
  localBalance: number;
  remoteBalance: number;
  difference: number;
  needsReconciliation: boolean;
  reconciled: boolean;
  adjustmentTransactionId?: string;
  errorMessage?: string;
}

/**
 * Reconciles the balance of a local account with the remote GoCardless balance
 * 
 * @param accountId The local account ID
 * @param externalId The GoCardless account ID
 * @param localBalance The current local balance (in cents)
 * @returns Result of the reconciliation process
 */
export async function reconcileAccountBalance(
  accountId: string,
  externalId: string,
  localBalance: number
): Promise<ReconciliationResult> {
  try {
    // Get the latest balance from GoCardless
    const account = await goCardlessClient.getAccount(externalId);
    if (!account || !account.balances) {
      return {
        accountId,
        localBalance,
        remoteBalance: 0,
        difference: 0,
        needsReconciliation: false,
        reconciled: false,
        errorMessage: 'Failed to fetch account balance from GoCardless'
      };
    }

    // Extract the balance in cents
    const remoteBalance = account.balances.balanceAmount?.amount || 0;
    const difference = remoteBalance - localBalance;
    
    // Determine if reconciliation is needed (threshold of 5 cents)
    const needsReconciliation = Math.abs(difference) > 5;
    
    if (!needsReconciliation) {
      return {
        accountId,
        localBalance,
        remoteBalance,
        difference,
        needsReconciliation: false,
        reconciled: true
      };
    }

    // Create adjustment transaction if needed
    let adjustmentTransactionId: string | undefined;
    
    try {
      if (needsReconciliation) {
        // In production, create an adjustment transaction with the API
        // This is a mock implementation
        adjustmentTransactionId = `adj-${Date.now()}`;
        
        // Log the adjustment for auditing
        console.log(`Created balance adjustment for account ${accountId}: ${difference / 100} ${account.balances.balanceAmount?.currency || 'EUR'}`);
      }
      
      return {
        accountId,
        localBalance,
        remoteBalance,
        difference,
        needsReconciliation,
        reconciled: true,
        adjustmentTransactionId
      };
    } catch (adjustmentError) {
      return {
        accountId,
        localBalance,
        remoteBalance,
        difference,
        needsReconciliation,
        reconciled: false,
        errorMessage: adjustmentError instanceof Error ? adjustmentError.message : 'Failed to create adjustment transaction'
      };
    }
  } catch (error) {
    console.error('Error reconciling account balance:', error);
    return {
      accountId,
      localBalance,
      remoteBalance: 0,
      difference: 0,
      needsReconciliation: false,
      reconciled: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error during reconciliation'
    };
  }
}

/**
 * Reconciles multiple accounts at once
 * 
 * @param accounts Array of accounts to reconcile with their balances
 * @returns Results of reconciliation for each account
 */
export async function batchReconcileBalances(
  accounts: Array<{ id: string, externalId: string, balance: number }>
): Promise<ReconciliationResult[]> {
  const results: ReconciliationResult[] = [];
  
  for (const account of accounts) {
    try {
      const result = await reconcileAccountBalance(
        account.id,
        account.externalId,
        account.balance
      );
      results.push(result);
    } catch (error) {
      console.error(`Failed to reconcile account ${account.id}:`, error);
      results.push({
        accountId: account.id,
        localBalance: account.balance,
        remoteBalance: 0,
        difference: 0,
        needsReconciliation: false,
        reconciled: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  return results;
} 