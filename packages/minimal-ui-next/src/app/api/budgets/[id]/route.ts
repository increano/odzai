import { NextResponse } from 'next/server';

/**
 * Get a specific budget by ID
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  try {
    // Forward request to the Express backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    // First try to load the budget
    const loadResponse = await fetch(`${apiUrl}/api/budgets/load`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ budgetId: id }),
    });
    
    if (!loadResponse.ok) {
      throw new Error(`Failed to load budget: ${loadResponse.status} ${loadResponse.statusText}`);
    }
    
    // Get budget details (this is a mock implementation, you may need to adjust)
    const budgetInfo = {
      id,
      name: id.split('-')[0] || id,
      color: '#3B82F6'
    };
    
    return NextResponse.json(budgetInfo);
  } catch (error) {
    console.error(`Error fetching budget ${id}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch budget' },
      { status: 500 }
    );
  }
}

/**
 * Delete a budget by ID
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  try {
    // Forward request to the Express backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/budgets/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete budget: ${response.status} ${response.statusText}`);
    }
    
    // Try to parse response as JSON, fall back to an empty object
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data.success ? data : { success: true });
  } catch (error) {
    console.error(`Error deleting budget ${id}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete budget' },
      { status: 500 }
    );
  }
} 