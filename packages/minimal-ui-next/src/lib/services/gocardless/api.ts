import { getGoCardlessCredentials } from './config';

/**
 * GoCardless API Service
 * 
 * Provides methods to interact with the GoCardless API
 * using the centralized credentials
 */

/**
 * Base URL for GoCardless API
 */
const API_BASE_URL = 'https://bankaccountdata.gocardless.com/api/v2';

/**
 * Creates headers for GoCardless API requests
 * including authorization with our centralized credentials
 * 
 * @returns Headers object or null if credentials aren't available
 */
async function getHeaders() {
  const credentials = getGoCardlessCredentials();
  
  if (!credentials) {
    console.error('GoCardless credentials not configured');
    return null;
  }
  
  return {
    'Authorization': `Bearer ${credentials.secretKey}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Get a list of supported banks/institutions from GoCardless
 * 
 * @param countryCode Optional ISO country code to filter institutions
 * @returns List of institutions or null if the request fails
 */
export async function getInstitutions(countryCode?: string) {
  try {
    const headers = await getHeaders();
    
    if (!headers) {
      throw new Error('GoCardless is not configured');
    }
    
    const url = countryCode 
      ? `${API_BASE_URL}/institutions?countries=${countryCode}`
      : `${API_BASE_URL}/institutions`;
      
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch institutions: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching institutions:', error);
    return null;
  }
}

/**
 * Initiate a bank connection flow with GoCardless
 * 
 * @param institutionId The ID of the institution to connect to
 * @param redirectUrl The URL to redirect to after connection
 * @returns Connection data or null if the request fails
 */
export async function initiateConnection(institutionId: string, redirectUrl: string) {
  try {
    const headers = await getHeaders();
    
    if (!headers) {
      throw new Error('GoCardless is not configured');
    }
    
    const response = await fetch(`${API_BASE_URL}/requisitions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        institution_id: institutionId,
        redirect: redirectUrl,
        // Add any other required parameters
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to initiate connection: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error initiating bank connection:', error);
    return null;
  }
}

/**
 * Get accounts for a connected bank
 * 
 * @param requisitionId The ID of the requisition/connection
 * @returns Account data or null if the request fails
 */
export async function getAccounts(requisitionId: string) {
  try {
    const headers = await getHeaders();
    
    if (!headers) {
      throw new Error('GoCardless is not configured');
    }
    
    const response = await fetch(`${API_BASE_URL}/requisitions/${requisitionId}/accounts`, {
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch accounts: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return null;
  }
}

/**
 * Get transactions for a specific account
 * 
 * @param accountId The ID of the account
 * @param dateFrom Optional start date (YYYY-MM-DD)
 * @param dateTo Optional end date (YYYY-MM-DD)
 * @returns Transaction data or null if the request fails
 */
export async function getTransactions(
  accountId: string, 
  dateFrom?: string, 
  dateTo?: string
) {
  try {
    const headers = await getHeaders();
    
    if (!headers) {
      throw new Error('GoCardless is not configured');
    }
    
    let url = `${API_BASE_URL}/accounts/${accountId}/transactions`;
    
    // Add date filters if provided
    if (dateFrom || dateTo) {
      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      url += `?${params.toString()}`;
    }
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return null;
  }
} 