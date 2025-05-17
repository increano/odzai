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
 * Process GoCardless callback and retrieve accounts
 * POST /api/gocardless/callback
 */
export async function POST(request: Request) {
  try {
    // Parse request body to get requisition ID
    const body = await request.json();
    const requisitionId = body.requisitionId;
    
    console.log('Processing callback for requisition ID:', requisitionId);
    
    if (!requisitionId) {
      console.error('Missing requisition ID in request');
      return NextResponse.json({ error: 'Requisition ID is required' }, { status: 400 });
    }
    
    try {
      // Get an access token
      const tokenData = await getAccessToken();
      
      if (!tokenData.access) {
        throw new Error('Failed to obtain access token');
      }
      
      console.log('Successfully obtained access token');
      
      // For demonstration, return mock account data
      // In production, you would fetch real accounts using the token
      return NextResponse.json({
        success: true,
        accounts: [
          {
            id: 'acc1',
            name: 'Current Account',
            balance: {
              amount: 125000, // $1,250.00
              currency: 'USD'
            },
            iban: 'GB29NWBK60161331926819'
          },
          {
            id: 'acc2',
            name: 'Savings Account',
            balance: {
              amount: 585000, // $5,850.00
              currency: 'USD'
            },
            iban: 'GB29NWBK60161331926820'
          },
          {
            id: 'acc3',
            name: 'Credit Card',
            balance: {
              amount: -32500, // -$325.00
              currency: 'USD'
            },
            accountNumber: '4111 **** **** 1234'
          }
        ]
      });
      
      /* In production, uncomment and use this code:
      // First check requisition status
      const requisitionResponse = await fetch(`${GOCARDLESS_API_URL}/requisitions/${requisitionId}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenData.access}`,
          'Accept': 'application/json'
        }
      });
      
      if (!requisitionResponse.ok) {
        const errorData = await requisitionResponse.json();
        throw new Error(errorData.summary || 'Failed to get requisition status');
      }
      
      const requisitionData = await requisitionResponse.json();
      
      if (requisitionData.status !== 'LN') {
        throw new Error(`Requisition is not in a completed state. Current status: ${requisitionData.status}`);
      }
      
      // Get account IDs from the requisition
      const accountIds = requisitionData.accounts;
      
      if (!accountIds || accountIds.length === 0) {
        throw new Error('No accounts found in requisition');
      }
      
      // Get account details for each account
      const accounts = [];
      
      for (const accountId of accountIds) {
        // Get account details
        const accountResponse = await fetch(`${GOCARDLESS_API_URL}/accounts/${accountId}/details/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${tokenData.access}`,
            'Accept': 'application/json'
          }
        });
        
        if (!accountResponse.ok) {
          console.error(`Failed to get details for account ${accountId}`);
          continue;
        }
        
        const accountData = await accountResponse.json();
        
        // Get account balances
        const balanceResponse = await fetch(`${GOCARDLESS_API_URL}/accounts/${accountId}/balances/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${tokenData.access}`,
            'Accept': 'application/json'
          }
        });
        
        let balanceData = { balances: [{ balanceAmount: { amount: '0', currency: 'EUR' } }] };
        
        if (balanceResponse.ok) {
          balanceData = await balanceResponse.json();
        } else {
          console.error(`Failed to get balance for account ${accountId}`);
        }
        
        // Format account data
        const balance = balanceData.balances[0]?.balanceAmount;
        
        accounts.push({
          id: accountId,
          name: accountData.name || accountData.resourceId || 'Unknown Account',
          balance: {
            amount: Math.round(parseFloat(balance.amount) * 100), // Convert to cents
            currency: balance.currency
          },
          iban: accountData.iban,
          accountNumber: accountData.bban || accountData.maskedPan
        });
      }
      
      return NextResponse.json({
        success: true,
        accounts
      });
      */
    } catch (error) {
      console.error('Error in GoCardless accounts flow:', error);
      return NextResponse.json({ 
        error: error instanceof Error ? error.message : 'Failed to retrieve accounts'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error processing callback:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    }, { status: 500 });
  }
} 