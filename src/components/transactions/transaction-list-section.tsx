"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { Search, Filter, MoreHorizontal } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

import { TransactionTable } from './transaction-table'
import { TransactionOriginBadge } from './transaction-origin-badge'
import { SyncNowButton } from './sync-now-button'
import { SyncStatusIndicator } from './sync-status-indicator'

interface Transaction {
  id: string
  date: string
  account: string
  account_name?: string
  amount: number
  payee: string
  payee_name?: string
  category?: string
  category_name?: string
  cleared?: boolean
  reconciled?: boolean
  notes?: string
  origin?: 'bank' | 'manual'
  hasConflict?: boolean
}

interface TransactionListSectionProps {
  accountId?: string
  onTransactionSelect: (transaction: Transaction) => void
  transactions: Transaction[]
  isLoading: boolean
  onSearch: (query: string) => void
  onFilter: (filters: any) => void
  onSort: (field: keyof Transaction, direction: 'asc' | 'desc') => void
}

export function TransactionListSection({
  accountId,
  onTransactionSelect,
  transactions,
  isLoading,
  onSearch,
  onFilter,
  onSort
}: TransactionListSectionProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<keyof Transaction>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [isConnectedAccount, setIsConnectedAccount] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  
  // Check if this account is connected to GoCardless
  useEffect(() => {
    if (accountId) {
      // This would be a real API call in production
      setIsConnectedAccount(Math.random() > 0.5) // Simulate connected/not connected
      setLastSyncTime(new Date()) // Simulate last sync time
    }
  }, [accountId])
  
  // Handle search input change with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchQuery)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [searchQuery, onSearch])
  
  // Handle transaction selection
  const handleSelectTransaction = (id: string, selected: boolean) => {
    const newSelection = new Set(selectedTransactions)
    
    if (selected) {
      newSelection.add(id)
    } else {
      newSelection.delete(id)
    }
    
    setSelectedTransactions(newSelection)
  }
  
  // Handle select all transactions
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const allIds = new Set(transactions.map(t => t.id))
      setSelectedTransactions(allIds)
    } else {
      setSelectedTransactions(new Set())
    }
  }
  
  // Handle sorting
  const handleSort = (field: keyof Transaction, direction: 'asc' | 'desc') => {
    setSortField(field)
    setSortDirection(direction)
    onSort(field, direction)
  }
  
  // Handle transaction row click
  const handleRowClick = (transaction: Transaction) => {
    onTransactionSelect(transaction)
  }
  
  // Simulate sync completion
  const handleSyncComplete = () => {
    setLastSyncTime(new Date())
    // Would trigger a refresh of transactions in a real implementation
  }
  
  return (
    <Card className="flex-1 min-w-0">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="w-full max-w-sm">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isConnectedAccount && (
              <SyncNowButton 
                accountId={accountId!} 
                onSyncComplete={handleSyncComplete}
              />
            )}
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Export Transactions</DropdownMenuItem>
                <DropdownMenuItem>Import Transactions</DropdownMenuItem>
                <DropdownMenuItem disabled={selectedTransactions.size === 0}>
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {isConnectedAccount && (
          <SyncStatusIndicator 
            accountId={accountId!}
            lastSyncTime={lastSyncTime}
          />
        )}
      </CardHeader>
      
      <CardContent className="px-0 pb-0">
        <TransactionTable 
          transactions={transactions}
          selectedTransactions={selectedTransactions}
          onSelectTransaction={handleSelectTransaction}
          onSelectAll={handleSelectAll}
          onRowClick={handleRowClick}
          onSort={handleSort}
          sortField={sortField}
          sortDirection={sortDirection}
          renderBadge={(transaction) => 
            transaction.origin && (
              <TransactionOriginBadge origin={transaction.origin} />
            )
          }
        />
      </CardContent>
    </Card>
  )
} 