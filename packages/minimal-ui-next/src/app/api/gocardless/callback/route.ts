import { NextResponse } from 'next/server';

// GoCardless API credentials should be stored in environment variables
const GOCARDLESS_API_URL = 'https://bankaccountdata.gocardless.com/api/v2';

// Function to get an access token from GoCardless
async function getAccessToken() {
  try {
    // Use actual credentials from environment variables
    const secretId = process.env.GOCARDLESS_SECRET_ID;
    const secretKey = process.env.GOCARDLESS_SECRET_KEY;
    
    if (!secretId || !secretKey) {
      throw new Error('GoCardless credentials not configured. Please set GOCARDLESS_SECRET_ID and GOCARDLESS_SECRET_KEY environment variables.');
    }
    
    console.log('Getting GoCardless access token...');
    
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