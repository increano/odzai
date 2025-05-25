'use client'

import React, { useState, useEffect } from 'react'
import { TransactionsLayout } from '@/components/transactions/transactions-layout'
import { StatusOverviewSection } from '@/components/transactions/status-overview-section'
import { TransactionListSection } from '@/components/transactions/transaction-list-section'
import { TransactionDetailsPanel } from '@/components/transactions/transaction-details-panel'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Workspace, UserPreferences } from '@/lib/supabase/workspace'
import { User } from '@supabase/supabase-js'

// Define the transaction interface
interface Transaction {
  id: string
  date: string
  account: string
  accountId: string
  account_name?: string
  amount: number
  payee: string
  payee_name?: string
  notes?: string
  category?: string
  category_name?: string
  origin?: 'bank' | 'manual'
}

// Account interface
interface Account {
  id: string
  name: string
  calculated_balance?: number
  isConnected?: boolean
}

// Define the status metrics interface
interface TransactionStatusMetrics {
  waiting: {
    count: number
    changePercent?: number
  }
  processing: {
    count: number
    changePercent?: number
  }
  shipping: {
    count: number
    changePercent?: number
  }
  completed: {
    count: number
    changePercent?: number
  }
  canceled: {
    count: number
    changePercent?: number
  }
}

interface TransactionsContentProps {
  user: User;
  workspaces: Workspace[];
  defaultWorkspace: Workspace;
  preferences: UserPreferences | null;
}

export function TransactionsContent({ user, workspaces, defaultWorkspace, preferences }: TransactionsContentProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [statusMetrics, setStatusMetrics] = useState<TransactionStatusMetrics | undefined>(undefined)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isAddingTransaction, setIsAddingTransaction] = useState(false)
  const { currentWorkspace } = useWorkspace()

  // Fetch all accounts
  const fetchAccounts = async () => {
    try {
      // Add the workspace ID to the query if available
      const workspaceId = currentWorkspace?.id || ''
      const queryParams = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : ''
      
      const response = await fetch(`/api/accounts${queryParams}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch accounts')
      }
      
      const data = await response.json()
      setAccounts(data)
    } catch (error) {
      console.error('Error fetching accounts:', error)
      toast.error('Failed to load accounts')
    }
  }

  // Fetch transactions for all accounts
  const fetchTransactions = async () => {
    try {
      setIsLoading(true)
      
      // Add the workspace ID to the query if available
      const workspaceId = currentWorkspace?.id || ''
      const queryParams = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : ''
      
      const response = await fetch(`/api/transactions${queryParams}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions')
      }
      
      const data = await response.json()
      setTransactions(data)
      
      // Calculate status metrics from transactions
      calculateStatusMetrics(data)
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast.error('Failed to load transactions')
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate status metrics from transactions (placeholder)
  const calculateStatusMetrics = (transactionData: Transaction[]) => {
    // This is a placeholder - in a real implementation, this would likely be
    // an API call to get pre-calculated metrics
    const metrics: TransactionStatusMetrics = {
      waiting: { count: 45, changePercent: 5 },
      processing: { count: 21, changePercent: 10 },
      shipping: { count: 31, changePercent: 25 },
      completed: { count: 52, changePercent: 12 },
      canceled: { count: 8, changePercent: -15 }
    }
    
    setStatusMetrics(metrics)
  }

  // Handle transaction selection
  const handleSelectTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
  }

  // Handle transaction edit (placeholder)
  const handleEditTransaction = (transaction: Transaction) => {
    toast(`Edit transaction: ${transaction.id}`)
    // Would implement edit modal/functionality here
  }

  // Handle transaction delete (placeholder)
  const handleDeleteTransaction = (transaction: Transaction) => {
    toast(`Delete transaction: ${transaction.id}`)
    // Would implement delete confirmation and API call here
  }
  
  // Handle add transaction
  const handleAddTransaction = () => {
    setIsAddingTransaction(true)
    // This would open a modal in the real implementation
    
    // For now, just show a toast and simulate adding a transaction
    toast.promise(
      new Promise((resolve) => {
        // Simulate API call delay
        setTimeout(() => {
          // Create a new transaction with a random ID
          const newTransaction: Transaction = {
            id: `tx-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            account: accounts.length > 0 ? accounts[0].id : 'unknown',
            accountId: accounts.length > 0 ? accounts[0].id : 'unknown',
            account_name: accounts.length > 0 ? accounts[0].name : 'Unknown Account',
            amount: -Math.floor(Math.random() * 10000), // Random amount
            payee: 'New Transaction',
            payee_name: 'New Transaction',
            notes: 'Added manually',
            category: 'cat1',
            category_name: 'Uncategorized',
            origin: 'manual'
          }
          
          // Add to transactions array
          setTransactions(prev => [newTransaction, ...prev])
          resolve(newTransaction)
          setIsAddingTransaction(false)
        }, 1000)
      }),
      {
        loading: 'Adding transaction...',
        success: 'Transaction added successfully',
        error: 'Failed to add transaction'
      }
    )
  }

  // Fetch accounts and transactions when the component mounts
  useEffect(() => {
    fetchAccounts()
    fetchTransactions()
  }, [currentWorkspace])

  return (
    <TransactionsLayout 
      accounts={accounts}
      actions={
        <Button onClick={handleAddTransaction} disabled={isAddingTransaction}>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      }
    >
      {/* Status Overview Section */}
      <StatusOverviewSection 
        metrics={statusMetrics} 
        isLoading={isLoading}
      />
      
      {/* Main Content Area - Transaction List and Details */}
      <div className="flex flex-col lg:flex-row gap-4">
        <TransactionListSection 
          transactions={transactions}
          isLoading={isLoading}
          onSelectTransaction={handleSelectTransaction}
          onRefreshData={fetchTransactions}
        />
        
        <TransactionDetailsPanel 
          transaction={selectedTransaction}
          onEdit={handleEditTransaction}
          onDelete={handleDeleteTransaction}
        />
      </div>
    </TransactionsLayout>
  );
} 