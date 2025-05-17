import { NextRequest, NextResponse } from 'next/server';
import { goCardlessConfig } from '@/lib/services/gocardless/config';

export async function GET(request: NextRequest) {
  try {
    // Extract requisition ID from query parameters
    const requisitionId = request.nextUrl.searchParams.get('requisition_id');
    
    if (!requisitionId) {
      return NextResponse.json(
        { error: 'Requisition ID is required' },
        { status: 400 }
      );
    }
    
    // Get user context for this requisition to ensure proper isolation
    const userContext = await retrieveUserContextForRequisition(requisitionId);
    
    if (!userContext) {
      return NextResponse.json(
        { error: 'Invalid requisition ID or unauthorized access' },
        { status: 401 }
      );
    }
    
    // Using the centralized GoCardless credentials, check the requisition status
    // In a real implementation, this would call the GoCardless API
    const requisitionStatus = await getRequisitionStatus(requisitionId);
    
    return NextResponse.json({
      requisition_id: requisitionId,
      status: requisitionStatus.status,
      accounts: requisitionStatus.accounts || [],
      created_at: requisitionStatus.created_at,
      updated_at: requisitionStatus.updated_at
    });
  } catch (error) {
    console.error('Error checking requisition status:', error);
    return NextResponse.json(
      { error: 'Failed to check requisition status' },
      { status: 500 }
    );
  }
}

// Placeholder function - in a real implementation, this would retrieve user context from a database
async function retrieveUserContextForRequisition(requisitionId: string) {
  // For demo purposes, we'll return a mock user context
  // In a real implementation, this would query a database to verify user ownership
  return {
    userId: 'demo-user',
    requisitionId,
    timestamp: Date.now()
  };
}

// Placeholder function - in a real implementation, this would call the GoCardless API
async function getRequisitionStatus(requisitionId: string) {
  // In a real implementation, this would call GoCardless API with system-wide credentials
  // while maintaining user context for isolation
  
  // Mock response for demonstration purposes
  return {
    status: 'LN', // 'LN' = Linked, 'CR' = Created, etc.
    accounts: [
      { id: 'acc-1', name: 'Current Account', balance: { amount: '1000.00', currency: 'EUR' } },
      { id: 'acc-2', name: 'Savings Account', balance: { amount: '5000.00', currency: 'EUR' } }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
} 