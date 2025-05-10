'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Receipt, Filter, Plus, ArrowLeft } from 'lucide-react'
import { DashboardLayout, DashboardContent } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreateTransactionDialog } from '@/components/transactions/create-transaction-dialog'
import Link from 'next/link'

// Interface for transactions
interface Transaction {
  id: string;
  date: string;
  amount: number;
  payee?: string;
  notes?: string;
  category?: string;
  account: string;
  account_name?: string;
}

// Interface for accounts
interface Account {
  id: string;
  name: string;
}

interface TransactionsPageProps {
  defaultAccountId?: string;
}

export default function TransactionsPage({ defaultAccountId }: TransactionsPageProps = {}) {
  const searchParams = useSearchParams();
  const accountIdFromQuery = searchParams.get('accountId');
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(defaultAccountId || accountIdFromQuery || 'all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Fetch accounts for the dropdown
  useEffect(() => {
    async function fetchAccounts() {
      try {
        const response = await fetch('/api/accounts');
        if (!response.ok) {
          throw new Error('Failed to fetch accounts');
        }
        const data = await response.json();
        setAccounts(data);
      } catch (err) {
        console.error('Error fetching accounts:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch accounts');
      }
    }
    
    fetchAccounts();
  }, []);
  
  // Fetch transactions when account is selected
  useEffect(() => {
    async function fetchTransactions() {
      setIsLoading(true);
      setError(null);
      
      try {
        let response;
        
        if (selectedAccountId && selectedAccountId !== 'all') {
          // Fetch transactions for specific account
          console.log(`Fetching transactions for account ${selectedAccountId}`);
          response = await fetch(`/api/transactions/${selectedAccountId}`);
        } else {
          // Fetch all transactions
          console.log('Fetching transactions for all accounts');
          response = await fetch('/api/transactions/all');
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch transactions');
        }
        
        const data = await response.json();
        console.log(`Fetched ${data.length} transactions`);
        
        // Format the transactions
        setTransactions(data);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchTransactions();
  }, [selectedAccountId]);
  
  // Handle account selection change
  const handleAccountChange = (accountId: string) => {
    setSelectedAccountId(accountId);
  };

  // Format date from ISO string to more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Get the page title
  const pageTitle = selectedAccountId && selectedAccountId !== 'all'
    ? `Transactions - ${accounts.find(a => a.id === selectedAccountId)?.name || 'Unknown Account'}`
    : 'All Transactions';
  
  // Handle opening the create transaction dialog
  const handleAddTransaction = () => {
    setIsCreateDialogOpen(true);
  };

  // Action buttons for the header
  const actions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon">
        <Filter className="h-4 w-4" />
        <span className="sr-only">Filter</span>
      </Button>
      <Button onClick={handleAddTransaction}>
        <Plus className="mr-2 h-4 w-4" />
        Add Transaction
      </Button>
    </div>
  );

  return (
    <DashboardLayout>
      <DashboardContent 
        title={pageTitle} 
        actions={actions}
      >
        <div className="flex flex-col md:flex-row gap-4 mb-4 items-start md:items-center justify-between">
          <div className="flex gap-2 items-center">
            <Button variant="outline" size="sm" asChild>
              <Link href="/accounts">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Accounts
              </Link>
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Select 
              value={selectedAccountId || 'all'}
              onValueChange={handleAccountChange}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {accounts.map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Input placeholder="Search transactions..." className="w-full sm:w-[250px]" />
          </div>
        </div>
        
        {error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="text-center py-8">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No transactions found for this account.</p>
            <p className="mt-2">Create a new transaction to get started.</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{formatDate(transaction.date)}</TableCell>
                    <TableCell>{transaction.payee || transaction.notes || 'Uncategorized'}</TableCell>
                    <TableCell>{transaction.account_name || accounts.find(a => a.id === transaction.account)?.name || 'Unknown'}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                        {transaction.category || 'Uncategorized'}
                      </span>
                    </TableCell>
                    <TableCell className={`text-right ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.amount > 0 ? '+' : ''}
                      ${Math.abs(transaction.amount / 100).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* Transaction Creation Dialog */}
        <CreateTransactionDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSuccess={() => {
            // Refresh transactions after adding a new one
            const fetchTransactions = async () => {
              try {
                setIsLoading(true);
                let response;
                
                if (selectedAccountId && selectedAccountId !== 'all') {
                  response = await fetch(`/api/transactions/${selectedAccountId}`);
                } else {
                  response = await fetch('/api/transactions/all');
                }
                
                if (response.ok) {
                  const data = await response.json();
                  setTransactions(data);
                }
              } catch (err) {
                console.error('Error refreshing transactions:', err);
              } finally {
                setIsLoading(false);
              }
            };
            
            fetchTransactions();
          }}
          initialAccountId={selectedAccountId && selectedAccountId !== 'all' ? selectedAccountId : undefined}
        />
      </DashboardContent>
    </DashboardLayout>
  )
} 