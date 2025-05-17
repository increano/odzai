import { NextResponse } from 'next/server';

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
      // Get an access token
      const tokenData = await getAccessToken();
      
      if (!tokenData.access) {
        throw new Error('Failed to obtain access token');
      }
      
      console.log('Successfully obtained access token');
      
      // For demonstration, return mock sync results
      // In production, you would actually fetch transactions using the token
      
      // Simulate a delay to make it feel more realistic
      await new Promise(resolve => setTimeout(resolve, 1500));
      
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
        ]
      });
      
      /* In production, uncomment and use this code:
      // Get all linked accounts from your database
      // This would typically come from your database of linked GoCardless accounts
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
          // This would call your own API to add transactions to Actual
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
      
      return NextResponse.json({
        success: true,
        updatedAccounts: syncedAccounts.length,
        newTransactions: totalNewTransactions,
        accounts: syncedAccounts
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