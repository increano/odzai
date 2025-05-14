'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

interface CreateAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateAccountDialog({ 
  open, 
  onOpenChange,
  onSuccess 
}: CreateAccountDialogProps) {
  const [accountName, setAccountName] = useState('')
  const [initialBalance, setInitialBalance] = useState('0')
  const [isOffBudget, setIsOffBudget] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!accountName.trim()) {
      toast.error('Please enter an account name')
      return
    }
    
    // Validate initial balance is a number
    const balanceValue = parseFloat(initialBalance)
    if (isNaN(balanceValue)) {
      toast.error('Initial balance must be a valid number')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Convert balance to cents (integer) for storage
      const balanceCents = Math.round(balanceValue * 100)
      
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account: {
            name: accountName,
            offBudget: isOffBudget
          },
          initialBalance: balanceCents
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create account')
      }
      
      // Reset form
      setAccountName('')
      setInitialBalance('0')
      setIsOffBudget(false)
      
      // Show success message
      toast.success('Account created successfully')
      
      // Close the dialog
      onOpenChange(false)
      
      // Call the onSuccess callback
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Error creating account:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create account')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Account</DialogTitle>
            <DialogDescription>
              Add a new account to track your finances. Enter the account details below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="col-span-3"
                placeholder="Checking Account"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="initial-balance" className="text-right">
                Initial Balance
              </Label>
              <Input
                id="initial-balance"
                type="number"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className="col-span-3"
                placeholder="0.00"
                step="0.01"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="text-right">
                <Label htmlFor="off-budget" className="text-right">
                  Off Budget
                </Label>
              </div>
              <div className="col-span-3 flex items-center gap-2">
                <Checkbox
                  id="off-budget"
                  checked={isOffBudget}
                  onCheckedChange={(checked: boolean | 'indeterminate') => setIsOffBudget(checked === true)}
                />
                <Label htmlFor="off-budget" className="text-sm text-muted-foreground">
                  Exclude this account from budget calculations
                </Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 