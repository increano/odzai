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
    const body = await request.json();
    
    if (!body.accounts || !Array.isArray(body.accounts) || body.accounts.length === 0) {
      return NextResponse.json({ error: 'At least one account is required' }, { status: 400 });
    }
    
    // Forward request to the Express backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    const results = [];
    const errors = [];
    
    // Process each account
    for (const account of body.accounts) {
      try {
        // Create a new account in Actual using the Express backend
        const response = await fetch(`${apiUrl}/api/accounts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            account: {
              name: account.name,
              // Use typical values for account properties
              offbudget: false,
              // Needed to make sure the account appears in the UI
              type: account.name.toLowerCase().includes('credit') ? 'credit' : 'checking',
              // Add important metadata
              metadata: {
                gocardless_account_id: account.id,
                gocardless_requisition_id: account.requisitionId,
                iban: account.iban,
                accountNumber: account.accountNumber
              }
            },
            // Convert balance to cents (integer)
            initialBalance: account.balance.amount
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to create account: ${response.statusText}`);
        }
        
        const data = await response.json();
        results.push({
          externalId: account.id,
          actualId: data.id,
          name: account.name,
          success: true
        });
      } catch (err) {
        console.error(`Error creating account ${account.name}:`, err);
        errors.push({
          name: account.name,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }
    
    if (errors.length > 0 && results.length === 0) {
      // All accounts failed
      return NextResponse.json({ 
        error: 'Failed to link accounts',
        details: errors
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      accounts: results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error linking accounts:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
} 