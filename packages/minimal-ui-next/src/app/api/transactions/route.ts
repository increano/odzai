import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

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