import { NextResponse } from 'next/server';

/**
 * Create a new budget
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { budgetName } = body;
    
    if (!budgetName) {
      return NextResponse.json({ error: 'Budget name is required' }, { status: 400 });
    }
    
    console.log(`Creating new budget: ${budgetName}`);
    
    // Forward request to the Express backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/budgets/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ budgetName }),
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