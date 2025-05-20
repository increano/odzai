'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TransactionOriginBadge } from './transaction-origin-badge'
import { CalendarIcon, DollarSignIcon, FileTextIcon, TagIcon, EditIcon, TrashIcon, CreditCardIcon } from 'lucide-react'
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
  hasConflict?: boolean
}

interface TransactionDetailsPanelProps {
  transaction?: Transaction | null
  onEdit?: (transaction: Transaction) => void
  onDelete?: (transaction: Transaction) => void
}

export function TransactionDetailsPanel({
  transaction,
  onEdit,
  onDelete
}: TransactionDetailsPanelProps) {
  if (!transaction) {
    return (
      <Card className="w-96 hidden lg:block">
        <CardContent className="p-6 flex items-center justify-center h-64">
          <p className="text-muted-foreground text-center">
            Select a transaction to view details
          </p>
        </CardContent>
      </Card>
    )
  }

  // Format amount with a dollar sign
  const formattedAmount = (amount: number) => {
    const absAmount = Math.abs(amount / 100)
    const sign = amount < 0 ? '-' : ''
    return `${sign}$${absAmount.toFixed(2)}`
  }

  return (
    <Card className="w-96 hidden lg:block">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Transaction Details</CardTitle>
          {transaction.origin && (
            <TransactionOriginBadge origin={transaction.origin} />
          )}
        </div>
        <CardDescription>
          {transaction.date && (
            <div className="flex items-center">
              <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
              {format(new Date(transaction.date), 'MMM d, yyyy')}
            </div>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Amount */}
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">Amount</div>
          <div className="flex items-center">
            <DollarSignIcon className="h-4 w-4 mr-1.5 text-muted-foreground" />
            <div className={`text-xl font-semibold ${transaction.amount < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
              {formattedAmount(transaction.amount)}
            </div>
          </div>
        </div>
        
        {/* Account (only show when account_name is available) */}
        {transaction.account_name && (
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Account</div>
            <div className="flex items-center">
              <CreditCardIcon className="h-4 w-4 mr-1.5 text-muted-foreground" />
              <div>{transaction.account_name}</div>
            </div>
          </div>
        )}
        
        {/* Payee */}
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">Payee</div>
          <div className="flex items-center">
            <TagIcon className="h-4 w-4 mr-1.5 text-muted-foreground" />
            <div>{transaction.payee_name || transaction.payee || 'Unknown Payee'}</div>
          </div>
        </div>
        
        {/* Category */}
        {transaction.category_name && (
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Category</div>
            <Badge variant="secondary">
              {transaction.category_name}
            </Badge>
          </div>
        )}
        
        {/* Notes */}
        {transaction.notes && (
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Notes</div>
            <div className="flex items-start">
              <FileTextIcon className="h-4 w-4 mr-1.5 text-muted-foreground mt-0.5" />
              <div className="text-sm">{transaction.notes}</div>
            </div>
          </div>
        )}
        
        {/* Conflict Warning - Only show if transaction has a conflict */}
        {transaction.hasConflict && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <h4 className="text-sm font-medium text-amber-800 mb-1">
              Conflict Detected
            </h4>
            <p className="text-xs text-amber-700">
              This transaction may be a duplicate. Check and resolve conflicts to keep your accounts accurate.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 bg-white border-amber-300 hover:bg-amber-50 text-amber-700"
            >
              View Conflicts
            </Button>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" onClick={() => onEdit?.(transaction)}>
          <EditIcon className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onDelete?.(transaction)}
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <TrashIcon className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  )
} 