'use client'

import { useState, useEffect } from 'react'
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface CreateAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

// Extracted Manual Account Form Component
function ManualAccountForm({ onSuccess, onOpenChange }: { onSuccess?: () => void, onOpenChange: (open: boolean) => void }) {
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
        <form onSubmit={handleSubmit}>
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
  )
}

// GoCardless Connection Form Component
function GoCardlessConnectionForm({ onSuccess, onOpenChange }: { onSuccess?: () => void, onOpenChange: (open: boolean) => void }) {
  const [isConfigured, setIsConfigured] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [countryList, setCountryList] = useState<{ id: string, name: string }[]>([])
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [bankList, setBankList] = useState<{ id: string, name: string, logo: string }[]>([])
  const [isLoadingBanks, setIsLoadingBanks] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if GoCardless is already configured at system level
  useEffect(() => {
    async function checkConfiguration() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/gocardless/status')
        if (response.ok) {
          const data = await response.json()
          setIsConfigured(data.configured)
          
          // If configured, also fetch the list of available countries
          if (data.configured) {
            const countriesResponse = await fetch('/api/gocardless/countries')
            if (countriesResponse.ok) {
              const countriesData = await countriesResponse.json()
              setCountryList(countriesData.countries || [])
            }
          }
        }
      } catch (err) {
        console.error('Failed to check GoCardless configuration:', err)
        setError('Failed to check GoCardless configuration. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    checkConfiguration()
  }, [])

  // Fetch banks when country is selected
  useEffect(() => {
    async function fetchBanks() {
      if (!selectedCountry) return

      try {
        setIsLoadingBanks(true)
        setError(null)
        const response = await fetch(`/api/gocardless/banks?country=${selectedCountry}`)
        
        if (response.ok) {
          const data = await response.json()
          setBankList(data.banks || [])
        } else {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Failed to fetch banks')
        }
      } catch (err) {
        console.error('Error fetching banks:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch banks')
      } finally {
        setIsLoadingBanks(false)
      }
    }

    if (selectedCountry) {
      fetchBanks()
    }
  }, [selectedCountry])

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCountry(e.target.value)
    setBankList([])
  }

  const handleBankSelect = async (bankId: string) => {
    try {
      setError(null)
      const response = await fetch('/api/gocardless/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          institutionId: bankId,
          country: selectedCountry
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to initiate bank connection')
      }

      const data = await response.json()
      
      // Open bank authorization link in new tab
      if (data.link) {
        window.open(data.link, '_blank')
        
        // Show instructions to user about redirect
        toast.success('Bank authorization page opened in a new tab. Please complete the authorization process and return to this page.')
        
        // Store requisition ID for later use (e.g. localStorage or context)
        localStorage.setItem('gocardless_requisition_id', data.requisitionId)
        
        // Here, ideally we would have a polling mechanism to check when the user completes auth
        // For now, we'll just close this dialog and let the user select accounts later
        // In a production app, you'd want to handle this more gracefully
      }
    } catch (err) {
      console.error('Error connecting to bank:', err)
      setError(err instanceof Error ? err.message : 'Failed to connect to bank')
    }
  }

  // Render a message if GoCardless is not configured at system level
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground">Checking GoCardless configuration...</p>
      </div>
    )
  }

  if (!isConfigured) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded relative">
          <p className="text-sm">
            GoCardless is not configured for this system. Please contact your administrator to set up the GoCardless integration.
          </p>
        </div>
        
        <DialogFooter className="w-full">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </div>
    )
  }

  // Render bank selection UI
  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      <div className="grid gap-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="country" className="text-right">
            Country
          </Label>
          <select 
            id="country" 
            value={selectedCountry}
            onChange={handleCountryChange}
            className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Select a country</option>
            {countryList.map(country => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
        
        {selectedCountry && (
          <div className="mt-4">
            <Label className="block mb-2">Select your bank</Label>
            {isLoadingBanks ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 mt-2">
                {bankList.map(bank => (
                  <div 
                    key={bank.id}
                    onClick={() => handleBankSelect(bank.id)}
                    className="flex items-center p-3 border rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                  >
                    <div className="w-8 h-8 mr-2 flex-shrink-0">
                      {bank.logo ? (
                        <img src={bank.logo} alt={bank.name} className="w-full h-full object-contain" />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center rounded-full">
                          <span className="text-xs">{bank.name.substring(0, 2)}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium">{bank.name}</span>
                  </div>
                ))}
                
                {bankList.length === 0 && (
                  <div className="col-span-2 text-center py-4 text-muted-foreground">
                    No banks available for the selected country.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DialogClose>
      </DialogFooter>
    </div>
  )
}

export function CreateAccountDialog({ 
  open, 
  onOpenChange,
  onSuccess 
}: CreateAccountDialogProps) {
  const [activeTab, setActiveTab] = useState<string>("manual")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Account</DialogTitle>
          <DialogDescription>
            Add a new account to track your finances.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="bank">Connect Bank</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual">
            <ManualAccountForm onSuccess={onSuccess} onOpenChange={onOpenChange} />
          </TabsContent>
          
          <TabsContent value="bank">
            <GoCardlessConnectionForm onSuccess={onSuccess} onOpenChange={onOpenChange} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 