import { NextResponse } from 'next/server';

/**
 * Get all budgets (workspaces)
 */
export async function GET() {
  try {
    // Forward request to the Express backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/budgets`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch budgets: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch budgets' },
      { status: 500 }
    );
  }
}

/**
 * Create a new budget (workspace)
 */
export async function POST(request: Request) {
  try {
    // Get the data from the request
    const body = await request.json();
    
    console.log('Creating new budget with:', body);
    
    // Forward the request to the Express backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/budgets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to create budget: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating budget:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create budget' },
      { status: 500 }
    );
  }
} 