'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertTriangle, FileCheck, Building, X } from 'lucide-react'

interface Transaction {
  id: string
  date: string
  amount: number
  payee: string
  payee_name?: string
  notes?: string
  category?: string
  category_name?: string
  origin?: 'bank' | 'manual'
}

interface ConflictResolutionPanelProps {
  transaction: Transaction
  conflictingTransaction: Transaction
  onResolve: (resolution: 'keep-both' | 'keep-manual' | 'keep-bank') => void
  onClose?: () => void
}

export function ConflictResolutionPanel({
  transaction,
  conflictingTransaction,
  onResolve,
  onClose
}: ConflictResolutionPanelProps) {
  // Format currency for display
  const formatCurrency = (amount: number) => {
    return (amount / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    })
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Use requestAnimationFrame to prevent UI freezes when resolving
  const handleResolve = (resolution: 'keep-both' | 'keep-manual' | 'keep-bank') => {
    // First update UI immediately
    const button = document.querySelector(`button[data-resolution="${resolution}"]`)
    if (button) {
      button.setAttribute('disabled', 'true')
      button.classList.add('opacity-50')
    }
    
    // Then process the resolution with a slight delay to keep UI responsive
    requestAnimationFrame(() => {
      setTimeout(() => {
        onResolve(resolution)
      }, 10)
    })
  }

  // Determine which transaction is manual and which is from bank
  const manualTransaction = transaction.origin === 'manual' ? transaction : conflictingTransaction
  const bankTransaction = transaction.origin === 'bank' ? transaction : conflictingTransaction

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardContent className="pt-6">
        {onClose && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 right-2" 
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        )}
      
        <div className="flex items-center space-x-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <h3 className="text-base font-medium">Transaction Conflict Detected</h3>
        </div>
        
        <div className="grid grid-cols-1 gap-4 mb-4">
          {/* Manual transaction */}
          <div className="border rounded-md p-3 bg-white">
            <div className="flex items-center mb-2">
              <FileCheck className="h-4 w-4 text-purple-500 mr-2" />
              <span className="text-sm font-medium">Manual Entry</span>
              <Badge variant="outline" className="ml-auto text-xs">
                {manualTransaction.category_name || manualTransaction.category || 'Uncategorized'}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Date</div>
                <div>{formatDate(manualTransaction.date)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Amount</div>
                <div className={`${manualTransaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(manualTransaction.amount)}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-muted-foreground">Payee</div>
                <div>{manualTransaction.payee_name || manualTransaction.payee}</div>
              </div>
              {manualTransaction.notes && (
                <div className="col-span-2">
                  <div className="text-xs text-muted-foreground">Notes</div>
                  <div className="text-xs">{manualTransaction.notes}</div>
                </div>
              )}
            </div>
          </div>
          
          {/* Bank transaction */}
          <div className="border rounded-md p-3 bg-white">
            <div className="flex items-center mb-2">
              <Building className="h-4 w-4 text-blue-500 mr-2" />
              <span className="text-sm font-medium">Bank Import</span>
              <Badge variant="outline" className="ml-auto text-xs">
                {bankTransaction.category_name || bankTransaction.category || 'Uncategorized'}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Date</div>
                <div>{formatDate(bankTransaction.date)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Amount</div>
                <div className={`${bankTransaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(bankTransaction.amount)}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-muted-foreground">Payee</div>
                <div>{bankTransaction.payee_name || bankTransaction.payee}</div>
              </div>
              {bankTransaction.notes && (
                <div className="col-span-2">
                  <div className="text-xs text-muted-foreground">Notes</div>
                  <div className="text-xs">{bankTransaction.notes}</div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium mb-2">Resolution Options:</h4>
          <div className="grid grid-cols-1 gap-2">
            <Button
              variant="outline"
              size="sm"
              data-resolution="keep-both"
              className="border-green-200 hover:border-green-400 text-green-700 justify-start"
              onClick={() => handleResolve('keep-both')}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Keep Both Transactions
            </Button>
            <Button
              variant="outline"
              size="sm"
              data-resolution="keep-manual"
              className="border-purple-200 hover:border-purple-400 text-purple-700 justify-start"
              onClick={() => handleResolve('keep-manual')}
            >
              <FileCheck className="h-4 w-4 mr-2" />
              Keep Manual Entry
            </Button>
            <Button
              variant="outline"
              size="sm"
              data-resolution="keep-bank"
              className="border-blue-200 hover:border-blue-400 text-blue-700 justify-start"
              onClick={() => handleResolve('keep-bank')}
            >
              <Building className="h-4 w-4 mr-2" />
              Keep Bank Import
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 