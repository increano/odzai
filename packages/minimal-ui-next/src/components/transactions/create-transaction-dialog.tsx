'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Calendar } from 'lucide-react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { useWorkspace } from '@/components/WorkspaceProvider'

interface Account {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface CreateTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultAccountId?: string;
  accounts?: Account[];
}

export function CreateTransactionDialog({ 
  open, 
  onOpenChange,
  onSuccess,
  defaultAccountId,
  accounts: providedAccounts
}: CreateTransactionDialogProps) {
  // Form state
  const [date, setDate] = useState<Date>(new Date());
  const [amount, setAmount] = useState<string>('0');
  const [payee, setPayee] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [accountId, setAccountId] = useState<string>(defaultAccountId || '');
  
  // Get current workspace ID
  const { currentWorkspaceId } = useWorkspace();
  
  // Data state
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch accounts and categories on mount
  useEffect(() => {
    if (open) {
      if (!providedAccounts) {
        fetchAccounts();
      } else {
        setAccounts(providedAccounts);
      }
      fetchCategories();
      // Reset form when reopening (except for account ID if provided)
      resetForm(defaultAccountId);
    }
  }, [open, defaultAccountId, providedAccounts]);

  // Update accountId when defaultAccountId changes
  useEffect(() => {
    if (defaultAccountId) {
      setAccountId(defaultAccountId);
    }
  }, [defaultAccountId]);

  // Fetch accounts from API
  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      // Include workspaceId in the request
      const url = currentWorkspaceId 
        ? `/api/accounts?workspaceId=${currentWorkspaceId}`
        : '/api/accounts';
        
      const response = await fetch(url, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }
      const data = await response.json();
      setAccounts(data);
    } catch (err) {
      console.error('Error fetching accounts:', err);
      toast.error('Failed to load accounts');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch categories from API
  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      // Include workspaceId in the request if we create an endpoint for categories
      const response = await fetch('/api/categories', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      toast.error('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form state
  const resetForm = (accountIdToKeep?: string) => {
    setDate(new Date());
    setAmount('0');
    setPayee('');
    setNotes('');
    setCategoryId('');
    // Only reset accountId if no defaultAccountId is provided
    if (!accountIdToKeep) {
      setAccountId('');
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!accountId) {
      toast.error('Please select an account');
      return;
    }

    // Parse amount and check if it's a valid number
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue)) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Format date as YYYY-MM-DD
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      // Convert amount to cents (integer) for storage
      const amountCents = Math.round(amountValue * 100);
      
      // Create transaction object
      const transaction = {
        date: formattedDate,
        amount: amountCents,
        payee_name: payee,
        notes: notes,
        category: categoryId || null
      };
      
      // Send to API with workspace ID
      const url = currentWorkspaceId 
        ? `/api/transactions?workspaceId=${currentWorkspaceId}`
        : '/api/transactions';
        
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId,
          transaction
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create transaction');
      }
      
      // Show success message
      toast.success('Transaction added successfully');
      
      // Reset form and close dialog
      resetForm();
      onOpenChange(false);
      
      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
            <DialogDescription>
              Create a new transaction for your account.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Date Field */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="transaction-date" className="text-right">
                Date
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="transaction-date"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {date ? format(date, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={date}
                      onSelect={(date) => date && setDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            {/* Account Field */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="account" className="text-right">
                Account
              </Label>
              <div className="col-span-3">
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger id="account">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Amount Field */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <div className="col-span-3">
                <div className="flex">
                  <div className="bg-muted flex items-center px-3 border border-r-0 rounded-l-md border-input">
                    $
                  </div>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    step="0.01"
                    className="rounded-l-none"
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Use negative values for expenses (e.g. -10.50)
                </div>
              </div>
            </div>
            
            {/* Payee Field */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="payee" className="text-right">
                Payee
              </Label>
              <Input
                id="payee"
                value={payee}
                onChange={(e) => setPayee(e.target.value)}
                className="col-span-3"
                placeholder="e.g. Grocery Store"
              />
            </div>
            
            {/* Category Field */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <div className="col-span-3">
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Notes Field */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="col-span-3"
                placeholder="Optional notes"
              />
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Transaction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 