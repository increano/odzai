import { NextResponse } from 'next/server';

/**
 * Get budget loaded status
 */
export async function GET() {
  try {
    // Forward request to the Express backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/budget-status`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch budget status: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching budget status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch budget status' },
      { status: 500 }
    );
  }
} 