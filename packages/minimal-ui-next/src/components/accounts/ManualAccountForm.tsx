'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
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
import { Checkbox } from '@/components/ui/checkbox'
import { currencyFormatter } from '@/lib/utils'

type AccountType = 'checking' | 'savings' | 'credit' | 'investment' | 'mortgage' | 'debt' | 'other'

export default function ManualAccountForm() {
  const router = useRouter()
  const [accountName, setAccountName] = useState('')
  const [accountType, setAccountType] = useState<AccountType>('checking')
  const [initialBalance, setInitialBalance] = useState('')
  const [offBudget, setOffBudget] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!accountName) {
      toast.error('Account name is required')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Format the balance - convert to cents/smallest currency unit
      const balanceAmount = initialBalance 
        ? Math.round(parseFloat(initialBalance) * 100) 
        : 0
      
      // Create the account
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: accountName,
          type: accountType,
          initialBalance: balanceAmount,
          offBudget
        }),
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create account')
      }
      
      toast.success('Account created successfully')
      router.push('/accounts')
    } catch (error) {
      console.error('Error creating account:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create account')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="accountName">Account Name</Label>
        <Input
          id="accountName"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          placeholder="e.g. Checking Account"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="accountType">Account Type</Label>
        <Select
          value={accountType}
          onValueChange={(value) => setAccountType(value as AccountType)}
        >
          <SelectTrigger id="accountType">
            <SelectValue placeholder="Select account type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="checking">Checking</SelectItem>
            <SelectItem value="savings">Savings</SelectItem>
            <SelectItem value="credit">Credit Card</SelectItem>
            <SelectItem value="investment">Investment</SelectItem>
            <SelectItem value="mortgage">Mortgage</SelectItem>
            <SelectItem value="debt">Debt</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="initialBalance">Initial Balance</Label>
        <Input
          id="initialBalance"
          type="number"
          step="0.01"
          value={initialBalance}
          onChange={(e) => setInitialBalance(e.target.value)}
          placeholder="0.00"
        />
        <p className="text-xs text-muted-foreground">
          Enter the current balance of this account.
        </p>
      </div>
      
      <div className="flex items-center space-x-2 pt-2">
        <Checkbox
          id="offBudget"
          checked={offBudget}
          onCheckedChange={(checked) => setOffBudget(checked === true)}
        />
        <Label
          htmlFor="offBudget"
          className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Off Budget (exclude from budget calculations)
        </Label>
      </div>
      
      <Button type="submit" className="w-full mt-6" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Account'}
      </Button>
    </form>
  )
} 