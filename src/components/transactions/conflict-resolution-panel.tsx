import React, { useState } from 'react'
import { AlertTriangle, CheckCircle2, Check, Info } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { useConflictDetection, ConflictPair } from '../../hooks/useConflictDetection'
import { useErrorRecovery, ErrorType } from '../../hooks/useErrorRecovery'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

// Define the transaction interface matching our hooks
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
  imported_id?: string
  hasConflict?: boolean
}

interface ConflictResolutionPanelProps {
  transaction: Transaction
  conflictingTransaction?: Transaction
  onResolve: (resolution: 'keep-both' | 'keep-manual' | 'keep-bank') => Promise<void>
  onClose?: () => void
}

/**
 * Panel for resolving conflicts between transactions
 */
export function ConflictResolutionPanel({
  transaction,
  conflictingTransaction,
  onResolve,
  onClose
}: ConflictResolutionPanelProps) {
  // Local state for UI responsiveness
  const [isResolving, setIsResolving] = useState(false)
  const [selectedResolution, setSelectedResolution] = useState<'keep-both' | 'keep-manual' | 'keep-bank' | null>(null)
  
  // Use our error recovery hook for network resiliency
  const { 
    withRecovery, 
    isRecovering,
    currentRecoveryError
  } = useErrorRecovery({
    maxRetries: 3,
    autoRetryNetworkIssues: true
  })

  // Format currency amount
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
  
  // Helper to determine if two values are different
  const isDifferent = (val1: any, val2: any) => {
    if (typeof val1 === 'number' && typeof val2 === 'number') {
      return Math.abs(val1 - val2) > 0.01 // For amounts, allow small rounding differences
    }
    return val1 !== val2
  }

  // Handle resolution with freeze prevention
  const handleResolve = async (resolution: 'keep-both' | 'keep-manual' | 'keep-bank') => {
    // First update UI immediately for responsiveness
    setIsResolving(true)
    setSelectedResolution(resolution)
    
    // Show immediate visual feedback
    toast.info(`Resolving conflict...`)
    
    // Schedule the actual resolution after a small delay to prevent UI freezes
    // This is the key pattern for preventing UI freezes during modal transitions
    setTimeout(async () => {
      try {
        // Use our error recovery wrapper for resilience
        await withRecovery(
          () => onResolve(resolution),
          'conflict' as ErrorType,
          { transactionId: transaction.id, resolution }
        )
        
        // Show success toast
        toast.success(`Conflict resolved successfully`)
        
        // Schedule closing the panel after animation completes
        if (onClose) {
          setTimeout(() => {
            onClose()
          }, 300)
        }
      } catch (error) {
        // Error is already handled by withRecovery, but we should reset UI state
        setSelectedResolution(null)
      } finally {
        // Reset resolving state after a delay for smooth animations
        setTimeout(() => {
          setIsResolving(false)
        }, 300)
      }
    }, 50) // Small delay to allow UI to update first
  }

  // Don't render if no conflicting transaction
  if (!conflictingTransaction) {
    return null
  }

  // Determine differences for highlighting
  const dateDifferent = isDifferent(transaction.date, conflictingTransaction.date)
  const amountDifferent = isDifferent(transaction.amount, conflictingTransaction.amount)
  const payeeDifferent = isDifferent(
    transaction.payee_name || transaction.payee, 
    conflictingTransaction.payee_name || conflictingTransaction.payee
  )

  return (
    <Card className="mb-4 border-amber-300 bg-amber-50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-amber-800 flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5" />
            Possible Duplicate Transaction
          </CardTitle>
          <Badge variant="outline" className="text-amber-800 border-amber-300 bg-amber-100">
            Needs Resolution
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between items-center gap-2 py-1">
            <div className="font-medium w-24">Source:</div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              <Badge variant="outline" className="justify-center">
                {transaction.origin === 'bank' ? 'Bank Import' : 'Manual Entry'}
              </Badge>
              <Badge variant="outline" className="justify-center">
                {conflictingTransaction.origin === 'bank' ? 'Bank Import' : 'Manual Entry'}
              </Badge>
            </div>
          </div>

          <div className={`flex justify-between items-center gap-2 py-1 ${dateDifferent ? 'text-amber-800' : ''}`}>
            <div className="font-medium w-24">Date:</div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className={dateDifferent ? 'font-medium' : ''}>
                {formatDate(transaction.date)}
              </div>
              <div className={dateDifferent ? 'font-medium' : ''}>
                {formatDate(conflictingTransaction.date)}
              </div>
            </div>
          </div>

          <div className={`flex justify-between items-center gap-2 py-1 ${amountDifferent ? 'text-amber-800' : ''}`}>
            <div className="font-medium w-24">Amount:</div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className={amountDifferent ? 'font-medium' : ''}>
                {formatCurrency(transaction.amount)}
              </div>
              <div className={amountDifferent ? 'font-medium' : ''}>
                {formatCurrency(conflictingTransaction.amount)}
              </div>
            </div>
          </div>

          <div className={`flex justify-between items-center gap-2 py-1 ${payeeDifferent ? 'text-amber-800' : ''}`}>
            <div className="font-medium w-24">Payee:</div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className={payeeDifferent ? 'font-medium' : ''}>
                {transaction.payee_name || transaction.payee}
              </div>
              <div className={payeeDifferent ? 'font-medium' : ''}>
                {conflictingTransaction.payee_name || conflictingTransaction.payee}
              </div>
            </div>
          </div>

          {(dateDifferent || amountDifferent || payeeDifferent) && (
            <div className="flex items-center gap-2 text-xs text-amber-700 mt-1">
              <Info className="h-4 w-4" />
              <span>Highlighted fields have different values</span>
            </div>
          )}
        </div>
      </CardContent>

      <Separator className="my-2" />

      <CardFooter className="flex flex-col gap-2">
        <div className="text-sm font-medium mb-1">How would you like to resolve this?</div>
        <div className="grid grid-cols-3 gap-2 w-full">
          <Button 
            variant="outline" 
            className={`border-green-200 hover:border-green-400 ${selectedResolution === 'keep-both' ? 'bg-green-100' : ''}`}
            onClick={() => handleResolve('keep-both')}
            disabled={isResolving || isRecovering}
          >
            <div className="flex flex-col items-center gap-1">
              <Check className="h-4 w-4" />
              <span className="text-xs">Keep Both</span>
            </div>
          </Button>
          
          <Button 
            variant="outline"
            className={`border-blue-200 hover:border-blue-400 ${selectedResolution === 'keep-manual' ? 'bg-blue-100' : ''}`}
            onClick={() => handleResolve('keep-manual')}
            disabled={isResolving || isRecovering}
          >
            <div className="flex flex-col items-center gap-1">
              <Check className="h-4 w-4" />
              <span className="text-xs whitespace-nowrap">Keep Manual</span>
            </div>
          </Button>
          
          <Button 
            variant="outline"
            className={`border-purple-200 hover:border-purple-400 ${selectedResolution === 'keep-bank' ? 'bg-purple-100' : ''}`}
            onClick={() => handleResolve('keep-bank')}
            disabled={isResolving || isRecovering}
          >
            <div className="flex flex-col items-center gap-1">
              <Check className="h-4 w-4" />
              <span className="text-xs">Keep Bank</span>
            </div>
          </Button>
        </div>
        
        {(isResolving || isRecovering) && (
          <div className="w-full text-center text-sm text-muted-foreground mt-2">
            {isRecovering && currentRecoveryError ? 
              `Attempting to recover... (try ${currentRecoveryError.retryCount})` : 
              'Processing...'
            }
          </div>
        )}
      </CardFooter>
    </Card>
  )
} 