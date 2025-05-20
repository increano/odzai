import React, { useState } from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { format } from 'date-fns'

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

interface ConflictPair {
  manual: Transaction
  imported: Transaction
  similarity: number
  conflictType: 'date_amount_payee' | 'amount_payee' | 'date_amount' | 'potential'
}

// Define the resolution options
type ResolutionOption = 'keep-both' | 'keep-imported' | 'keep-manual' | 'link'

interface ConflictResolutionPanelProps {
  conflict: ConflictPair
  onResolve: (resolution: ResolutionOption) => Promise<void>
  isResolving: boolean
}

/**
 * Panel for resolving conflicts between transactions
 */
export function ConflictResolutionPanel({
  conflict,
  onResolve,
  isResolving = false
}: ConflictResolutionPanelProps) {
  const [resolution, setResolution] = useState<ResolutionOption>('keep-imported')
  
  // Format amount for display (handle positives and negatives)
  const formatAmount = (amount: number) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    })
    
    return formatter.format(amount / 100)
  }
  
  // Get conflict description based on conflict type
  const getConflictDescription = () => {
    const { conflictType, similarity } = conflict
    const similarityPercentage = Math.round(similarity * 100)
    
    switch (conflictType) {
      case 'date_amount_payee':
        return `These transactions appear to be duplicates (${similarityPercentage}% match). They have the same date, amount, and similar payee names.`
      case 'amount_payee':
        return `These transactions might be duplicates (${similarityPercentage}% match). They have the same amount and similar payee names, but different dates.`
      case 'date_amount':
        return `These transactions might be duplicates (${similarityPercentage}% match). They have the same date and amount, but different payee names.`
      case 'potential':
        return `These transactions might be related (${similarityPercentage}% match). Please review them carefully.`
      default:
        return 'These transactions appear to be potential duplicates. Please review them carefully.'
    }
  }
  
  // Get a severity color based on the conflict type and similarity
  const getSeverityColor = () => {
    const { conflictType, similarity } = conflict
    
    if (conflictType === 'date_amount_payee' && similarity > 0.9) {
      return 'bg-red-100 border-red-300'
    } else if ((conflictType === 'amount_payee' || conflictType === 'date_amount') && similarity > 0.8) {
      return 'bg-amber-100 border-amber-300'
    } else {
      return 'bg-blue-100 border-blue-300'
    }
  }

  return (
    <Card className={`mb-4 border-2 ${getSeverityColor()}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <CardTitle className="text-base">Potential Duplicate Transaction</CardTitle>
        </div>
        <CardDescription>
          {getConflictDescription()}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Manual Transaction */}
          <div className="space-y-2 border rounded-md p-3">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold">Manual Entry</h4>
              <Badge variant="outline">Manual</Badge>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Date: </span>
              <span className="font-medium">{format(new Date(conflict.manual.date), 'MMM d, yyyy')}</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Amount: </span>
              <span className={`font-medium ${conflict.manual.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatAmount(conflict.manual.amount)}
              </span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Payee: </span>
              <span className="font-medium">{conflict.manual.payee_name || conflict.manual.payee}</span>
            </div>
            {conflict.manual.notes && (
              <div>
                <span className="text-sm text-muted-foreground">Notes: </span>
                <span>{conflict.manual.notes}</span>
              </div>
            )}
            <div>
              <span className="text-sm text-muted-foreground">Category: </span>
              <span>{conflict.manual.category_name || 'Uncategorized'}</span>
            </div>
          </div>
          
          {/* Imported Transaction */}
          <div className="space-y-2 border rounded-md p-3">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold">Bank Import</h4>
              <Badge variant="outline">Bank</Badge>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Date: </span>
              <span className="font-medium">{format(new Date(conflict.imported.date), 'MMM d, yyyy')}</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Amount: </span>
              <span className={`font-medium ${conflict.imported.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatAmount(conflict.imported.amount)}
              </span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Payee: </span>
              <span className="font-medium">{conflict.imported.payee_name || conflict.imported.payee}</span>
            </div>
            {conflict.imported.notes && (
              <div>
                <span className="text-sm text-muted-foreground">Notes: </span>
                <span>{conflict.imported.notes}</span>
              </div>
            )}
            <div>
              <span className="text-sm text-muted-foreground">Category: </span>
              <span>{conflict.imported.category_name || 'Uncategorized'}</span>
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Resolution options */}
        <div className="space-y-3">
          <h4 className="font-medium">How would you like to resolve this?</h4>
          <RadioGroup value={resolution} onValueChange={(val) => setResolution(val as ResolutionOption)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="keep-imported" id="keep-imported" />
              <Label htmlFor="keep-imported">Keep bank transaction (delete manual)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="keep-manual" id="keep-manual" />
              <Label htmlFor="keep-manual">Keep manual transaction (delete bank)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="keep-both" id="keep-both" />
              <Label htmlFor="keep-both">Keep both transactions</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="link" id="link" />
              <Label htmlFor="link">Link transactions (mark as same transaction)</Label>
            </div>
          </RadioGroup>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2">
        <Button 
          variant="outline" 
          disabled={isResolving}
          onClick={() => setResolution('keep-both')}
        >
          Cancel
        </Button>
        <Button 
          onClick={() => onResolve(resolution)}
          disabled={isResolving}
        >
          {isResolving ? 'Resolving...' : 'Resolve Conflict'}
        </Button>
      </CardFooter>
    </Card>
  )
} 