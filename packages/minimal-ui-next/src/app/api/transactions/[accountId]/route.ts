import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

/**
 * Get transactions for a specific account
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { accountId: string } }
) {
  try {
    const { accountId } = params;
    console.log(`Fetching transactions for account: ${accountId}`);
    
    // Get workspaceId from query parameters
    const workspaceId = request.nextUrl.searchParams.get('workspaceId');
    console.log(`Account transactions request with workspaceId: ${workspaceId || 'none'}`);
    
    // Forward request to the Express backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    console.log(`Fetching transactions from Express backend at: ${apiUrl}/api/transactions/${accountId}`);
    
    // First, ensure the correct budget is loaded
    if (workspaceId) {
      console.log(`Loading workspace ${workspaceId} before fetching account transactions`);
      
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
    } else {
      // If no workspace specified, follow the original flow to load any available budget
      const budgetStatusResponse = await fetch(`${apiUrl}/api/budget-status`, {
        credentials: 'include'
      });
      const budgetStatus = await budgetStatusResponse.json();
      console.log('Budget status:', budgetStatus);
      
      // If budget is not loaded, get the list of budgets and load the first one
      if (!budgetStatus.budgetLoaded) {
        console.log('No budget loaded, attempting to load one...');
        
        // Get list of budgets
        const budgetsResponse = await fetch(`${apiUrl}/api/budgets`, {
          credentials: 'include'
        });
        const budgets = await budgetsResponse.json();
        
        if (budgets && budgets.length > 0) {
          const budgetId = budgets[0].id;
          console.log(`Loading budget: ${budgetId}`);
          
          // Load the budget
          const loadResponse = await fetch(`${apiUrl}/api/budgets/load`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ budgetId }),
            credentials: 'include'
          });
          
          if (!loadResponse.ok) {
            throw new Error(`Failed to load budget: ${loadResponse.status} ${loadResponse.statusText}`);
          }
          
          console.log('Budget loaded successfully');
        } else {
          throw new Error('No budgets available to load');
        }
      }
    }
    
    // Now fetch transactions for the specific account
    const response = await fetch(`${apiUrl}/api/transactions/${accountId}`, {
      // Pass cookies to maintain session state
      credentials: 'include'
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch transactions for account ${accountId}: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch transactions for account ${accountId}: ${response.status} ${response.statusText}`);
    }
    
    // Log the response for debugging
    const responseText = await response.text();
    
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('Received transactions data from Express backend for account:', 
        Array.isArray(data) ? `Array with ${data.length} items` : typeof data);
    } catch (parseError) {
      console.error('Failed to parse transactions JSON response:', responseText);
      throw new Error(`Invalid JSON response from transactions API: ${responseText.substring(0, 100)}...`);
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error fetching transactions for account:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch transactions for account' },
      { status: 500 }
    );
  }
} 