import { NextRequest, NextResponse } from "next/server";
import * as actualAPI from '@/lib/actual-api';

// GET: Fetch all workspaces (budgets)
export async function GET() {
  try {
    // Initialize the API if not already
    await actualAPI.initActualAPI();
    
    // Get all budgets from the Actual API
    const budgets = await actualAPI.getBudgets();
    
    // Map the budgets to our workspace structure
    const workspaces = budgets.map(budget => ({
      id: budget.id,
      name: budget.name,
      lastOpened: budget.lastOpened || new Date().toISOString(),
      createdAt: budget.createdAt || new Date().toISOString(),
      size: budget.size || '0.1',
      path: budget.filepath || `/data/${budget.id}`
    }));
    
    return NextResponse.json(workspaces);
  } catch (error: any) {
    console.error('Failed to get workspaces:', error);
    return NextResponse.json(
      { error: 'Failed to get workspaces', message: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST: Create a new workspace (budget)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;
    
    if (!name) {
      return NextResponse.json(
        { error: 'Workspace name is required' },
        { status: 400 }
      );
    }
    
    // Create a new budget with the Actual API
    const result = await actualAPI.createBudget(name);
    
    // Map to workspace format
    const workspaces = result.budgets.map(budget => ({
      id: budget.id,
      name: budget.name,
      lastOpened: budget.lastOpened || new Date().toISOString(),
      createdAt: budget.createdAt || new Date().toISOString(),
      size: budget.size || '0.1',
      path: budget.filepath || `/data/${budget.id}`
    }));
    
    return NextResponse.json({
      success: true,
      message: `Workspace "${name}" created successfully`,
      workspaces
    });
  } catch (error: any) {
    console.error('Failed to create workspace:', error);
    return NextResponse.json(
      { error: 'Failed to create workspace', message: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 