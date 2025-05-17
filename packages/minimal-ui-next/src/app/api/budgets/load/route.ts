import { NextResponse } from 'next/server';

/**
 * Load a budget for use
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { budgetId } = body;
    
    if (!budgetId) {
      return NextResponse.json({ error: 'Budget ID is required' }, { status: 400 });
    }
    
    console.log(`Loading budget: ${budgetId}`);
    
    // Forward request to the Express backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/budgets/load`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ budgetId }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to load budget: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error loading budget:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load budget' },
      { status: 500 }
    );
  }
} 