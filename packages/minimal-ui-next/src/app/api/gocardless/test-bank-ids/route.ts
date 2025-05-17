import { NextResponse } from 'next/server';

// GoCardless API credentials from environment
const GOCARDLESS_SECRET_ID = process.env.GOCARDLESS_SECRET_ID;
const GOCARDLESS_SECRET_KEY = process.env.GOCARDLESS_SECRET_KEY;
const GOCARDLESS_API_URL = 'https://bankaccountdata.gocardless.com/api/v2';

// List of well-tested bank IDs from GoCardless documentation
const TEST_BANKS = [
  { country: 'GB', id: 'SANDBOXFINANCE_SFIN0000', name: 'Sandbox Finance', description: 'Test bank for sandbox environment' },
  { country: 'GB', id: 'HSBC_GB', name: 'HSBC UK', description: 'Major UK bank' },
  { country: 'GB', id: 'BARCLAYS_GB', name: 'Barclays', description: 'Major UK bank' },
  { country: 'DE', id: 'DEUTSCHE_BANK_DE', name: 'Deutsche Bank', description: 'Major German bank' },
  { country: 'FR', id: 'CREDIT_AGRICOLE_FR', name: 'Crédit Agricole', description: 'Major French bank' },
  { country: 'ES', id: 'SANTANDER_ES', name: 'Banco Santander', description: 'Major Spanish bank' },
  { country: 'NL', id: 'ING_NL', name: 'ING', description: 'Major Dutch bank' },
  { country: 'BE', id: 'KBC_BE', name: 'KBC Bank', description: 'Major Belgian bank' }
];

// Get access token from GoCardless
async function getAccessToken() {
  try {
    // Use credentials from environment variables
    const secretId = GOCARDLESS_SECRET_ID;
    const secretKey = GOCARDLESS_SECRET_KEY;
    
    if (!secretId || !secretKey) {
      throw new Error('GoCardless credentials not configured');
    }
    
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
    
    const data = await response.json();
    return data.access;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}

// Test connection with a specific bank ID
async function testBankConnection(bankId: string, country: string, accessToken: string) {
  try {
    // Create a requisition with the test bank
    const origin = 'http://localhost:3001'; // Adjust as needed
    const redirectUrl = `${origin}/bank-connection/callback`;
    
    const requisitionResponse = await fetch(`${GOCARDLESS_API_URL}/requisitions/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        redirect: redirectUrl,
        institution_id: bankId,
        reference: `test-connection-${Date.now()}`
      })
    });
    
    if (!requisitionResponse.ok) {
      const errorData = await requisitionResponse.json();
      return {
        bankId,
        country,
        success: false,
        status: requisitionResponse.status,
        error: errorData.summary || 'Unknown error'
      };
    }
    
    const requisitionData = await requisitionResponse.json();
    return {
      bankId,
      country,
      success: true,
      status: requisitionResponse.status,
      link: requisitionData.link,
      requisitionId: requisitionData.id
    };
  } catch (error: unknown) {
    return {
      bankId,
      country,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function GET() {
  try {
    // Get an access token first
    const accessToken = await getAccessToken();
    
    // Test each bank in the list
    const results = await Promise.all(
      TEST_BANKS.map(bank => testBankConnection(bank.id, bank.country, accessToken))
    );
    
    // Combine results with bank information
    const testResults = results.map(result => {
      const bankInfo = TEST_BANKS.find(b => b.id === result.bankId);
      return {
        ...result,
        name: bankInfo?.name,
        description: bankInfo?.description
      };
    });
    
    return NextResponse.json({ 
      testResults,
      message: 'Tested connection with well-known bank IDs'
    });
  } catch (error) {
    console.error('Error testing bank connections:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 