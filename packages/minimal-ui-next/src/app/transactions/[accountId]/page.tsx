'use client'

import React, { useState, useEffect } from 'react'
import { TransactionsLayout } from '@/components/transactions/transactions-layout'
import { StatusOverviewSection } from '@/components/transactions/status-overview-section'
import { TransactionListSection } from '@/components/transactions/transaction-list-section'
import { TransactionDetailsPanel } from '@/components/transactions/transaction-details-panel'
import { useWorkspace } from '@/components/WorkspaceProvider'
import { toast } from 'sonner'

// Define the transaction interface
interface Transaction {
  id: string
  date: string
  account: string
  accountId: string
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
  calculated_balance: number
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

interface AccountTransactionsPageProps {
  params: {
    accountId: string
  }
}

export default function AccountTransactionsPage({ params }: AccountTransactionsPageProps) {
  const { accountId } = params
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [statusMetrics, setStatusMetrics] = useState<TransactionStatusMetrics | undefined>(undefined)
  const [account, setAccount] = useState<Account | null>(null)
  const { currentWorkspace } = useWorkspace()

  // Fetch account details
  const fetchAccountDetails = async () => {
    try {
      const response = await fetch(`/api/accounts/${accountId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch account details')
      }
      
      const data = await response.json()
      setAccount(data)
    } catch (error) {
      console.error('Error fetching account details:', error)
      toast.error('Failed to load account details')
    }
  }

  // Fetch transactions for this account
  const fetchTransactions = async () => {
    try {
      setIsLoading(true)
      
      // Add the workspace ID to the query if available
      const workspaceId = currentWorkspace?.id || ''
      const queryParams = workspaceId ? `&workspaceId=${encodeURIComponent(workspaceId)}` : ''
      
      const response = await fetch(`/api/transactions/${accountId}?${queryParams}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions')
      }
      
      const data = await response.json()
      setTransactions(data)
      
      // Calculate status metrics from transactions (this would be replaced by an API call)
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

  // Fetch account details and transactions when the component mounts
  useEffect(() => {
    fetchAccountDetails()
    fetchTransactions()
  }, [accountId, currentWorkspace])

  return (
    <TransactionsLayout accountId={accountId} accountName={account?.name}>
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
          accountId={accountId}
          onRefreshData={fetchTransactions}
        />
        
        <TransactionDetailsPanel 
          transaction={selectedTransaction}
          onEdit={handleEditTransaction}
          onDelete={handleDeleteTransaction}
        />
      </div>
    </TransactionsLayout>
  )
} 