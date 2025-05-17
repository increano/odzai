import { NextResponse } from 'next/server';

// GoCardless API credentials should be stored in environment variables
const GOCARDLESS_SECRET_ID = process.env.GOCARDLESS_SECRET_ID;
const GOCARDLESS_SECRET_KEY = process.env.GOCARDLESS_SECRET_KEY;
const GOCARDLESS_API_URL = 'https://bankaccountdata.gocardless.com/api/v2';

// Function to get an access token from GoCardless
async function getAccessToken() {
  try {
    // Use actual credentials from environment variables
    const secretId = GOCARDLESS_SECRET_ID;
    const secretKey = GOCARDLESS_SECRET_KEY;
    
    if (!secretId || !secretKey) {
      console.error('Missing GoCardless credentials. Please check your environment variables.');
      console.error(`GOCARDLESS_SECRET_ID: ${secretId ? '[SET]' : '[NOT SET]'}`);
      console.error(`GOCARDLESS_SECRET_KEY: ${secretKey ? '[SET]' : '[NOT SET]'}`);
      throw new Error('GoCardless credentials not configured. Please set GOCARDLESS_SECRET_ID and GOCARDLESS_SECRET_KEY environment variables.');
    }
    
    // Check if credentials look valid (basic format checks)
    if (secretId.length < 10 || secretKey.length < 30) {
      console.error('GoCardless credentials appear to be invalid (incorrect length).');
      throw new Error('Invalid GoCardless credentials. Please check your environment variables.');
    }
    
    console.log('Getting GoCardless access token...');
    console.log(`Using API URL: ${GOCARDLESS_API_URL}`);
    
    try {
      // For testing - return mock data if needed
      // return { access: 'mock-token' };
      
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
      
      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse token response:', responseText);
        throw new Error(`Invalid JSON response from GoCardless: ${responseText.substring(0, 100)}...`);
      }
      
      if (!response.ok) {
        console.error('GoCardless token error:', response.status, data);
        throw new Error(data?.summary || `Failed to get access token. Status: ${response.status} ${response.statusText}`);
      }
      
      if (!data.access) {
        console.error('No access token in response:', data);
        throw new Error('GoCardless API did not return an access token');
      }
      
      return data;
    } catch (fetchError) {
      console.error('Network error getting access token:', fetchError);
      
      // Check if this is a CORS error
      const message = fetchError instanceof Error ? fetchError.message : String(fetchError);
      if (message.includes('CORS') || message.includes('cross-origin')) {
        throw new Error('CORS error accessing GoCardless API. Please check your network configuration.');
      }
      
      // For network errors, provide more helpful messages
      if (message.includes('fetch')) {
        throw new Error('Network error accessing GoCardless API. Please check your internet connection and firewall settings.');
      }
      
      // Re-throw original error if it doesn't match known patterns
      throw fetchError;
    }
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
    const requestData = await request.json();
    const { country, institutionId, accountId } = requestData;
    
    console.log('GoCardless connect request:', { country, institutionId, accountId });
    
    if (!country || !institutionId) {
      console.log('Missing required parameters:', { country, institutionId });
      return NextResponse.json({ error: 'Country and institution ID are required' }, { status: 400 });
    }
    
    // For testing - return mock data
    // return NextResponse.json({
    //   redirectUrl: 'https://example.com/mock-bank',
    //   requisitionId: 'mock-requisition-id',
    //   link: 'https://example.com/mock-bank'
    // });
    
    try {
      // Get an access token
      console.log('Attempting to get GoCardless access token...');
      const tokenData = await getAccessToken();
      
      console.log('Successfully obtained GoCardless access token');
      
      // Use the access token to create a requisition
      const origin = new URL(request.url).origin;
      const redirectUrl = `${origin}/bank-connection/callback`;
      
      console.log('Creating GoCardless requisition with redirect URL:', redirectUrl);
      
      const requisitionBody = {
        redirect: redirectUrl,
        institution_id: institutionId,
        reference: `user-connection-${Date.now()}`
      };
      
      console.log('Requisition request body:', requisitionBody);
      
      try {
        const requisitionResponse = await fetch(`${GOCARDLESS_API_URL}/requisitions/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokenData.access}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(requisitionBody)
        });
        
        const requisitionResponseText = await requisitionResponse.text();
        let requisitionData;
        
        try {
          requisitionData = JSON.parse(requisitionResponseText);
          console.log('GoCardless requisition response:', 
            requisitionResponse.status, 
            requisitionResponse.statusText, 
            requisitionData
          );
        } catch (parseError) {
          console.error('Failed to parse requisition response:', requisitionResponseText);
          throw new Error(`Invalid response from GoCardless API: ${requisitionResponseText.substring(0, 100)}...`);
        }
        
        if (!requisitionResponse.ok) {
          console.error('Error creating requisition:', requisitionData);
          throw new Error(requisitionData?.summary || `Failed to create bank connection: ${requisitionResponse.status} ${requisitionResponse.statusText}`);
        }
        
        if (!requisitionData.link) {
          console.error('No link in requisition response:', requisitionData);
          throw new Error('No redirect link in GoCardless response');
        }
        
        console.log('Successfully created requisition, returning data with link:', requisitionData.link);
        
        // Return the response with both redirectUrl and link for backward compatibility
        return NextResponse.json({
          redirectUrl: requisitionData.link,
          requisitionId: requisitionData.id,
          link: requisitionData.link
        });
      } catch (fetchError) {
        console.error('Network error creating requisition:', fetchError);
        
        // Check if this is a network connectivity issue
        const message = fetchError instanceof Error ? fetchError.message : String(fetchError);
        if (message.includes('fetch') || message.includes('network') || message.includes('connect')) {
          throw new Error('Network error accessing GoCardless API. Please check your internet connection.');
        }
        
        // Re-throw the original error
        throw fetchError;
      }
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