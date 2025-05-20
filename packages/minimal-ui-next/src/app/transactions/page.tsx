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

// Define the status metrics interface matching the component's expected type
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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [statusMetrics, setStatusMetrics] = useState<TransactionStatusMetrics | undefined>(undefined)
  const { currentWorkspace } = useWorkspace()

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      setIsLoading(true)
      
      // Add the workspace ID to the query if available
      const workspaceId = currentWorkspace?.id || ''
      const queryParams = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : ''
      
      const response = await fetch(`/api/transactions/all${queryParams}`)
      
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
      waiting: { count: 145, changePercent: 8 },
      processing: { count: 321, changePercent: 15 },
      shipping: { count: 531, changePercent: 30 },
      completed: { count: 812, changePercent: 19 },
      canceled: { count: 80, changePercent: -32 }
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

  // Fetch transactions when the component mounts or workspace changes
  useEffect(() => {
    fetchTransactions()
  }, [currentWorkspace])

  return (
    <TransactionsLayout>
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
  )
} 