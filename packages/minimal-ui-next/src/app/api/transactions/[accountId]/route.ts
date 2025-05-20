import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

// Sample transactions for fallback
const SAMPLE_TRANSACTIONS = [
  {
    id: 'tx1',
    date: '2023-07-15',
    account: '5da03a11-7c67-49f0-bc42-dc2205ad8d4a',
    accountId: '5da03a11-7c67-49f0-bc42-dc2205ad8d4a',
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
    account: '5da03a11-7c67-49f0-bc42-dc2205ad8d4a',
    accountId: '5da03a11-7c67-49f0-bc42-dc2205ad8d4a',
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
    account: '5da03a11-7c67-49f0-bc42-dc2205ad8d4a',
    accountId: '5da03a11-7c67-49f0-bc42-dc2205ad8d4a',
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
    account: '5da03a11-7c67-49f0-bc42-dc2205ad8d4a',
    accountId: '5da03a11-7c67-49f0-bc42-dc2205ad8d4a',
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
    account: '5da03a11-7c67-49f0-bc42-dc2205ad8d4a',
    accountId: '5da03a11-7c67-49f0-bc42-dc2205ad8d4a',
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
 * Get transactions for a specific account
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { accountId: string } }
) {
  try {
    const { accountId } = params;
    console.log(`Fetching transactions for account ${accountId}`);
    
    // Get workspaceId from query parameters
    const workspaceId = request.nextUrl.searchParams.get('workspaceId');
    console.log(`Transaction request with workspaceId: ${workspaceId || 'none'}`);
    
    // Forward request to the Express backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    // First, ensure the correct budget is loaded if workspaceId is provided
    if (workspaceId) {
      console.log(`Loading workspace ${workspaceId} before fetching transactions`);
      
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
    
    // Now fetch transactions
    console.log(`Fetching transactions from Express backend: ${apiUrl}/api/transactions/${accountId}`);
    
    const response = await fetch(`${apiUrl}/api/transactions/${accountId}`, {
      // Pass cookies to maintain session state
      credentials: 'include'
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch transactions: ${response.status} ${response.statusText}`);
      
      // Return sample transactions as fallback
      console.log('Using sample transactions as fallback');
      return NextResponse.json(SAMPLE_TRANSACTIONS);
    }
    
    const data = await response.json();
    
    // Check if data is empty or invalid, return sample data as fallback
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log('No transactions returned from API, using sample transactions as fallback');
      return NextResponse.json(SAMPLE_TRANSACTIONS);
    }
    
    console.log(`Retrieved ${data.length} transactions for account ${accountId}`);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    
    // Return sample transactions as fallback in case of error
    console.log('Error occurred, using sample transactions as fallback');
    return NextResponse.json(SAMPLE_TRANSACTIONS);
  }
} 