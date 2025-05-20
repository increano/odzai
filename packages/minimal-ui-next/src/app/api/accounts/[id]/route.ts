import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

/**
 * Get a specific account by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  try {
    // Get workspaceId from query parameters
    const workspaceId = request.nextUrl.searchParams.get('workspaceId');
    console.log(`Account details request with workspaceId: ${workspaceId || 'none'}`);
    
    // Forward request to the Express backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    // First, ensure the correct budget is loaded if workspaceId is provided
    if (workspaceId) {
      console.log(`Loading workspace ${workspaceId} before fetching account details`);
      
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
        // Continue anyway and try to fetch account
      }
    }
    
    const response = await fetch(`${apiUrl}/api/accounts/${id}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch account: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error fetching account ${id}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch account' },
      { status: 500 }
    );
  }
}

/**
 * Update an account
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  try {
    const body = await request.json();
    
    // Get workspaceId from query parameters
    const workspaceId = request.nextUrl.searchParams.get('workspaceId');
    console.log(`Update account request with workspaceId: ${workspaceId || 'none'}`);
    
    // Forward request to the Express backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    // First, ensure the correct budget is loaded if workspaceId is provided
    if (workspaceId) {
      console.log(`Loading workspace ${workspaceId} before updating account`);
      
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
        // Continue anyway and try to update account
      }
    }
    
    const response = await fetch(`${apiUrl}/api/accounts/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update account: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error updating account ${id}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update account' },
      { status: 500 }
    );
  }
}

/**
 * Delete an account
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  try {
    // Get workspaceId from query parameters
    const workspaceId = request.nextUrl.searchParams.get('workspaceId');
    console.log(`Delete account request with workspaceId: ${workspaceId || 'none'}`);
    
    // Forward request to the Express backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    // First, ensure the correct budget is loaded if workspaceId is provided
    if (workspaceId) {
      console.log(`Loading workspace ${workspaceId} before deleting account`);
      
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
        // Continue anyway and try to delete account
      }
    }
    
    const response = await fetch(`${apiUrl}/api/accounts/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete account: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error deleting account ${id}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete account' },
      { status: 500 }
    );
  }
} 