import { NextRequest, NextResponse } from "next/server";

// Mock data storage
let transactions = [
  { id: "tx1", accountId: "acct1", cleared: false, reconciled: false },
  { id: "tx2", accountId: "acct1", cleared: false, reconciled: false },
  { id: "tx3", accountId: "acct1", cleared: false, reconciled: false },
];

// GET: Fetch a single transaction
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const transaction = transactions.find(tx => tx.id === params.id);
  
  if (!transaction) {
    return NextResponse.json(
      { success: false, error: "Transaction not found" },
      { status: 404 }
    );
  }
  
  return NextResponse.json(
    { success: true, data: transaction },
    { status: 200 }
  );
}

// PATCH: Update a transaction (for cleared status updates)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const transactionId = params.id;
  
  try {
    const body = await request.json();
    const { cleared, reconciled } = body;
    
    // Find the transaction
    const transactionIndex = transactions.findIndex(tx => tx.id === transactionId);
    
    if (transactionIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Transaction not found" },
        { status: 404 }
      );
    }
    
    // Update the transaction
    transactions[transactionIndex] = {
      ...transactions[transactionIndex],
      ...(cleared !== undefined && { cleared }),
      ...(reconciled !== undefined && { reconciled })
    };
    
    return NextResponse.json(
      { 
        success: true, 
        data: transactions[transactionIndex] 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update transaction" },
      { status: 500 }
    );
  }
} 