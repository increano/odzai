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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  PlusCircle, 
  Search, 
  Filter, 
  ArrowDownUp, 
  Pencil, 
  Trash2,
  Download,
  Upload,
  CheckCircle2,
  Calendar
} from "lucide-react";
import { format } from 'date-fns';
import { useWorkspace } from '@/context/workspace-context';

// Define types
interface Transaction {
  id: string;
  date: string;
  accountId: string;
  accountName: string;
  payee: string;
  category: string;
  amount: number;
  notes?: string;
  cleared: boolean;
  reconciled: boolean;
}

interface Account {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  group: string;
}

export default function TransactionsClient() {
  const { currentWorkspace } = useWorkspace();
  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    date: format(new Date(), 'yyyy-MM-dd'),
    cleared: false,
    reconciled: false,
  });
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'thisMonth' | 'lastMonth' | 'thisYear'>('all');
  const [clearedFilter, setClearedFilter] = useState<'all' | 'cleared' | 'uncleared'>('all');
  
  // Sorting
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  // Load transactions, accounts, and categories
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Check if current workspace has sample data enabled
        const useSampleData = currentWorkspace 
          ? localStorage.getItem(`odzai-workspace-${currentWorkspace.id}-sample-data`) === 'true'
          : false;
        
        // Try to get existing data from localStorage first
        const existingTransactions = localStorage.getItem(`odzai-transactions-${currentWorkspace?.id}`);
        const existingAccounts = localStorage.getItem(`odzai-accounts-${currentWorkspace?.id}`);
        const existingCategories = localStorage.getItem(`odzai-categories-${currentWorkspace?.id}`);
        
        // Mock data for accounts
        const mockAccounts: Account[] = [
          { id: 'acct1', name: 'Checking Account' },
          { id: 'acct2', name: 'Savings Account' },
          { id: 'acct3', name: 'Credit Card' },
        ];
        
        // Mock data for categories
        const mockCategories: Category[] = [
          { id: 'cat1', name: 'Groceries', group: 'Food' },
          { id: 'cat2', name: 'Dining Out', group: 'Food' },
          { id: 'cat3', name: 'Rent', group: 'Housing' },
          { id: 'cat4', name: 'Utilities', group: 'Housing' },
          { id: 'cat5', name: 'Gas', group: 'Transportation' },
          { id: 'cat6', name: 'Public Transit', group: 'Transportation' },
          { id: 'cat7', name: 'Salary', group: 'Income' },
        ];
        
        // Mock data for transactions
        const mockTransactions: Transaction[] = [
          { 
            id: 'tx1', 
            date: '2023-04-15', 
            accountId: 'acct1', 
            accountName: 'Checking Account',
            payee: 'Grocery Store', 
            category: 'Groceries', 
            amount: -7525, 
            notes: 'Weekly groceries',
            cleared: true, 
            reconciled: true 
          },
          { 
            id: 'tx2', 
            date: '2023-04-18', 
            accountId: 'acct1', 
            accountName: 'Checking Account',
            payee: 'Restaurant', 
            category: 'Dining Out', 
            amount: -3250, 
            cleared: true, 
            reconciled: false 
          },
          { 
            id: 'tx3', 
            date: '2023-04-20', 
            accountId: 'acct1', 
            accountName: 'Checking Account',
            payee: 'Gas Station', 
            category: 'Gas', 
            amount: -4500, 
            cleared: false, 
            reconciled: false 
          },
          { 
            id: 'tx4', 
            date: '2023-04-25', 
            accountId: 'acct1', 
            accountName: 'Checking Account',
            payee: 'Employer', 
            category: 'Salary', 
            amount: 250000, 
            notes: 'Monthly salary',
            cleared: true, 
            reconciled: false 
          },
          { 
            id: 'tx5', 
            date: '2023-04-01', 
            accountId: 'acct1', 
            accountName: 'Checking Account',
            payee: 'Landlord', 
            category: 'Rent', 
            amount: -120000, 
            notes: 'Monthly rent',
            cleared: true, 
            reconciled: true 
          },
          { 
            id: 'tx6', 
            date: '2023-04-05', 
            accountId: 'acct2', 
            accountName: 'Savings Account',
            payee: 'Transfer', 
            category: 'Savings', 
            amount: 50000, 
            notes: 'Monthly savings',
            cleared: true, 
            reconciled: false 
          },
          { 
            id: 'tx7', 
            date: '2023-04-10', 
            accountId: 'acct3', 
            accountName: 'Credit Card',
            payee: 'Online Store', 
            category: 'Shopping', 
            amount: -8999, 
            cleared: false, 
            reconciled: false 
          },
        ];

        // Set accounts data
        if (existingAccounts) {
          setAccounts(JSON.parse(existingAccounts));
        } else if (useSampleData) {
          setAccounts(mockAccounts);
          // Save to localStorage
          localStorage.setItem(`odzai-accounts-${currentWorkspace?.id}`, JSON.stringify(mockAccounts));
        } else {
          setAccounts([]);
        }

        // Set categories data
        if (existingCategories) {
          setCategories(JSON.parse(existingCategories));
        } else if (useSampleData) {
          setCategories(mockCategories);
          // Save to localStorage
          localStorage.setItem(`odzai-categories-${currentWorkspace?.id}`, JSON.stringify(mockCategories));
        } else {
          setCategories([]);
        }

        // Set transactions data
        if (existingTransactions) {
          setTransactions(JSON.parse(existingTransactions));
        } else if (useSampleData) {
          setTransactions(mockTransactions);
          // Save to localStorage
          localStorage.setItem(`odzai-transactions-${currentWorkspace?.id}`, JSON.stringify(mockTransactions));
        } else {
          setTransactions([]);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    if (currentWorkspace) {
      fetchData();
    }
  }, [currentWorkspace]);

  // Handle sort
  const handleSort = (column: 'date' | 'amount') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    // Search term filter
    const matchesSearch = searchTerm === '' || 
      transaction.payee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.notes && transaction.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Account filter
    const matchesAccount = accountFilter === 'all' || transaction.accountId === accountFilter;
    
    // Category filter
    const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter;
    
    // Date filter
    let matchesDate = true;
    const txDate = new Date(transaction.date);
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    if (dateFilter === 'thisMonth') {
      matchesDate = txDate.getMonth() === thisMonth && txDate.getFullYear() === thisYear;
    } else if (dateFilter === 'lastMonth') {
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
      const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
      matchesDate = txDate.getMonth() === lastMonth && txDate.getFullYear() === lastMonthYear;
    } else if (dateFilter === 'thisYear') {
      matchesDate = txDate.getFullYear() === thisYear;
    }
    
    // Cleared filter
    let matchesCleared = true;
    if (clearedFilter === 'cleared') {
      matchesCleared = transaction.cleared;
    } else if (clearedFilter === 'uncleared') {
      matchesCleared = !transaction.cleared;
    }
    
    return matchesSearch && matchesAccount && matchesCategory && matchesDate && matchesCleared;
  });

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    } else {
      return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
    }
  });

  // Handle creating a new transaction
  const handleAddTransaction = async () => {
    if (!newTransaction.accountId || !newTransaction.payee || !newTransaction.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      // Find the account name
      const account = accounts.find(a => a.id === newTransaction.accountId);
      
      // Create new transaction
      const transaction: Transaction = {
        id: `tx-${Date.now()}`,
        date: newTransaction.date || format(new Date(), 'yyyy-MM-dd'),
        accountId: newTransaction.accountId,
        accountName: account?.name || '',
        payee: newTransaction.payee,
        category: newTransaction.category,
        amount: newTransaction.amount || 0,
        notes: newTransaction.notes,
        cleared: newTransaction.cleared || false,
        reconciled: newTransaction.reconciled || false,
      };

      // Add to state
      const updatedTransactions = [...transactions, transaction];
      setTransactions(updatedTransactions);
      
      // Save to localStorage
      if (currentWorkspace) {
        localStorage.setItem(`odzai-transactions-${currentWorkspace.id}`, JSON.stringify(updatedTransactions));
      }
      
      // Reset new transaction form
      setNewTransaction({
        date: format(new Date(), 'yyyy-MM-dd'),
        cleared: false,
        reconciled: false,
      });
      
      setIsAddDialogOpen(false);
      toast.success('Transaction added successfully');
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error('Failed to add transaction');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle updating a transaction
  const handleUpdateTransaction = async () => {
    if (!editingTransaction) return;

    setIsLoading(true);

    try {
      // Find the account name
      const account = accounts.find(a => a.id === editingTransaction.accountId);
      
      // Update account name if it's changed
      const updatedTransaction = {
        ...editingTransaction,
        accountName: account?.name || editingTransaction.accountName,
      };

      // Update in state
      const updatedTransactions = transactions.map(t => 
        t.id === updatedTransaction.id ? updatedTransaction : t
      );
      
      setTransactions(updatedTransactions);
      
      // Save to localStorage
      if (currentWorkspace) {
        localStorage.setItem(`odzai-transactions-${currentWorkspace.id}`, JSON.stringify(updatedTransactions));
      }
      
      setIsEditDialogOpen(false);
      setEditingTransaction(null);
      toast.success('Transaction updated successfully');
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('Failed to update transaction');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting a transaction
  const handleDeleteTransaction = async () => {
    if (!editingTransaction) return;

    setIsLoading(true);

    try {
      // Remove from state
      const updatedTransactions = transactions.filter(t => t.id !== editingTransaction.id);
      setTransactions(updatedTransactions);
      
      // Save to localStorage
      if (currentWorkspace) {
        localStorage.setItem(`odzai-transactions-${currentWorkspace.id}`, JSON.stringify(updatedTransactions));
      }
      
      setIsDeleteDialogOpen(false);
      setEditingTransaction(null);
      toast.success('Transaction deleted successfully');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle transaction cleared status
  const toggleCleared = (transaction: Transaction) => {
    const updatedTransaction = { ...transaction, cleared: !transaction.cleared };
    
    // Update in state
    const updatedTransactions = transactions.map(t => 
      t.id === transaction.id ? updatedTransaction : t
    );
    
    setTransactions(updatedTransactions);
    
    // Save to localStorage
    if (currentWorkspace) {
      localStorage.setItem(`odzai-transactions-${currentWorkspace.id}`, JSON.stringify(updatedTransactions));
    }
    
    toast.success(`Transaction marked as ${updatedTransaction.cleared ? 'cleared' : 'uncleared'}`);
  };
  
  // Calculate summary values
  const calculateSummary = () => {
    const income = filteredTransactions
      .filter(tx => tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const expenses = filteredTransactions
      .filter(tx => tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    
    const net = income - expenses;
    
    return { income, expenses, net };
  };
  
  const summary = calculateSummary();

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setAccountFilter('all');
    setCategoryFilter('all');
    setDateFilter('all');
    setClearedFilter('all');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Transactions</h1>
        <Button 
          className="mt-4 sm:mt-0" 
          onClick={() => setIsAddDialogOpen(true)}
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add Transaction
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Summary</CardTitle>
          <CardDescription>Financial overview for the filtered transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-md">
              <h3 className="text-sm font-medium text-muted-foreground">Income</h3>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.income)}</p>
            </div>
            <div className="p-4 border rounded-md">
              <h3 className="text-sm font-medium text-muted-foreground">Expenses</h3>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(summary.expenses)}</p>
            </div>
            <div className="p-4 border rounded-md">
              <h3 className="text-sm font-medium text-muted-foreground">Net</h3>
              <p className={`text-2xl font-bold ${summary.net >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                {formatCurrency(summary.net)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter and search your transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search payee, category, notes..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="account-filter">Account</Label>
              <Select
                value={accountFilter}
                onValueChange={setAccountFilter}
              >
                <SelectTrigger id="account-filter">
                  <SelectValue placeholder="All Accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="category-filter">Category</Label>
              <Select
                value={categoryFilter}
                onValueChange={setCategoryFilter}
              >
                <SelectTrigger id="category-filter">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="date-filter">Date</Label>
              <Select
                value={dateFilter}
                onValueChange={(value) => setDateFilter(value as any)}
              >
                <SelectTrigger id="date-filter">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                  <SelectItem value="thisYear">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="cleared-filter">Status</Label>
              <Select
                value={clearedFilter}
                onValueChange={(value) => setClearedFilter(value as any)}
              >
                <SelectTrigger id="cleared-filter">
                  <SelectValue placeholder="All Transactions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="cleared">Cleared</SelectItem>
                  <SelectItem value="uncleared">Uncleared</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button variant="outline" onClick={resetFilters}>
                <Filter className="mr-2 h-4 w-4" /> Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>
              {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} found
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" /> Import
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sortedTransactions.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Status</TableHead>
                    <TableHead>
                      <button 
                        className="flex items-center text-left font-medium"
                        onClick={() => handleSort('date')}
                      >
                        Date
                        <ArrowDownUp className={`ml-2 h-4 w-4 ${sortBy === 'date' ? 'opacity-100' : 'opacity-40'}`} />
                      </button>
                    </TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Payee</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>
                      <button 
                        className="flex items-center text-left font-medium"
                        onClick={() => handleSort('amount')}
                      >
                        Amount
                        <ArrowDownUp className={`ml-2 h-4 w-4 ${sortBy === 'amount' ? 'opacity-100' : 'opacity-40'}`} />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleCleared(transaction)}
                          className={
                            transaction.cleared 
                              ? 'text-green-600 hover:text-green-700'
                              : 'text-muted-foreground hover:text-foreground'
                          }
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                      <TableCell>{transaction.accountName}</TableCell>
                      <TableCell className="font-medium">{transaction.payee}</TableCell>
                      <TableCell>{transaction.category}</TableCell>
                      <TableCell className={`font-mono ${transaction.amount < 0 ? 'text-destructive' : 'text-green-600'}`}>
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingTransaction(transaction);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingTransaction(transaction);
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
              {isLoading ? 'Loading transactions...' : 'No transactions found. Add your first transaction to get started.'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Transaction Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Add New Transaction</DialogTitle>
            <DialogDescription>
              Create a new transaction to track your income or expenses.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tx-date" className="text-right">
                Date
              </Label>
              <Input
                id="tx-date"
                type="date"
                value={newTransaction.date}
                onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tx-account" className="text-right">
                Account
              </Label>
              <Select
                value={newTransaction.accountId}
                onValueChange={(value) => setNewTransaction({...newTransaction, accountId: value})}
              >
                <SelectTrigger id="tx-account" className="col-span-3">
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tx-payee" className="text-right">
                Payee
              </Label>
              <Input
                id="tx-payee"
                placeholder="Enter payee name"
                value={newTransaction.payee || ''}
                onChange={(e) => setNewTransaction({...newTransaction, payee: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tx-category" className="text-right">
                Category
              </Label>
              <Select
                value={newTransaction.category}
                onValueChange={(value) => setNewTransaction({...newTransaction, category: value})}
              >
                <SelectTrigger id="tx-category" className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tx-amount" className="text-right">
                Amount
              </Label>
              <Input
                id="tx-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                onChange={(e) => setNewTransaction({
                  ...newTransaction, 
                  amount: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : 0
                })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tx-notes" className="text-right">
                Notes
              </Label>
              <Input
                id="tx-notes"
                placeholder="Optional notes"
                value={newTransaction.notes || ''}
                onChange={(e) => setNewTransaction({...newTransaction, notes: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="text-right">Status</div>
              <div className="flex items-center space-x-4 col-span-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="tx-cleared"
                    checked={newTransaction.cleared}
                    onCheckedChange={(checked) => 
                      setNewTransaction({...newTransaction, cleared: checked as boolean})
                    }
                  />
                  <Label htmlFor="tx-cleared">Cleared</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="tx-reconciled"
                    checked={newTransaction.reconciled}
                    onCheckedChange={(checked) => 
                      setNewTransaction({...newTransaction, reconciled: checked as boolean})
                    }
                  />
                  <Label htmlFor="tx-reconciled">Reconciled</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddTransaction} disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Transaction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>
              Update the transaction details.
            </DialogDescription>
          </DialogHeader>
          {editingTransaction && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-tx-date" className="text-right">
                  Date
                </Label>
                <Input
                  id="edit-tx-date"
                  type="date"
                  value={editingTransaction.date}
                  onChange={(e) => setEditingTransaction({...editingTransaction, date: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-tx-account" className="text-right">
                  Account
                </Label>
                <Select
                  value={editingTransaction.accountId}
                  onValueChange={(value) => {
                    const account = accounts.find(a => a.id === value);
                    setEditingTransaction({
                      ...editingTransaction, 
                      accountId: value,
                      accountName: account ? account.name : editingTransaction.accountName
                    });
                  }}
                >
                  <SelectTrigger id="edit-tx-account" className="col-span-3">
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
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-tx-payee" className="text-right">
                  Payee
                </Label>
                <Input
                  id="edit-tx-payee"
                  value={editingTransaction.payee}
                  onChange={(e) => setEditingTransaction({...editingTransaction, payee: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-tx-category" className="text-right">
                  Category
                </Label>
                <Select
                  value={editingTransaction.category}
                  onValueChange={(value) => setEditingTransaction({...editingTransaction, category: value})}
                >
                  <SelectTrigger id="edit-tx-category" className="col-span-3">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-tx-amount" className="text-right">
                  Amount
                </Label>
                <Input
                  id="edit-tx-amount"
                  type="number"
                  step="0.01"
                  value={(editingTransaction.amount / 100).toFixed(2)}
                  onChange={(e) => setEditingTransaction({
                    ...editingTransaction, 
                    amount: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : 0
                  })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-tx-notes" className="text-right">
                  Notes
                </Label>
                <Input
                  id="edit-tx-notes"
                  value={editingTransaction.notes || ''}
                  onChange={(e) => setEditingTransaction({...editingTransaction, notes: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-right">Status</div>
                <div className="flex items-center space-x-4 col-span-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="edit-tx-cleared"
                      checked={editingTransaction.cleared}
                      onCheckedChange={(checked) => 
                        setEditingTransaction({...editingTransaction, cleared: checked as boolean})
                      }
                    />
                    <Label htmlFor="edit-tx-cleared">Cleared</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="edit-tx-reconciled"
                      checked={editingTransaction.reconciled}
                      onCheckedChange={(checked) => 
                        setEditingTransaction({...editingTransaction, reconciled: checked as boolean})
                      }
                    />
                    <Label htmlFor="edit-tx-reconciled">Reconciled</Label>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateTransaction} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Transaction Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {editingTransaction && (
            <div className="py-4">
              <p><span className="font-medium">Date:</span> {new Date(editingTransaction.date).toLocaleDateString()}</p>
              <p><span className="font-medium">Payee:</span> {editingTransaction.payee}</p>
              <p><span className="font-medium">Amount:</span> <span className={editingTransaction.amount < 0 ? 'text-destructive' : 'text-green-600'}>{formatCurrency(editingTransaction.amount)}</span></p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteTransaction} disabled={isLoading}>
              {isLoading ? 'Deleting...' : 'Delete Transaction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 