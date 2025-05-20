import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

// Sample transactions for fallback
const SAMPLE_ALL_TRANSACTIONS = [
  {
    id: 'tx1',
    date: '2023-07-15',
    account: 'account1',
    accountId: 'account1',
    account_name: 'Checking Account',
    amount: -4999,
    payee: 'Grocery Store',
    payee_name: 'Whole Foods Market',
    notes: 'Weekly groceries',
    category: 'cat1',
    category_name: 'Food',
    origin: 'manual' as const
  },
  {
    id: 'tx2',
    date: '2023-07-12',
    account: 'account2',
    accountId: 'account2',
    account_name: 'Savings Account',
    amount: -3499,
    payee: 'Restaurant',
    payee_name: 'Cheesecake Factory',
    notes: 'Dinner with friends',
    category: 'cat1',
    category_name: 'Dining Out',
    origin: 'manual' as const
  },
  {
    id: 'tx3',
    date: '2023-07-10',
    account: 'account1',
    accountId: 'account1',
    account_name: 'Checking Account',
    amount: 250000,
    payee: 'Employer',
    payee_name: 'ABC Corp',
    notes: 'Bi-weekly salary',
    category: 'cat2',
    category_name: 'Income',
    origin: 'bank' as const
  },
  {
    id: 'tx4',
    date: '2023-07-05',
    account: 'account3',
    accountId: 'account3',
    account_name: 'Credit Card',
    amount: -9999,
    payee: 'Internet',
    payee_name: 'Comcast',
    notes: 'Monthly internet bill',
    category: 'cat3',
    category_name: 'Utilities',
    origin: 'bank' as const
  },
  {
    id: 'tx5',
    date: '2023-07-01',
    account: 'account1',
    accountId: 'account1',
    account_name: 'Checking Account',
    amount: -150000,
    payee: 'Landlord',
    payee_name: 'Apartment Complex',
    notes: 'Monthly rent',
    category: 'cat3',
    category_name: 'Housing',
    origin: 'manual' as const
  }
];

/**
 * Generic transactions endpoint that handles:
 * - POST for adding a new transaction
 */
export async function POST(request: NextRequest) {
  try {
    // Get workspaceId from query parameters
    const workspaceId = request.nextUrl.searchParams.get('workspaceId');
    console.log(`Add transaction request with workspaceId: ${workspaceId || 'none'}`);
    
    const body = await request.json();
    if (!body.accountId || !body.transaction) {
      return NextResponse.json(
        { error: 'Account ID and transaction details are required' },
        { status: 400 }
      );
    }
    
    // Forward request to the Express backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    console.log(`Adding transaction via Express backend at: ${apiUrl}/api/transactions`);
    
    // First, ensure the correct budget is loaded
    if (workspaceId) {
      console.log(`Loading workspace ${workspaceId} before adding transaction`);
      
      try {
        const loadResponse = await fetch(`${apiUrl}/api/budgets/load`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ budgetId: workspaceId }),
          credentials: 'include'
        });
        
        if (!loadResponse.ok) {
          console.warn(`Failed to load workspace: ${loadResponse.status} ${loadResponse.statusText}`);
        } else {
          console.log(`Successfully loaded workspace ${workspaceId}`);
        }
      } catch (loadError) {
        console.error('Error loading workspace:', loadError);
        // Continue anyway and try to add the transaction
      }
    }
    
    // Now add the transaction
    const response = await fetch(`${apiUrl}/api/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      credentials: 'include'
    });
    
    if (!response.ok) {
      console.error(`Failed to add transaction: ${response.status} ${response.statusText}`);
      
      // Return the specific error from the Express backend
      const errorText = await response.text();
      let errorMessage = 'Failed to add transaction';
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (parseError) {
        // If parsing fails, use the raw text
        errorMessage = errorText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }
    
    // Get the response data
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error adding transaction:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add transaction' },
      { status: 500 }
    );
  }
}

/**
 * Get transactions from all accounts
 */
export async function GET(request: NextRequest) {
  try {
    // Get workspaceId from query parameters
    const workspaceId = request.nextUrl.searchParams.get('workspaceId');
    console.log(`All transactions request with workspaceId: ${workspaceId || 'none'}`);
    
    // Forward request to the Express backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    // First, ensure the correct budget is loaded if workspaceId is provided
    if (workspaceId) {
      console.log(`Loading workspace ${workspaceId} before fetching all transactions`);
      
      try {
        const loadResponse = await fetch(`${apiUrl}/api/budgets/load`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ budgetId: workspaceId }),
          credentials: 'include'
        });
        
        if (!loadResponse.ok) {
          console.warn(`Failed to load workspace: ${loadResponse.status} ${loadResponse.statusText}`);
        } else {
          console.log(`Successfully loaded workspace ${workspaceId}`);
        }
      } catch (loadError) {
        console.error('Error loading workspace:', loadError);
        // Continue anyway and try to fetch transactions
      }
    }
    
    // Now fetch all transactions
    console.log(`Fetching all transactions from Express backend: ${apiUrl}/api/transactions/all`);
    
    const response = await fetch(`${apiUrl}/api/transactions/all`, {
      // Pass cookies to maintain session state
      credentials: 'include'
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch all transactions: ${response.status} ${response.statusText}`);
      
      // Return sample transactions as fallback
      console.log('Using sample transactions as fallback for all transactions');
      return NextResponse.json(SAMPLE_ALL_TRANSACTIONS);
    }
    
    const data = await response.json();
    
    // Check if data is empty or invalid, return sample data as fallback
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log('No transactions returned from API, using sample transactions as fallback');
      return NextResponse.json(SAMPLE_ALL_TRANSACTIONS);
    }
    
    console.log(`Retrieved ${data.length} transactions from all accounts`);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching all transactions:', error);
    
    // Return sample transactions as fallback in case of error
    console.log('Error occurred, using sample transactions as fallback');
    return NextResponse.json(SAMPLE_ALL_TRANSACTIONS);
  }
} 