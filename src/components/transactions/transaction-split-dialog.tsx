import React, { useState, useEffect } from 'react'
import { MinusCircle, PlusCircle, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'

interface Category {
  id: string
  name: string
}

interface CategoryGroup {
  id: string
  name: string
  categories: Category[]
}

interface SplitItem {
  amount: number
  category: string | null
  notes: string
}

interface Transaction {
  id: string
  date: string
  amount: number
  payee: string
  payee_name?: string
  account: string
  category?: string
  category_name?: string
  notes?: string
}

interface TransactionSplitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: Transaction | null
  onSplitTransaction: (transactionId: string, splits: SplitItem[]) => Promise<void>
  categories: CategoryGroup[]
}

export function TransactionSplitDialog({
  open,
  onOpenChange,
  transaction,
  onSplitTransaction,
  categories
}: TransactionSplitDialogProps) {
  const [splits, setSplits] = useState<SplitItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalAmount, setTotalAmount] = useState(0)
  const [amountDifference, setAmountDifference] = useState(0)

  // Reset state when transaction changes
  useEffect(() => {
    if (transaction) {
      // Initialize with two splits
      const initialSplits: SplitItem[] = [
        {
          amount: Math.round(transaction.amount / 2),
          category: transaction.category || null,
          notes: ''
        },
        {
          amount: Math.round(transaction.amount / 2),
          category: null,
          notes: ''
        }
      ]
      
      // Adjust the last split to ensure the total matches the original amount
      const initialTotal = initialSplits.reduce((sum, split) => sum + split.amount, 0)
      if (initialTotal !== transaction.amount) {
        const diff = transaction.amount - initialTotal
        initialSplits[initialSplits.length - 1].amount += diff
      }
      
      setSplits(initialSplits)
      setTotalAmount(transaction.amount)
      setAmountDifference(0)
      setError(null)
    }
  }, [transaction])

  // Recalculate total and difference when splits change
  useEffect(() => {
    if (transaction) {
      const calculatedTotal = splits.reduce((sum, split) => sum + split.amount, 0)
      setTotalAmount(calculatedTotal)
      setAmountDifference(transaction.amount - calculatedTotal)
    }
  }, [splits, transaction])

  const handleAddSplit = () => {
    setSplits([...splits, { amount: 0, category: null, notes: '' }])
  }

  const handleRemoveSplit = (index: number) => {
    if (splits.length <= 2) {
      setError('At least two splits are required')
      return
    }
    
    const newSplits = [...splits]
    newSplits.splice(index, 1)
    setSplits(newSplits)
  }

  const handleSplitChange = (index: number, field: keyof SplitItem, value: any) => {
    const newSplits = [...splits]
    
    if (field === 'amount') {
      // Parse amount as number, ensuring it's a valid number
      const numValue = parseFloat(value)
      newSplits[index][field] = isNaN(numValue) ? 0 : Math.round(numValue * 100)
    } else {
      // @ts-ignore - we know the field is valid
      newSplits[index][field] = value
    }
    
    setSplits(newSplits)
  }

  const handleSubmit = async () => {
    if (!transaction) return
    
    // Validate total amount matches original
    if (amountDifference !== 0) {
      setError('Split amounts must sum to the original transaction amount')
      return
    }
    
    // Validate all splits have categories
    const missingCategory = splits.some(split => !split.category)
    if (missingCategory) {
      setError('All splits must have a category selected')
      return
    }
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      await onSplitTransaction(transaction.id, splits)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to split transaction')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount / 100)
  }

  if (!transaction) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Split Transaction</DialogTitle>
          <DialogDescription>
            Split "{transaction.payee_name || transaction.payee}" for {formatCurrency(transaction.amount)} on {format(new Date(transaction.date), 'MMM d, yyyy')}
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {splits.map((split, index) => (
            <div key={index} className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-3">
                <Label htmlFor={`amount-${index}`}>Amount</Label>
                <Input
                  id={`amount-${index}`}
                  type="number"
                  step="0.01"
                  value={(split.amount / 100).toFixed(2)}
                  onChange={(e) => handleSplitChange(index, 'amount', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div className="col-span-7">
                <Label htmlFor={`category-${index}`}>Category</Label>
                <Select 
                  value={split.category || ""}
                  onValueChange={(value) => handleSplitChange(index, 'category', value)}
                >
                  <SelectTrigger id={`category-${index}`} className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(group => (
                      <React.Fragment key={group.id}>
                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                          {group.name}
                        </div>
                        {group.categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </React.Fragment>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-2 flex items-end justify-center mt-6">
                <Button 
                  variant="ghost" 
                  size="icon"
                  type="button"
                  onClick={() => handleRemoveSplit(index)}
                >
                  <MinusCircle className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="col-span-12">
                <Label htmlFor={`notes-${index}`}>Notes</Label>
                <Textarea
                  id={`notes-${index}`}
                  value={split.notes}
                  onChange={(e) => handleSplitChange(index, 'notes', e.target.value)}
                  className="mt-1 h-20"
                  placeholder="Optional notes for this part"
                />
              </div>
            </div>
          ))}
          
          <Button
            variant="outline"
            type="button"
            onClick={handleAddSplit}
            className="w-full"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Split
          </Button>
        </div>
        
        <div className="flex justify-between items-center font-medium">
          <div>Original Amount: {formatCurrency(transaction.amount)}</div>
          <div>Current Total: {formatCurrency(totalAmount)}</div>
          <div className={amountDifference !== 0 ? "text-red-500" : "text-green-500"}>
            Difference: {formatCurrency(amountDifference)}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || amountDifference !== 0}
          >
            {isSubmitting ? 'Splitting...' : 'Split Transaction'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 