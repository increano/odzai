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
 * Link bank accounts to Actual Budget
 * POST /api/accounts/link
 */
export async function POST(request: Request) {
  try {
    // Parse request body to get accounts to link
    const { accounts } = await request.json();
    
    if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
      return NextResponse.json({ error: 'At least one account is required' }, { status: 400 });
    }
    
    try {
      // Get an access token for GoCardless - needed to verify the accounts
      const tokenData = await getAccessToken();
      
      if (!tokenData.access) {
        throw new Error('Failed to obtain access token');
      }
      
      console.log('Successfully obtained access token for account linking');
      
      // For demonstration, simulate successful account linking
      // In production, you would validate account IDs with GoCardless using the token
      const linkedAccounts = accounts.map(account => ({
        id: `actual-${account.id}`,
        name: account.name,
        type: account.name.toLowerCase().includes('credit') ? 'credit' : 'checking',
        offBudget: false,
        balance: account.balance.amount,
        linkedBankAccount: {
          id: account.id,
          institution: 'GoCardless',
          requisitionId: account.requisitionId
        }
      }));
      
      // Simulate a delay to make it feel more realistic
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return NextResponse.json({
        success: true,
        accounts: linkedAccounts,
      });
      
      /* In production, uncomment and use this code:
      // Process each account
      const linkedAccounts = [];
      
      for (const account of accounts) {
        // Validate this account exists in GoCardless using the token
        const accountResponse = await fetch(`${GOCARDLESS_API_URL}/accounts/${account.id}/`, {
          headers: {
            'Authorization': `Bearer ${tokenData.access}`,
            'Accept': 'application/json'
          }
        });
        
        if (!accountResponse.ok) {
          console.error(`Failed to validate account ${account.id}`);
          continue;
        }
        
        // If this is linking to an existing account
        if (account.existingAccountId) {
          // Update existing account with GoCardless connection info
          // This would call your Actual Budget API
          const updatedAccount = await updateActualAccount(account.existingAccountId, {
            bankAccountId: account.id,
            requisitionId: account.requisitionId,
          });
          
          linkedAccounts.push(updatedAccount);
        } else {
          // Create a new account with GoCardless connection info
          // This would call your Actual Budget API
          const newAccount = await createActualAccount({
            name: account.name,
            // Figure out account type based on name or other attributes
            type: account.name.toLowerCase().includes('credit') ? 'credit' : 'checking',
            offbudget: false,
            balance: account.balance.amount,
            bankAccountId: account.id,
            requisitionId: account.requisitionId,
          });
          
          linkedAccounts.push(newAccount);
        }
      }
      
      return NextResponse.json({
        success: true,
        accounts: linkedAccounts,
      });
      */
    } catch (error) {
      console.error('Error in account linking flow:', error);
      return NextResponse.json({ 
        error: error instanceof Error ? error.message : 'Failed to link accounts'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error linking accounts:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    }, { status: 500 });
  }
} 