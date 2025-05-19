import { NextResponse } from 'next/server';
import { batchReconcileBalances } from '@/lib/services/gocardless/balanceReconciliation';

// In a real implementation, this would be stored securely in environment variables
const GOCARDLESS_API_URL = 'https://bankaccountdata.gocardless.com/api/v2';

// Function to get an access token from GoCardless - same as in connect/route.ts
// In production, this would be a shared utility function
async function getAccessToken() {
  try {
    // This would use real credentials in production
    const secretId = process.env.GOCARDLESS_SECRET_ID || 'demo-secret-id';
    const secretKey = process.env.GOCARDLESS_SECRET_KEY || 'demo-secret-key';
    
    console.log('Getting GoCardless access token...');
    
    // For demo purposes, return a mock token
    // In production, this would make a real API call to GoCardless
    return {
      access: 'demo-access-token-' + Math.random().toString(36).substring(2, 10),
      access_expires: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    };
    
    /* In production, uncomment and use this code:
    const response = await fetch(`${GOCARDLESS_API_URL}/token/new/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        secret_id: secretId,
        secret_key: secretKey
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.summary || 'Failed to get access token');
    }
    
    return await response.json();
    */
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}

/**
 * Sync accounts with GoCardless
 * POST /api/gocardless/sync
 */
export async function POST(request: Request) {
  try {
    console.log('Starting GoCardless sync process');
    
    try {
      // Parse request body to get account information
      const body = await request.json();
      const { accounts = [] } = body;
      
      // Get an access token
      const tokenData = await getAccessToken();
      
      if (!tokenData.access) {
        throw new Error('Failed to obtain access token');
      }
      
      console.log('Successfully obtained access token');
      
      // For demonstration, create mock account data
      const mockAccounts = [
        {
          id: 'acc1',
          externalId: 'ext-acc1',
          balance: 1050000, // 10,500.00 in cents
          name: 'Current Account',
        },
        {
          id: 'acc2',
          externalId: 'ext-acc2',
          balance: 2530050, // 25,300.50 in cents
          name: 'Savings Account',
        },
        {
          id: 'acc3',
          externalId: 'ext-acc3',
          balance: -125099, // -1,250.99 in cents (credit card)
          name: 'Credit Card',
        }
      ];
      
      // Perform balance reconciliation
      console.log('Performing balance reconciliation...');
      const reconciliationResults = await batchReconcileBalances(mockAccounts);
      
      // Process reconciliation results
      const reconciliationSummary = reconciliationResults.map(result => ({
        accountId: result.accountId,
        needsReconciliation: result.needsReconciliation,
        difference: result.difference / 100, // Convert cents to dollars/euros for display
        reconciled: result.reconciled,
        adjustmentTransactionId: result.adjustmentTransactionId
      }));
      
      // Simulate a delay to make it feel more realistic
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Return mock sync results with reconciliation data
      return NextResponse.json({
        success: true,
        updatedAccounts: 3,
        newTransactions: 12,
        accounts: [
          {
            id: 'acc1',
            name: 'Current Account',
            updatedTransactions: 5
          },
          {
            id: 'acc2',
            name: 'Savings Account',
            updatedTransactions: 2
          },
          {
            id: 'acc3',
            name: 'Credit Card',
            updatedTransactions: 5
          }
        ],
        reconciliation: {
          total: reconciliationResults.length,
          needsReconciliation: reconciliationResults.filter(r => r.needsReconciliation).length,
          reconciled: reconciliationResults.filter(r => r.reconciled).length,
          details: reconciliationSummary
        }
      });
      
      /* In production, uncomment and use this code:
      // Get all linked accounts from your database
      const linkedAccounts = await getLinkedAccounts();
      
      if (!linkedAccounts || linkedAccounts.length === 0) {
        throw new Error('No linked GoCardless accounts found');
      }
      
      let totalNewTransactions = 0;
      const syncedAccounts = [];
      
      // For each account, fetch new transactions
      for (const account of linkedAccounts) {
        try {
          // Get transactions for the account
          const transactionsResponse = await fetch(
            `${GOCARDLESS_API_URL}/accounts/${account.externalId}/transactions/`, 
            {
              headers: {
                'Authorization': `Bearer ${tokenData.access}`,
                'Accept': 'application/json'
              }
            }
          );
          
          if (!transactionsResponse.ok) {
            console.error(`Failed to get transactions for account ${account.id}`);
            continue;
          }
          
          const transactionsData = await transactionsResponse.json();
          const transactions = transactionsData.transactions || [];
          
          // Process and import new transactions
          const newTransactionCount = await processTransactions(account.id, transactions);
          
          totalNewTransactions += newTransactionCount;
          
          syncedAccounts.push({
            id: account.id,
            name: account.name,
            updatedTransactions: newTransactionCount
          });
        } catch (accountError) {
          console.error(`Error syncing account ${account.id}:`, accountError);
        }
      }
      
      // Perform balance reconciliation after sync
      const accountsForReconciliation = syncedAccounts.map(account => ({
        id: account.id,
        externalId: account.externalId,
        balance: account.balance
      }));
      
      const reconciliationResults = await batchReconcileBalances(accountsForReconciliation);
      
      // Process reconciliation results
      const reconciliationSummary = reconciliationResults.map(result => ({
        accountId: result.accountId,
        needsReconciliation: result.needsReconciliation,
        difference: result.difference / 100,
        reconciled: result.reconciled,
        adjustmentTransactionId: result.adjustmentTransactionId
      }));
      
      return NextResponse.json({
        success: true,
        updatedAccounts: syncedAccounts.length,
        newTransactions: totalNewTransactions,
        accounts: syncedAccounts,
        reconciliation: {
          total: reconciliationResults.length,
          needsReconciliation: reconciliationResults.filter(r => r.needsReconciliation).length,
          reconciled: reconciliationResults.filter(r => r.reconciled).length,
          details: reconciliationSummary
        }
      });
      */
    } catch (error) {
      console.error('Error in GoCardless sync flow:', error);
      return NextResponse.json({ 
        error: error instanceof Error ? error.message : 'Failed to sync accounts'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error syncing accounts:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    }, { status: 500 });
  }
} 