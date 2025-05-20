'use client'

import React, { useState } from 'react'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SlidersHorizontalIcon, SearchIcon, MoreVerticalIcon, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { SyncNowButton } from './sync-now-button'
import { SyncStatusIndicator } from './sync-status-indicator'
import { useIsGoCardlessConnected } from '@/hooks/useIsGoCardlessConnected'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

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

interface TransactionListSectionProps {
  transactions: Transaction[]
  isLoading?: boolean
  onSelectTransaction?: (transaction: Transaction) => void
  accountId?: string
  onRefreshData?: () => void
}

// Number of transactions to show per page
const ITEMS_PER_PAGE = 10;

export function TransactionListSection({
  transactions = [],
  isLoading = false,
  onSelectTransaction,
  accountId,
  onRefreshData
}: TransactionListSectionProps) {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  
  // Custom hook to check if the account is connected to GoCardless
  const { isConnected, lastSyncTime, syncState } = useIsGoCardlessConnected(accountId)

  // Handle filtering transactions (to be expanded)
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Search:', e.target.value)
    // Will implement proper search functionality
    // Reset to first page when searching
    setCurrentPage(1);
  }

  // Placeholder for filter button action
  const handleFilter = () => {
    console.log('Open filter dialog')
    // Will implement filter dialog
  }

  // Format currency amount
  const formatCurrency = (amount: number) => {
    return (amount / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    });
  }
  
  // Calculate pagination
  const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTransactions = transactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  
  // Pagination handlers
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };
  
  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // Determine if we're viewing all accounts (no accountId provided)
  const isAllAccounts = !accountId;
  
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Date</TableHead>
                    {isAllAccounts && <TableHead>Account</TableHead>}
                    <TableHead>Payee</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTransactions.map((transaction) => (
                    <TableRow 
                      key={transaction.id}
                      onClick={() => onSelectTransaction?.(transaction)}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">
                        {format(new Date(transaction.date), 'MMM d, yyyy')}
                      </TableCell>
                      {isAllAccounts && (
                        <TableCell className="font-medium">
                          {transaction.account_name || 'Unknown Account'}
                        </TableCell>
                      )}
                      <TableCell>
                        {transaction.payee_name || transaction.payee || 'Uncategorized'}
                      </TableCell>
                      <TableCell>
                        {transaction.category_name || 'Uncategorized'}
                      </TableCell>
                      <TableCell className={`text-right ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell>
                        {transaction.origin === 'bank' ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Bank
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                            Manual
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        
        {transactions.length > 0 && totalPages > 1 && (
          <CardFooter className="flex items-center justify-between py-4">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, transactions.length)} of {transactions.length} transactions
            </p>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToPrevPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  )
} 