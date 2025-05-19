import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

/**
 * Get all accounts 
 */
export async function GET(request: NextRequest) {
  try {
    // Get workspaceId from query parameters
    const workspaceId = request.nextUrl.searchParams.get('workspaceId');
    console.log(`Accounts request with workspaceId: ${workspaceId || 'none'}`);
    
    // Forward request to the Express backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    console.log(`Fetching accounts from Express backend at: ${apiUrl}/api/accounts`);
    
    // First, ensure the correct budget is loaded
    if (workspaceId) {
      console.log(`Loading workspace ${workspaceId} before fetching accounts`);
      
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
        // Continue anyway and try to fetch accounts
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
    
    // Now fetch accounts
    const response = await fetch(`${apiUrl}/api/accounts`, {
      // Pass cookies to maintain session state
      credentials: 'include'
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch accounts: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch accounts: ${response.status} ${response.statusText}`);
    }
    
    // Log the response for debugging
    const responseText = await response.text();
    
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('Received accounts data from Express backend:', 
        Array.isArray(data) ? `Array with ${data.length} items` : typeof data);
    } catch (parseError) {
      console.error('Failed to parse accounts JSON response:', responseText);
      throw new Error(`Invalid JSON response from accounts API: ${responseText.substring(0, 100)}...`);
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

/**
 * Create a new account
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Creating account with data:', JSON.stringify(body, null, 2));
    
    // Forward request to the Express backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    // Ensure a budget is loaded by using the same logic from GET
    try {
      const budgetStatusResponse = await fetch(`${apiUrl}/api/budget-status`, {
        credentials: 'include'
      });
      const budgetStatus = await budgetStatusResponse.json();
      
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
    } catch (loadError) {
      console.error('Error loading budget:', loadError);
      // Continue anyway and try to create the account
    }
    
    // Create account on Express backend
    const response = await fetch(`${apiUrl}/api/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create account:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        throw new Error(`Failed to create account: ${response.status} ${response.statusText}`);
      }
      
      return NextResponse.json(errorData, { status: response.status });
    }
    
    const data = await response.json();
    console.log('Account created successfully:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating account:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create account' },
      { status: 500 }
    );
  }
} 