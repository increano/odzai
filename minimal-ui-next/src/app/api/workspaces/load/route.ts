import { NextRequest, NextResponse } from "next/server";
import * as actualAPI from '@/lib/actual-api';

// POST: Load a workspace (budget)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId } = body;
    
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace ID is required' },
        { status: 400 }
      );
    }
    
    // Load the budget with the Actual API
    const result = await actualAPI.loadBudget(workspaceId);
    
    return NextResponse.json({
      success: true,
      message: `Workspace loaded successfully`
    });
  } catch (error: any) {
    console.error('Failed to load workspace:', error);
    return NextResponse.json(
      { error: 'Failed to load workspace', message: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 