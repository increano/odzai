import { NextRequest, NextResponse } from "next/server";

// Mock data for demonstration purposes
const mockTransactions = [
  {
    id: "tx1",
    accountId: "acct1",
    date: "2023-10-01",
    payee: "Grocery Store",
    amount: -4500, // In cents
    category: "Food",
    cleared: false,
    reconciled: false,
  },
  {
    id: "tx2",
    accountId: "acct1",
    date: "2023-10-05",
    payee: "Gas Station",
    amount: -3000,
    category: "Transportation",
    cleared: false,
    reconciled: false,
  },
  {
    id: "tx3",
    accountId: "acct1",
    date: "2023-10-15",
    payee: "Paycheck",
    amount: 250000,
    category: "Income",
    cleared: false,
    reconciled: false,
  },
  {
    id: "tx4",
    accountId: "acct2",
    date: "2023-09-28",
    payee: "Interest",
    amount: 1250,
    category: "Income",
    cleared: false,
    reconciled: false,
  },
  {
    id: "tx5",
    accountId: "acct3",
    date: "2023-10-10",
    payee: "Online Purchase",
    amount: -12000,
    category: "Shopping",
    cleared: false,
    reconciled: false,
  },
];

// GET: Fetch account transactions for reconciliation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const accountId = params.id;
  
  // Filter transactions by account ID
  const transactions = mockTransactions.filter(tx => tx.accountId === accountId);
  
  return NextResponse.json(
    { 
      success: true, 
      data: transactions 
    },
    { status: 200 }
  );
}

// POST: Complete reconciliation
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const accountId = params.id;
  
  try {
    const body = await request.json();
    const { 
      statementBalance, 
      statementDate, 
      clearedTransactionIds, 
      createAdjustment 
    } = body;
    
    if (!statementBalance || !clearedTransactionIds || !Array.isArray(clearedTransactionIds)) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Calculate the cleared balance
    let clearedBalance = 0;
    mockTransactions
      .filter(tx => tx.accountId === accountId && clearedTransactionIds.includes(tx.id))
      .forEach(tx => {
        clearedBalance += tx.amount;
      });
    
    // Calculate difference
    const statementBalanceCents = Math.round(statementBalance * 100);
    const difference = clearedBalance - statementBalanceCents;
    
    let adjustment = null;
    
    // Create adjustment transaction if needed
    if (createAdjustment && Math.abs(difference) > 0) {
      adjustment = {
        id: `tx-adj-${Date.now()}`,
        accountId,
        date: statementDate || new Date().toISOString().split('T')[0],
        payee: 'Reconciliation Adjustment',
        amount: -difference, // Negate to make the balance match
        category: 'Adjustment',
        cleared: true,
        reconciled: true,
      };
      
      // In a real implementation, would add this to the database
      mockTransactions.push(adjustment);
    }
    
    // In a real implementation, would update database records to mark transactions as reconciled
    
    return NextResponse.json(
      { 
        success: true, 
        data: { 
          message: "Reconciliation completed",
          accountId,
          adjustment,
          clearedCount: clearedTransactionIds.length
        } 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in reconciliation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process reconciliation" },
      { status: 500 }
    );
  }
}
