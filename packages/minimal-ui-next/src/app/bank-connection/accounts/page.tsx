'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle2 } from 'lucide-react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ClientWrapper } from '@/components/ClientWrapper'

interface BankAccount {
  id: string
  name: string
  iban: string
  balances: {
    available: { amount: string; currency: string }
    current: { amount: string; currency: string }
  }
  institution_id: string
  status: string
}

export default function AccountSelectionPage() {
  return (
    <ClientWrapper>
      <AccountSelectionContent />
    </ClientWrapper>
  );
}

function AccountSelectionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requisitionId = searchParams.get('requisition_id')
  
  const [loading, setLoading] = useState(true)
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [selectedAccounts, setSelectedAccounts] = useState<{[key: string]: {selected: boolean, offBudget: boolean, name: string}}>({})
  const [linkingAccounts, setLinkingAccounts] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Fetch available accounts for the requisition
  useEffect(() => {
    async function fetchAccounts() {
      if (!requisitionId) {
        setError('Missing requisition ID')
        setLoading(false)
        return
      }
      
      try {
        const response = await fetch(`/api/gocardless/accounts?requisition_id=${requisitionId}`)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch accounts')
        }
        
        const data = await response.json()
        setAccounts(data.accounts || [])
        
        // Initialize selected accounts state
        const initialSelections: {[key: string]: {selected: boolean, offBudget: boolean, name: string}} = {}
        data.accounts.forEach((account: BankAccount) => {
          initialSelections[account.id] = {
            selected: false,
            offBudget: false,
            name: account.name
          }
        })
        setSelectedAccounts(initialSelections)
      } catch (err) {
        console.error('Error fetching accounts:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch accounts')
      } finally {
        setLoading(false)
      }
    }
    
    fetchAccounts()
  }, [requisitionId])
  
  // Handle account selection toggle
  const toggleAccountSelection = (accountId: string) => {
    setSelectedAccounts(prev => ({
      ...prev,
      [accountId]: {
        ...prev[accountId],
        selected: !prev[accountId].selected
      }
    }))
  }
  
  // Handle off-budget toggle
  const toggleOffBudget = (accountId: string) => {
    setSelectedAccounts(prev => ({
      ...prev,
      [accountId]: {
        ...prev[accountId],
        offBudget: !prev[accountId].offBudget
      }
    }))
  }
  
  // Handle account name change
  const handleNameChange = (accountId: string, name: string) => {
    setSelectedAccounts(prev => ({
      ...prev,
      [accountId]: {
        ...prev[accountId],
        name
      }
    }))
  }
  
  // Link selected accounts
  const linkAccounts = async () => {
    const accountsToLink = Object.entries(selectedAccounts)
      .filter(([_, values]) => values.selected)
      .map(([accountId, values]) => ({
        requisitionId,
        accountId,
        offBudget: values.offBudget,
        customName: values.name !== accounts.find(a => a.id === accountId)?.name ? values.name : undefined
      }))
    
    if (accountsToLink.length === 0) {
      toast.error('Please select at least one account to link')
      return
    }
    
    setLinkingAccounts(true)
    setError(null)
    
    try {
      // Link each selected account
      for (const accountData of accountsToLink) {
        const response = await fetch('/api/accounts/link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(accountData),
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `Failed to link account ${accountData.accountId}`)
        }
      }
      
      toast.success('Accounts linked successfully')
      
      // Redirect to accounts page
      router.push('/accounts')
    } catch (err) {
      console.error('Error linking accounts:', err)
      setError(err instanceof Error ? err.message : 'Failed to link accounts')
      toast.error(err instanceof Error ? err.message : 'Failed to link accounts')
    } finally {
      setLinkingAccounts(false)
    }
  }
  
  // Format currency amount for display
  const formatAmount = (amount: string, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(parseFloat(amount))
  }
  
  if (!requisitionId) {
    return (
      <div className="container mx-auto py-12">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>Missing requisition ID. Please try connecting your bank again.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push('/accounts')}>Back to Accounts</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto py-12">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Link Bank Accounts</CardTitle>
          <CardDescription>
            Select the accounts you want to add to Actual Budget.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
              <p className="text-sm">{error}</p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No accounts available for this connection.
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map(account => (
                <div 
                  key={account.id} 
                  className={`border rounded-lg p-4 ${selectedAccounts[account.id]?.selected ? 'border-primary bg-primary/5' : 'border-border'}`}
                >
                  <div className="grid md:grid-cols-[1fr,auto] gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id={`select-${account.id}`}
                          checked={selectedAccounts[account.id]?.selected || false}
                          onCheckedChange={() => toggleAccountSelection(account.id)}
                        />
                        <div className="grid gap-1.5 w-full">
                          <Label htmlFor={`name-${account.id}`}>Account name</Label>
                          <Input 
                            id={`name-${account.id}`}
                            value={selectedAccounts[account.id]?.name || account.name}
                            onChange={(e) => handleNameChange(account.id, e.target.value)}
                            disabled={!selectedAccounts[account.id]?.selected}
                          />
                        </div>
                      </div>
                      
                      {selectedAccounts[account.id]?.selected && (
                        <div className="flex items-center space-x-2 ml-6">
                          <Checkbox 
                            id={`offbudget-${account.id}`}
                            checked={selectedAccounts[account.id]?.offBudget || false}
                            onCheckedChange={() => toggleOffBudget(account.id)}
                          />
                          <Label htmlFor={`offbudget-${account.id}`} className="text-sm">
                            Off Budget (exclude from budget calculations)
                          </Label>
                        </div>
                      )}
                      
                      <div className="ml-6 text-sm text-muted-foreground">
                        {account.iban && <div>IBAN: {account.iban}</div>}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end justify-center">
                      <div className="text-lg font-medium">
                        {formatAmount(account.balances.current.amount, account.balances.current.currency)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Current Balance
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push('/accounts')}>
            Cancel
          </Button>
          <Button 
            onClick={linkAccounts} 
            disabled={loading || linkingAccounts || Object.values(selectedAccounts).every(acc => !acc.selected)}
          >
            {linkingAccounts ? (
              <>
                <span className="mr-2">Linking...</span>
                <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-current rounded-full"></div>
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Link Selected Accounts
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 