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
    
    // Verify the user context for this requisition to ensure proper isolation
    const userContext = await retrieveUserContextForRequisition(requisitionId);
    
    if (!userContext) {
      return NextResponse.json(
        { error: 'Invalid requisition ID or unauthorized access' },
        { status: 401 }
      );
    }
    
    // Using the centralized GoCardless credentials with user context,
    // fetch available accounts from the connected bank
    const accounts = await fetchAvailableBankAccounts(requisitionId);
    
    return NextResponse.json({ 
      accounts,
      requisition_id: requisitionId
    });
  } catch (error) {
    console.error('Error fetching available accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available accounts' },
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
async function fetchAvailableBankAccounts(requisitionId: string) {
  // In a real implementation, this would call GoCardless API with system-wide credentials
  // while maintaining user context for isolation
  
  // Mock response for demonstration purposes
  return [
    { 
      id: 'acc-1', 
      iban: 'DE89370400440532013000',
      name: 'Current Account', 
      balances: {
        available: { amount: '1000.00', currency: 'EUR' },
        current: { amount: '1100.00', currency: 'EUR' }
      },
      institution_id: 'BANK_XYZ',
      status: 'enabled'
    },
    { 
      id: 'acc-2', 
      iban: 'DE89370400440532013001',
      name: 'Savings Account', 
      balances: {
        available: { amount: '5000.00', currency: 'EUR' },
        current: { amount: '5000.00', currency: 'EUR' }
      },
      institution_id: 'BANK_XYZ',
      status: 'enabled'
    },
    { 
      id: 'acc-3', 
      iban: 'DE89370400440532013002',
      name: 'Credit Card', 
      balances: {
        available: { amount: '2000.00', currency: 'EUR' },
        current: { amount: '-500.00', currency: 'EUR' }
      },
      institution_id: 'BANK_XYZ',
      status: 'enabled'
    }
  ];
} 