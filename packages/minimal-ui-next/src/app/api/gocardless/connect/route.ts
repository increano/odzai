import { NextResponse } from 'next/server';

// In a real implementation, this would be stored securely in environment variables
const GOCARDLESS_SECRET_ID = process.env.GOCARDLESS_SECRET_ID;
const GOCARDLESS_SECRET_KEY = process.env.GOCARDLESS_SECRET_KEY;
const GOCARDLESS_API_URL = 'https://bankaccountdata.gocardless.com/api/v2';

// Function to get an access token from GoCardless
async function getAccessToken() {
  try {
    // This would use real credentials in production
    const secretId = GOCARDLESS_SECRET_ID || 'demo-secret-id';
    const secretKey = GOCARDLESS_SECRET_KEY || 'demo-secret-key';
    
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
 * Initiates a GoCardless bank connection flow
 * POST /api/gocardless/connect
 */
export async function POST(request: Request) {
  try {
    // Parse request body to get country and bank ID
    const { country, bankId } = await request.json();
    
    if (!country || !bankId) {
      return NextResponse.json({ error: 'Country and bank ID are required' }, { status: 400 });
    }
    
    try {
      // Get an access token
      const tokenData = await getAccessToken();
      
      if (!tokenData.access) {
        throw new Error('Failed to obtain access token');
      }
      
      // Generate a requisition ID - this would come from GoCardless in production
      const requisitionId = `req-${Math.random().toString(36).substring(2, 10)}`;
      
      // Create a mock bank authorization URL - in production this would come from GoCardless
      const origin = new URL(request.url).origin;
      const redirectUrl = `${origin}/bank-connection/callback?req=${requisitionId}`;
      
      // Store the token and requisition details for later use
      // In a real implementation, you would store this securely
      // For demo purposes, we'll just send it in the response
      
      return NextResponse.json({
        redirectUrl: redirectUrl,
        requisitionId: requisitionId,
        // In production, you would NOT return the token to the client
        // It's included here just to show the flow
        _debug_token: process.env.NODE_ENV === 'development' ? tokenData.access : undefined
      });
      
      /* In production, uncomment and use this code:
      // Use the access token to create a requisition
      const redirectUrl = `${origin}/bank-connection/callback`;
      
      const requisitionResponse = await fetch(`${GOCARDLESS_API_URL}/requisitions/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.access}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          redirect: redirectUrl,
          institution_id: bankId,
          reference: `user-connection-${Date.now()}`
        })
      });
      
      if (!requisitionResponse.ok) {
        const errorData = await requisitionResponse.json();
        throw new Error(errorData.summary || 'Failed to create bank connection');
      }
      
      const requisitionData = await requisitionResponse.json();
      
      return NextResponse.json({
        redirectUrl: requisitionData.link,
        requisitionId: requisitionData.id
      });
      */
    } catch (error) {
      console.error('Error in GoCardless authentication flow:', error);
      return NextResponse.json({ 
        error: error instanceof Error ? error.message : 'Authentication failed'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error connecting to bank:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    }, { status: 500 });
  }
} 