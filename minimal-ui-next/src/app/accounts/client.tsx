'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  PlusCircle, 
  Pencil, 
  Trash2, 
  ArrowUpDown,
  BanknoteIcon,
  CreditCardIcon,
  PiggyBankIcon
} from "lucide-react";

// Define types
type Account = {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'cash';
  balance: number;
  onBudget: boolean;
  lastReconciled?: string;
};

export default function AccountsClient() {
  // State
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [newAccount, setNewAccount] = useState<Partial<Account>>({
    type: 'checking',
    onBudget: true,
  });
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'balance'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  // Load accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      setIsLoading(true);
      try {
        // For demo purposes, using mock data
        // In a real app, this would be an API call
        const mockAccounts: Account[] = [
          { id: 'acct1', name: 'Checking Account', type: 'checking', balance: 250000, onBudget: true, lastReconciled: '2023-12-15' },
          { id: 'acct2', name: 'Savings Account', type: 'savings', balance: 500000, onBudget: true },
          { id: 'acct3', name: 'Credit Card', type: 'credit', balance: -120000, onBudget: true, lastReconciled: '2023-11-30' },
          { id: 'acct4', name: 'Investment Account', type: 'investment', balance: 1500000, onBudget: false },
          { id: 'acct5', name: 'Emergency Fund', type: 'savings', balance: 300000, onBudget: true },
        ];
        
        setAccounts(mockAccounts);
      } catch (error) {
        console.error('Error fetching accounts:', error);
        toast.error('Failed to load accounts');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAccounts();
  }, []);

  // Handle sort
  const handleSort = (column: 'name' | 'balance') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Sort accounts
  const sortedAccounts = [...accounts].sort((a, b) => {
    if (sortBy === 'name') {
      return sortOrder === 'asc' 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name);
    } else {
      return sortOrder === 'asc' 
        ? a.balance - b.balance 
        : b.balance - a.balance;
    }
  });

  // Calculate totals
  const calculateTotals = () => {
    const onBudgetTotal = accounts
      .filter(account => account.onBudget)
      .reduce((sum, account) => sum + account.balance, 0);
    
    const offBudgetTotal = accounts
      .filter(account => !account.onBudget)
      .reduce((sum, account) => sum + account.balance, 0);
    
    const total = accounts.reduce((sum, account) => sum + account.balance, 0);
    
    return { onBudgetTotal, offBudgetTotal, total };
  };

  const totals = calculateTotals();

  // Add new account
  const handleAddAccount = async () => {
    if (!newAccount.name || !newAccount.type) {
      toast.error('Please provide a name and type for the account');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // In a real app, this would be an API call
      const newId = `acct${Date.now()}`;
      const createdAccount: Account = {
        id: newId,
        name: newAccount.name,
        type: newAccount.type as 'checking' | 'savings' | 'credit' | 'investment' | 'cash',
        balance: newAccount.balance || 0,
        onBudget: newAccount.onBudget ?? true,
      };
      
      setAccounts(prevAccounts => [...prevAccounts, createdAccount]);
      setNewAccount({
        type: 'checking',
        onBudget: true,
      });
      setIsAddDialogOpen(false);
      toast.success('Account created successfully');
    } catch (error) {
      console.error('Error creating account:', error);
      toast.error('Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  // Update account
  const handleUpdateAccount = async () => {
    if (!editingAccount) return;
    
    setIsLoading(true);
    
    try {
      // In a real app, this would be an API call
      setAccounts(prevAccounts => 
        prevAccounts.map(account => 
          account.id === editingAccount.id ? editingAccount : account
        )
      );
      
      setIsEditDialogOpen(false);
      toast.success('Account updated successfully');
    } catch (error) {
      console.error('Error updating account:', error);
      toast.error('Failed to update account');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (!editingAccount) return;
    
    setIsLoading(true);
    
    try {
      // In a real app, this would be an API call
      setAccounts(prevAccounts => 
        prevAccounts.filter(account => account.id !== editingAccount.id)
      );
      
      setIsDeleteDialogOpen(false);
      setEditingAccount(null);
      toast.success('Account deleted successfully');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    } finally {
      setIsLoading(false);
    }
  };

  // Render account icon based on type
  const renderAccountIcon = (type: string) => {
    switch (type) {
      case 'checking':
        return <BanknoteIcon className="h-4 w-4 text-primary" />;
      case 'credit':
        return <CreditCardIcon className="h-4 w-4 text-destructive" />;
      case 'savings':
      case 'investment':
        return <PiggyBankIcon className="h-4 w-4 text-green-600" />;
      default:
        return <BanknoteIcon className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Accounts</h1>
        <Button 
          className="mt-4 sm:mt-0" 
          onClick={() => setIsAddDialogOpen(true)}
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add Account
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Summary</CardTitle>
          <CardDescription>Overview of your financial accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-md">
              <h3 className="text-sm font-medium text-muted-foreground">On-Budget Accounts</h3>
              <p className="text-2xl font-bold">{formatCurrency(totals.onBudgetTotal)}</p>
            </div>
            <div className="p-4 border rounded-md">
              <h3 className="text-sm font-medium text-muted-foreground">Off-Budget Accounts</h3>
              <p className="text-2xl font-bold">{formatCurrency(totals.offBudgetTotal)}</p>
            </div>
            <div className="p-4 border rounded-md">
              <h3 className="text-sm font-medium text-muted-foreground">Net Worth</h3>
              <p className="text-2xl font-bold">{formatCurrency(totals.total)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Accounts</CardTitle>
          <CardDescription>Manage your financial accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>
                      <button 
                        className="flex items-center text-left font-medium"
                        onClick={() => handleSort('name')}
                      >
                        Name 
                        <ArrowUpDown className={`ml-2 h-4 w-4 ${sortBy === 'name' ? 'opacity-100' : 'opacity-40'}`} />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button 
                        className="flex items-center text-left font-medium"
                        onClick={() => handleSort('balance')}
                      >
                        Balance
                        <ArrowUpDown className={`ml-2 h-4 w-4 ${sortBy === 'balance' ? 'opacity-100' : 'opacity-40'}`} />
                      </button>
                    </TableHead>
                    <TableHead>On Budget</TableHead>
                    <TableHead>Last Reconciled</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAccounts.map(account => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <div className="flex items-center">
                          {renderAccountIcon(account.type)}
                          <span className="ml-2 capitalize">{account.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell className={`font-mono ${account.balance < 0 ? 'text-destructive' : ''}`}>
                        {formatCurrency(account.balance)}
                      </TableCell>
                      <TableCell>{account.onBudget ? 'Yes' : 'No'}</TableCell>
                      <TableCell>
                        {account.lastReconciled ? new Date(account.lastReconciled).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingAccount(account);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingAccount(account);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              {isLoading ? 'Loading accounts...' : 'No accounts found. Add your first account to get started.'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Account Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Account</DialogTitle>
            <DialogDescription>
              Create a new financial account to track your money.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="account-name">Account Name</Label>
              <Input
                id="account-name"
                placeholder="e.g., Checking Account"
                value={newAccount.name || ''}
                onChange={e => setNewAccount({...newAccount, name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="account-type">Account Type</Label>
              <Select
                value={newAccount.type}
                onValueChange={value => setNewAccount({...newAccount, type: value as any})}
              >
                <SelectTrigger id="account-type">
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Checking</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="credit">Credit Card</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="account-balance">Starting Balance</Label>
              <Input
                id="account-balance"
                type="number"
                step="0.01"
                placeholder="0.00"
                onChange={e => setNewAccount({
                  ...newAccount, 
                  balance: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : 0
                })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter the current balance of this account.
                For credit cards, enter a negative amount if you owe money.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="on-budget"
                checked={newAccount.onBudget ?? true}
                onChange={e => setNewAccount({...newAccount, onBudget: e.target.checked})}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="on-budget">Include in budget calculations</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddAccount} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Account Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
            <DialogDescription>
              Update your account information.
            </DialogDescription>
          </DialogHeader>
          {editingAccount && (
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="edit-account-name">Account Name</Label>
                <Input
                  id="edit-account-name"
                  value={editingAccount.name}
                  onChange={e => setEditingAccount({...editingAccount, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-account-type">Account Type</Label>
                <Select
                  value={editingAccount.type}
                  onValueChange={value => setEditingAccount({...editingAccount, type: value as any})}
                >
                  <SelectTrigger id="edit-account-type">
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Checking</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="credit">Credit Card</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="edit-on-budget"
                  checked={editingAccount.onBudget}
                  onChange={e => setEditingAccount({...editingAccount, onBudget: e.target.checked})}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="edit-on-budget">Include in budget calculations</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateAccount} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this account? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {editingAccount && (
            <div className="py-4">
              <p className="font-medium">{editingAccount.name}</p>
              <p className="text-muted-foreground">{formatCurrency(editingAccount.balance)}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={isLoading}>
              {isLoading ? 'Deleting...' : 'Delete Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 