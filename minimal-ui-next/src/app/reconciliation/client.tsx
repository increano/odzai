'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  CheckCircle2,
  CreditCard,
  RefreshCw,
  X,
  ArrowRight,
  AlertTriangle,
  ChevronRight,
  Check
} from "lucide-react";

// Types
interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'cash';
  balance: number;
  onBudget: boolean;
  lastReconciled?: string;
}

interface Transaction {
  id: string;
  date: string;
  accountId: string;
  accountName: string;
  payee: string;
  category: string;
  amount: number;
  notes?: string;
  cleared: boolean;
  reconciled: boolean;
}

interface ReconciliationState {
  accountId: string;
  startingBalance: number;
  targetBalance: number;
  difference: number;
  transactions: Transaction[];
  selectedTransactionIds: Set<string>;
  selectedAmount: number;
  inProgress: boolean;
  completed: boolean;
}

export default function ReconciliationClient() {
  // State for accounts
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Reconciliation state
  const [reconciliation, setReconciliation] = useState<ReconciliationState | null>(null);
  
  // Dialog state
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState<boolean>(false);
  
  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };
  
  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };
  
  // Load accounts data
  useEffect(() => {
    const fetchAccounts = async () => {
      setIsLoading(true);
      
      try {
        // Mock accounts data
        const mockAccounts: Account[] = [
          { id: 'acct1', name: 'Checking Account', type: 'checking', balance: 250000, onBudget: true, lastReconciled: '2023-12-15' },
          { id: 'acct2', name: 'Savings Account', type: 'savings', balance: 500000, onBudget: true },
          { id: 'acct3', name: 'Credit Card', type: 'credit', balance: -120000, onBudget: true, lastReconciled: '2023-11-30' },
          { id: 'acct4', name: 'Investment Account', type: 'investment', balance: 1500000, onBudget: false },
          { id: 'acct5', name: 'Emergency Fund', type: 'savings', balance: 300000, onBudget: true },
        ];
        
        setAccounts(mockAccounts);
      } catch (error) {
        console.error('Error fetching accounts:', error);
        toast.error('Failed to load accounts');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAccounts();
  }, []);
  
  // Start reconciliation process
  const startReconciliation = async (accountId: string, startingBalance: number, targetBalance: number) => {
    setIsLoading(true);
    
    try {
      // In a real app, this would fetch transactions for the account that are cleared but not reconciled
      // Using mock data for demonstration
      const mockTransactions: Transaction[] = [
        { 
          id: 'tx1', 
          date: '2023-04-15', 
          accountId: accountId, 
          accountName: accounts.find(a => a.id === accountId)?.name || '', 
          payee: 'Grocery Store', 
          category: 'Groceries', 
          amount: -7525, 
          notes: 'Weekly groceries',
          cleared: true, 
          reconciled: false 
        },
        { 
          id: 'tx2', 
          date: '2023-04-18', 
          accountId: accountId, 
          accountName: accounts.find(a => a.id === accountId)?.name || '', 
          payee: 'Restaurant', 
          category: 'Dining Out', 
          amount: -3250, 
          cleared: true, 
          reconciled: false 
        },
        { 
          id: 'tx3', 
          date: '2023-04-25', 
          accountId: accountId, 
          accountName: accounts.find(a => a.id === accountId)?.name || '', 
          payee: 'Employer', 
          category: 'Salary', 
          amount: 250000, 
          notes: 'Monthly salary',
          cleared: true, 
          reconciled: false 
        },
        { 
          id: 'tx4', 
          date: '2023-04-01', 
          accountId: accountId, 
          accountName: accounts.find(a => a.id === accountId)?.name || '', 
          payee: 'Landlord', 
          category: 'Rent', 
          amount: -120000, 
          notes: 'Monthly rent',
          cleared: true, 
          reconciled: false 
        },
        { 
          id: 'tx5', 
          date: '2023-04-05', 
          accountId: accountId, 
          accountName: accounts.find(a => a.id === accountId)?.name || '', 
          payee: 'Transfer', 
          category: 'Savings', 
          amount: 50000, 
          notes: 'Monthly savings',
          cleared: true, 
          reconciled: false 
        },
      ];
      
      setReconciliation({
        accountId,
        startingBalance,
        targetBalance,
        difference: targetBalance - startingBalance,
        transactions: mockTransactions,
        selectedTransactionIds: new Set(),
        selectedAmount: 0,
        inProgress: true,
        completed: false
      });
      
      toast.success('Reconciliation started');
    } catch (error) {
      console.error('Error starting reconciliation:', error);
      toast.error('Failed to start reconciliation');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle transaction selection
  const toggleTransactionSelection = (transactionId: string, amount: number) => {
    if (!reconciliation) return;
    
    const newSelectedIds = new Set(reconciliation.selectedTransactionIds);
    
    if (newSelectedIds.has(transactionId)) {
      newSelectedIds.delete(transactionId);
      setReconciliation({
        ...reconciliation,
        selectedTransactionIds: newSelectedIds,
        selectedAmount: reconciliation.selectedAmount - amount
      });
    } else {
      newSelectedIds.add(transactionId);
      setReconciliation({
        ...reconciliation,
        selectedTransactionIds: newSelectedIds,
        selectedAmount: reconciliation.selectedAmount + amount
      });
    }
  };
  
  // Complete reconciliation
  const completeReconciliation = async () => {
    if (!reconciliation) return;
    
    setIsLoading(true);
    
    try {
      // In a real app, this would mark the selected transactions as reconciled
      // and update the account's last reconciled date
      
      // Update account last reconciled date
      setAccounts(accounts.map(account => 
        account.id === reconciliation.accountId
          ? { ...account, lastReconciled: new Date().toISOString().split('T')[0] }
          : account
      ));
      
      setReconciliation({
        ...reconciliation,
        completed: true,
        inProgress: false
      });
      
      setIsCompleteDialogOpen(false);
      toast.success('Reconciliation completed successfully');
    } catch (error) {
      console.error('Error completing reconciliation:', error);
      toast.error('Failed to complete reconciliation');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Cancel reconciliation
  const cancelReconciliation = () => {
    setReconciliation(null);
    toast.info('Reconciliation canceled');
  };
  
  // Check if reconciliation is balanced
  const isBalanced = reconciliation && 
    Math.abs(reconciliation.difference - reconciliation.selectedAmount) < 1;
  
  // Get the currently selected account
  const selectedAccount = accounts.find(account => account.id === selectedAccountId);
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Account Reconciliation</h1>
      
      {!reconciliation?.inProgress ? (
        // Account Selection & Setup
        <Card>
          <CardHeader>
            <CardTitle>Start Reconciliation</CardTitle>
            <CardDescription>
              Reconcile your account balance with your bank statement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="account-select">Select Account</Label>
              <Select
                value={selectedAccountId}
                onValueChange={setSelectedAccountId}
              >
                <SelectTrigger id="account-select">
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({formatCurrency(account.balance)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedAccount && (
                <p className="text-sm text-muted-foreground mt-2">
                  Last reconciled: {selectedAccount.lastReconciled ? formatDate(selectedAccount.lastReconciled) : 'Never'}
                </p>
              )}
            </div>
            
            {selectedAccountId && (
              <div className="rounded-md border p-4 space-y-4">
                <div>
                  <Label htmlFor="starting-balance">Statement Starting Balance</Label>
                  <Input
                    id="starting-balance"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    onChange={(e) => {
                      // This would set the starting balance in a real app
                      // We're not storing this in state for this demo
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    The balance from your last reconciliation, or your starting account balance
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="ending-balance">Statement Ending Balance</Label>
                  <Input
                    id="ending-balance"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    onChange={(e) => {
                      // This would set the target balance in a real app
                      // We're not storing this in state for this demo
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    The ending balance from your latest statement
                  </p>
                </div>
                
                <Button 
                  onClick={() => {
                    // Using mock values for demo
                    const startingBalance = selectedAccount?.balance || 0;
                    const targetBalance = startingBalance + 169225; // Adding the sum of mock transactions
                    startReconciliation(selectedAccountId, startingBalance, targetBalance);
                  }}
                  disabled={isLoading}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {isLoading ? 'Starting...' : 'Start Reconciliation'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        // Reconciliation in progress
        <>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Reconciling {accounts.find(a => a.id === reconciliation.accountId)?.name}</CardTitle>
                  <CardDescription>
                    Select transactions to match your statement balance
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={cancelReconciliation}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 border rounded-md">
                  <h3 className="text-sm font-medium text-muted-foreground">Beginning Balance</h3>
                  <p className="text-2xl font-bold">{formatCurrency(reconciliation.startingBalance)}</p>
                </div>
                
                <div className="p-4 border rounded-md">
                  <h3 className="text-sm font-medium text-muted-foreground">Cleared Balance</h3>
                  <p className="text-2xl font-bold">
                    {formatCurrency(reconciliation.startingBalance + reconciliation.selectedAmount)}
                  </p>
                </div>
                
                <div className="p-4 border rounded-md">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {isBalanced ? 'Balanced!' : 'Difference'}
                  </h3>
                  {isBalanced ? (
                    <p className="text-2xl font-bold text-green-600">
                      <CheckCircle2 className="inline-block mr-2 h-5 w-5" />
                      Reconciled
                    </p>
                  ) : (
                    <p className="text-2xl font-bold text-destructive">
                      {formatCurrency(reconciliation.difference - reconciliation.selectedAmount)}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Select</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Payee</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reconciliation.transactions.map(transaction => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <Checkbox
                            checked={reconciliation.selectedTransactionIds.has(transaction.id)}
                            onCheckedChange={() => toggleTransactionSelection(transaction.id, transaction.amount)}
                          />
                        </TableCell>
                        <TableCell>{formatDate(transaction.date)}</TableCell>
                        <TableCell className="font-medium">{transaction.payee}</TableCell>
                        <TableCell>{transaction.category}</TableCell>
                        <TableCell className={`font-mono ${transaction.amount < 0 ? 'text-destructive' : 'text-green-600'}`}>
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={cancelReconciliation}>
                Cancel
              </Button>
              
              <Button 
                onClick={() => setIsCompleteDialogOpen(true)}
                disabled={!isBalanced}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Complete Reconciliation
              </Button>
            </CardFooter>
          </Card>
          
          {/* Completion Dialog */}
          <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Complete Reconciliation</DialogTitle>
                <DialogDescription>
                  Your account will be marked as reconciled and the selected transactions will be updated.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="rounded-md bg-green-50 p-4 border border-green-200">
                  <div className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-1 mr-2" />
                    <div>
                      <h3 className="text-sm font-medium text-green-800">Reconciliation Balanced</h3>
                      <p className="text-sm text-green-700 mt-1">
                        {reconciliation.selectedTransactionIds.size} transactions totaling {formatCurrency(reconciliation.selectedAmount)} have been selected.
                      </p>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  The next time you reconcile this account, the starting balance will be {formatCurrency(reconciliation.targetBalance)}.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCompleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={completeReconciliation} disabled={isLoading}>
                  {isLoading ? 'Completing...' : 'Complete Reconciliation'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
      
      {/* Completed Reconciliation Summary */}
      {reconciliation?.completed && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">
              <CheckCircle2 className="inline-block mr-2 h-5 w-5" />
              Reconciliation Complete
            </CardTitle>
            <CardDescription>
              Your account has been reconciled successfully
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 border rounded-md">
                <h3 className="text-sm font-medium text-muted-foreground">Account</h3>
                <p className="text-xl font-bold">
                  {accounts.find(a => a.id === reconciliation.accountId)?.name}
                </p>
              </div>
              
              <div className="p-4 border rounded-md">
                <h3 className="text-sm font-medium text-muted-foreground">Reconciled Balance</h3>
                <p className="text-xl font-bold">
                  {formatCurrency(reconciliation.targetBalance)}
                </p>
              </div>
              
              <div className="p-4 border rounded-md">
                <h3 className="text-sm font-medium text-muted-foreground">Reconciled Date</h3>
                <p className="text-xl font-bold">
                  {formatDate(new Date().toISOString().split('T')[0])}
                </p>
              </div>
            </div>
            
            <div className="rounded-md bg-muted p-4">
              <h3 className="text-sm font-medium mb-2">Reconciled Transactions</h3>
              <p className="text-sm text-muted-foreground">
                {reconciliation.selectedTransactionIds.size} transactions were marked as reconciled.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="ml-auto"
              onClick={() => setReconciliation(null)}
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Start New Reconciliation
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {/* Reconciliation Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Reconciliation Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex">
              <ChevronRight className="mt-0.5 mr-2 h-4 w-4 text-muted-foreground" />
              <p className="text-sm">
                <span className="font-medium">Use your bank statement:</span> Compare the transactions in your budget with those on your bank statement.
              </p>
            </div>
            
            <div className="flex">
              <ChevronRight className="mt-0.5 mr-2 h-4 w-4 text-muted-foreground" />
              <p className="text-sm">
                <span className="font-medium">Check for missing transactions:</span> Make sure all transactions from your statement are entered in your budget.
              </p>
            </div>
            
            <div className="flex">
              <ChevronRight className="mt-0.5 mr-2 h-4 w-4 text-muted-foreground" />
              <p className="text-sm">
                <span className="font-medium">Look for discrepancies:</span> If the amounts don't match, double-check for typos or missing transactions.
              </p>
            </div>
            
            <div className="flex">
              <ChevronRight className="mt-0.5 mr-2 h-4 w-4 text-muted-foreground" />
              <p className="text-sm">
                <span className="font-medium">Reconcile regularly:</span> Monthly reconciliation helps catch errors early.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 