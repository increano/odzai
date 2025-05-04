import { NextResponse } from "next/server";
import * as actualAPI from '@/lib/actual-api';

// GET: Check workspace status
export async function GET() {
  try {
    // Get budget status from the Actual API
    const status = actualAPI.getBudgetStatus();
    
    return NextResponse.json({
      workspaceLoaded: status.budgetLoaded
    });
  } catch (error: any) {
    console.error('Failed to check workspace status:', error);
    return NextResponse.json(
      { error: 'Failed to check workspace status', message: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 