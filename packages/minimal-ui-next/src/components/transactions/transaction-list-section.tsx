'use client'

import React from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SlidersHorizontalIcon, SearchIcon, MoreVerticalIcon } from 'lucide-react'
import { SyncNowButton } from './sync-now-button'
import { SyncStatusIndicator } from './sync-status-indicator'
import { useIsGoCardlessConnected } from '@/hooks/useIsGoCardlessConnected'

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

interface TransactionListSectionProps {
  transactions: Transaction[]
  isLoading?: boolean
  onSelectTransaction?: (transaction: Transaction) => void
  accountId?: string
  onRefreshData?: () => void
}

export function TransactionListSection({
  transactions = [],
  isLoading = false,
  onSelectTransaction,
  accountId,
  onRefreshData
}: TransactionListSectionProps) {
  // Custom hook to check if the account is connected to GoCardless
  const { isConnected, lastSyncTime, syncState } = useIsGoCardlessConnected(accountId)

  // Handle filtering transactions (to be expanded)
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Search:', e.target.value)
    // Will implement proper search functionality
  }

  // Placeholder for filter button action
  const handleFilter = () => {
    console.log('Open filter dialog')
    // Will implement filter dialog
  }
  
  return (
    <div className="flex-1 min-w-0">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="relative w-full max-w-sm">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                className="pl-8"
                onChange={handleSearch}
              />
            </div>
            <div className="flex items-center gap-2 ml-2">
              {isConnected && accountId && (
                <SyncNowButton 
                  accountId={accountId}
                  onSyncComplete={onRefreshData}
                />
              )}
              <Button variant="outline" size="sm" onClick={handleFilter}>
                <SlidersHorizontalIcon className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="ghost" size="icon">
                <MoreVerticalIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {isConnected && accountId && (
            <SyncStatusIndicator 
              accountId={accountId}
              lastSyncTime={lastSyncTime}
              syncState={syncState}
            />
          )}
        </CardHeader>
        
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <div className="h-8 bg-muted/30 animate-pulse rounded-md mb-4"></div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted/30 animate-pulse rounded-md mb-2"></div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <p className="text-muted-foreground mb-2">No transactions found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your filters or add a new transaction</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Placeholder for actual transaction table component */}
              <div className="p-4">
                <p>Transaction table will go here</p>
                <p className="text-sm text-muted-foreground">
                  Found {transactions.length} transactions
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 