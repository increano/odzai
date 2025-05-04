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
  Pencil,
  Trash2,
  Calendar,
  Repeat,
  CreditCard,
  Play,
  Clock,
  ArrowRight,
  AlertCircle
} from "lucide-react";

// Types
interface Account {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  group: string;
}

interface Schedule {
  id: string;
  title: string;
  description?: string;
  amount: number;
  rule: {
    frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    start: string;
    end?: string;
    day?: number; // day of week (0-6) or day of month
    month?: number; // month for yearly (0-11)
  };
  account_id: string;
  category_id: string;
  payee: string;
  next_date: string;
  last_created?: string;
  completed?: boolean;
  paused?: boolean;
}

export default function SchedulesClient() {
  // State
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Edit/add states
  const [newSchedule, setNewSchedule] = useState<Partial<Schedule>>({
    rule: {
      frequency: 'monthly',
      interval: 1,
      start: new Date().toISOString().split('T')[0]
    }
  });
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };
  
  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Load data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Mock accounts data
        const mockAccounts: Account[] = [
          { id: 'acct1', name: 'Checking Account' },
          { id: 'acct2', name: 'Savings Account' },
          { id: 'acct3', name: 'Credit Card' },
        ];
        
        // Mock categories data
        const mockCategories: Category[] = [
          { id: 'cat1', name: 'Rent', group: 'Housing' },
          { id: 'cat2', name: 'Electricity', group: 'Utilities' },
          { id: 'cat3', name: 'Groceries', group: 'Food' },
          { id: 'cat4', name: 'Internet', group: 'Utilities' },
          { id: 'cat5', name: 'Salary', group: 'Income' },
          { id: 'cat6', name: 'Subscription', group: 'Entertainment' },
        ];
        
        // Mock schedules data
        const mockSchedules: Schedule[] = [
          {
            id: 'sched1',
            title: 'Rent Payment',
            description: 'Monthly rent payment',
            amount: -150000,
            rule: {
              frequency: 'monthly',
              interval: 1,
              start: '2023-01-01',
              day: 1 // 1st of the month
            },
            account_id: 'acct1',
            category_id: 'cat1',
            payee: 'Landlord',
            next_date: '2023-05-01',
            last_created: '2023-04-01'
          },
          {
            id: 'sched2',
            title: 'Salary Deposit',
            amount: 300000,
            rule: {
              frequency: 'monthly',
              interval: 1,
              start: '2023-01-15',
              day: 15 // 15th of the month
            },
            account_id: 'acct1',
            category_id: 'cat5',
            payee: 'Employer Inc.',
            next_date: '2023-05-15',
            last_created: '2023-04-15'
          },
          {
            id: 'sched3',
            title: 'Netflix Subscription',
            amount: -1499,
            rule: {
              frequency: 'monthly',
              interval: 1,
              start: '2023-01-20'
            },
            account_id: 'acct3',
            category_id: 'cat6',
            payee: 'Netflix',
            next_date: '2023-05-20',
            last_created: '2023-04-20'
          },
          {
            id: 'sched4',
            title: 'Electricity Bill',
            amount: -8500,
            rule: {
              frequency: 'monthly',
              interval: 1,
              start: '2023-01-10'
            },
            account_id: 'acct1',
            category_id: 'cat2',
            payee: 'Electric Company',
            next_date: '2023-05-10',
            last_created: '2023-04-10'
          },
          {
            id: 'sched5',
            title: 'Annual Insurance Payment',
            amount: -120000,
            rule: {
              frequency: 'yearly',
              interval: 1,
              start: '2023-03-15'
            },
            account_id: 'acct1',
            category_id: 'cat3',
            payee: 'Insurance Company',
            next_date: '2024-03-15',
            last_created: '2023-03-15'
          },
          {
            id: 'sched6',
            title: 'Weekly Grocery Shopping',
            amount: -10000,
            rule: {
              frequency: 'weekly',
              interval: 1,
              start: '2023-01-07',
              day: 6 // Saturday
            },
            account_id: 'acct1',
            category_id: 'cat3',
            payee: 'Grocery Store',
            next_date: '2023-05-06',
            last_created: '2023-04-29',
            paused: true
          }
        ];
        
        setAccounts(mockAccounts);
        setCategories(mockCategories);
        setSchedules(mockSchedules);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load schedule data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Describe schedule frequency
  const describeFrequency = (schedule: Schedule): string => {
    const { rule } = schedule;
    
    switch (rule.frequency) {
      case 'once':
        return 'One time';
      case 'daily':
        return rule.interval === 1 
          ? 'Every day' 
          : `Every ${rule.interval} days`;
      case 'weekly':
        return rule.interval === 1 
          ? 'Weekly' 
          : `Every ${rule.interval} weeks`;
      case 'monthly':
        return rule.interval === 1 
          ? 'Monthly' 
          : `Every ${rule.interval} months`;
      case 'yearly':
        return rule.interval === 1 
          ? 'Yearly' 
          : `Every ${rule.interval} years`;
      default:
        return 'Custom schedule';
    }
  };
  
  // Get day name for day of week
  const getDayName = (day: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };
  
  // Get status label and color
  const getStatusInfo = (schedule: Schedule) => {
    if (schedule.completed) {
      return { label: 'Completed', class: 'bg-green-100 text-green-800' };
    }
    if (schedule.paused) {
      return { label: 'Paused', class: 'bg-amber-100 text-amber-800' };
    }
    
    // Check if next date is upcoming
    const nextDate = new Date(schedule.next_date);
    const today = new Date();
    const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil <= 0) {
      return { label: 'Due today', class: 'bg-red-100 text-red-800' };
    }
    if (daysUntil <= 7) {
      return { label: `Due in ${daysUntil} days`, class: 'bg-blue-100 text-blue-800' };
    }
    
    return { label: 'Scheduled', class: 'bg-gray-100 text-gray-800' };
  };
  
  // Add new schedule
  const handleAddSchedule = async () => {
    if (!newSchedule.title || !newSchedule.account_id || !newSchedule.amount) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Calculate next date based on schedule rule
      const startDate = new Date(newSchedule.rule?.start || '');
      // In a real app, you would calculate the actual next occurrence based on the rule
      // This is a simplified version
      const nextDate = startDate;
      
      const createdSchedule: Schedule = {
        id: `sched${Date.now()}`,
        title: newSchedule.title || '',
        description: newSchedule.description,
        amount: newSchedule.amount || 0,
        rule: newSchedule.rule as Schedule['rule'],
        account_id: newSchedule.account_id || '',
        category_id: newSchedule.category_id || '',
        payee: newSchedule.payee || '',
        next_date: nextDate.toISOString().split('T')[0]
      };
      
      setSchedules(prev => [...prev, createdSchedule]);
      setNewSchedule({
        rule: {
          frequency: 'monthly',
          interval: 1,
          start: new Date().toISOString().split('T')[0]
        }
      });
      setIsAddDialogOpen(false);
      toast.success('Schedule created successfully');
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast.error('Failed to create schedule');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update schedule
  const handleUpdateSchedule = async () => {
    if (!editingSchedule) return;
    
    setIsLoading(true);
    
    try {
      setSchedules(prev => 
        prev.map(schedule => 
          schedule.id === editingSchedule.id ? editingSchedule : schedule
        )
      );
      
      setIsEditDialogOpen(false);
      toast.success('Schedule updated successfully');
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error('Failed to update schedule');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete schedule
  const handleDeleteSchedule = async () => {
    if (!editingSchedule) return;
    
    setIsLoading(true);
    
    try {
      setSchedules(prev => 
        prev.filter(schedule => schedule.id !== editingSchedule.id)
      );
      
      setIsDeleteDialogOpen(false);
      toast.success('Schedule deleted successfully');
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete schedule');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Run schedule now
  const handleRunNow = (scheduleId: string) => {
    toast.success('Transaction created from schedule');
    // In a real app, this would create a transaction and update the schedule's last_created date
  };
  
  // Toggle schedule paused status
  const handleTogglePaused = (scheduleId: string) => {
    setSchedules(prev => 
      prev.map(schedule => 
        schedule.id === scheduleId ? 
          { ...schedule, paused: !schedule.paused } : 
          schedule
      )
    );
    
    const schedule = schedules.find(s => s.id === scheduleId);
    if (schedule) {
      toast.success(`Schedule ${schedule.paused ? 'resumed' : 'paused'}`);
    }
  };
  
  // Get account and category names
  const getAccountName = (accountId: string): string => {
    return accounts.find(account => account.id === accountId)?.name || '';
  };
  
  const getCategoryName = (categoryId: string): string => {
    return categories.find(category => category.id === categoryId)?.name || '';
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Scheduled Transactions</h1>
        <Button 
          className="mt-4 sm:mt-0" 
          onClick={() => setIsAddDialogOpen(true)}
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add Schedule
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recurring Transactions</CardTitle>
          <CardDescription>
            Set up automatic transactions that repeat on a schedule
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-10 text-muted-foreground">
              Loading schedules...
            </div>
          ) : schedules.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Next Date</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map(schedule => {
                    const statusInfo = getStatusInfo(schedule);
                    
                    return (
                      <TableRow key={schedule.id}>
                        <TableCell className="font-medium">
                          <div>
                            {schedule.title}
                            {schedule.description && (
                              <p className="text-xs text-muted-foreground">{schedule.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                            {formatDate(schedule.next_date)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Repeat className="mr-2 h-4 w-4 text-muted-foreground" />
                            {describeFrequency(schedule)}
                          </div>
                        </TableCell>
                        <TableCell className={`font-mono ${schedule.amount < 0 ? 'text-destructive' : 'text-green-600'}`}>
                          {formatCurrency(schedule.amount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <CreditCard className="mr-2 h-4 w-4 text-muted-foreground" />
                            {getAccountName(schedule.account_id)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${statusInfo.class}`}>
                            {statusInfo.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {!schedule.completed && !schedule.paused && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRunNow(schedule.id)}
                              title="Run now"
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleTogglePaused(schedule.id)}
                            title={schedule.paused ? "Resume schedule" : "Pause schedule"}
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingSchedule(schedule);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingSchedule(schedule);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              No scheduled transactions found. Add a schedule to get started.
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row sm:justify-between">
          <div className="flex items-center text-sm text-muted-foreground mb-4 sm:mb-0">
            <AlertCircle className="h-4 w-4 mr-2" />
            Scheduled transactions will be created automatically based on their frequency.
          </div>
          <Button variant="outline" size="sm" onClick={() => {}}>
            View Transaction History <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
      
      {/* Add Schedule Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add Scheduled Transaction</DialogTitle>
            <DialogDescription>
              Create a new transaction that will repeat on a schedule.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g., Rent Payment, Netflix Subscription"
                value={newSchedule.title || ''}
                onChange={(e) => setNewSchedule({...newSchedule, title: e.target.value})}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="Any additional details"
                value={newSchedule.description || ''}
                onChange={(e) => setNewSchedule({...newSchedule, description: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  onChange={(e) => setNewSchedule({
                    ...newSchedule, 
                    amount: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : 0
                  })}
                />
                <p className="text-xs text-muted-foreground">Use negative for expenses</p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="account">Account</Label>
                <Select
                  value={newSchedule.account_id}
                  onValueChange={(value) => setNewSchedule({...newSchedule, account_id: value})}
                >
                  <SelectTrigger id="account">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="payee">Payee</Label>
                <Input
                  id="payee"
                  placeholder="Who you're paying or receiving from"
                  value={newSchedule.payee || ''}
                  onChange={(e) => setNewSchedule({...newSchedule, payee: e.target.value})}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newSchedule.category_id}
                  onValueChange={(value) => setNewSchedule({...newSchedule, category_id: value})}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={newSchedule.rule?.frequency}
                  onValueChange={(value) => setNewSchedule({
                    ...newSchedule, 
                    rule: {...(newSchedule.rule || {}), frequency: value as Schedule['rule']['frequency']}
                  })}
                >
                  <SelectTrigger id="frequency">
                    <SelectValue placeholder="How often" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">One time only</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="interval">Every</Label>
                <div className="flex items-center">
                  <Input
                    id="interval"
                    type="number"
                    min="1"
                    className="w-20"
                    value={newSchedule.rule?.interval || 1}
                    onChange={(e) => setNewSchedule({
                      ...newSchedule, 
                      rule: {
                        ...newSchedule.rule as any, 
                        interval: parseInt(e.target.value) || 1
                      }
                    })}
                  />
                  <span className="ml-2">
                    {newSchedule.rule?.frequency === 'daily' && 'days'}
                    {newSchedule.rule?.frequency === 'weekly' && 'weeks'}
                    {newSchedule.rule?.frequency === 'monthly' && 'months'}
                    {newSchedule.rule?.frequency === 'yearly' && 'years'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={newSchedule.rule?.start || ''}
                  onChange={(e) => setNewSchedule({
                    ...newSchedule, 
                    rule: {...(newSchedule.rule || {}), start: e.target.value}
                  })}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="end-date">End Date (Optional)</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={newSchedule.rule?.end || ''}
                  onChange={(e) => setNewSchedule({
                    ...newSchedule, 
                    rule: {...(newSchedule.rule || {}), end: e.target.value}
                  })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSchedule} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Schedule Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Scheduled Transaction</DialogTitle>
            <DialogDescription>
              Modify the recurring transaction details.
            </DialogDescription>
          </DialogHeader>
          {editingSchedule && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingSchedule.title}
                  onChange={(e) => setEditingSchedule({...editingSchedule, title: e.target.value})}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description (Optional)</Label>
                <Input
                  id="edit-description"
                  value={editingSchedule.description || ''}
                  onChange={(e) => setEditingSchedule({...editingSchedule, description: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-amount">Amount</Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    value={(editingSchedule.amount / 100).toFixed(2)}
                    onChange={(e) => setEditingSchedule({
                      ...editingSchedule, 
                      amount: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : 0
                    })}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="edit-account">Account</Label>
                  <Select
                    value={editingSchedule.account_id}
                    onValueChange={(value) => setEditingSchedule({...editingSchedule, account_id: value})}
                  >
                    <SelectTrigger id="edit-account">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(account => (
                        <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-payee">Payee</Label>
                  <Input
                    id="edit-payee"
                    value={editingSchedule.payee}
                    onChange={(e) => setEditingSchedule({...editingSchedule, payee: e.target.value})}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select
                    value={editingSchedule.category_id}
                    onValueChange={(value) => setEditingSchedule({...editingSchedule, category_id: value})}
                  >
                    <SelectTrigger id="edit-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-frequency">Frequency</Label>
                  <Select
                    value={editingSchedule.rule.frequency}
                    onValueChange={(value) => setEditingSchedule({
                      ...editingSchedule, 
                      rule: {...editingSchedule.rule, frequency: value as Schedule['rule']['frequency']}
                    })}
                  >
                    <SelectTrigger id="edit-frequency">
                      <SelectValue placeholder="How often" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">One time only</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="edit-interval">Every</Label>
                  <div className="flex items-center">
                    <Input
                      id="edit-interval"
                      type="number"
                      min="1"
                      className="w-20"
                      value={editingSchedule.rule.interval}
                      onChange={(e) => setEditingSchedule({
                        ...editingSchedule, 
                        rule: {
                          ...editingSchedule.rule, 
                          interval: parseInt(e.target.value) || 1
                        }
                      })}
                    />
                    <span className="ml-2">
                      {editingSchedule.rule.frequency === 'daily' && 'days'}
                      {editingSchedule.rule.frequency === 'weekly' && 'weeks'}
                      {editingSchedule.rule.frequency === 'monthly' && 'months'}
                      {editingSchedule.rule.frequency === 'yearly' && 'years'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-start-date">Start Date</Label>
                  <Input
                    id="edit-start-date"
                    type="date"
                    value={editingSchedule.rule.start}
                    onChange={(e) => setEditingSchedule({
                      ...editingSchedule, 
                      rule: {...editingSchedule.rule, start: e.target.value}
                    })}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="edit-end-date">End Date (Optional)</Label>
                  <Input
                    id="edit-end-date"
                    type="date"
                    value={editingSchedule.rule.end || ''}
                    onChange={(e) => setEditingSchedule({
                      ...editingSchedule, 
                      rule: {...editingSchedule.rule, end: e.target.value}
                    })}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="edit-paused"
                  checked={editingSchedule.paused}
                  onCheckedChange={(checked) => 
                    setEditingSchedule({...editingSchedule, paused: !!checked})
                  }
                />
                <Label htmlFor="edit-paused">Pause this schedule</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateSchedule} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Schedule Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Schedule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this scheduled transaction? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {editingSchedule && (
            <div className="py-4">
              <p className="font-medium">{editingSchedule.title}</p>
              <p className="text-sm text-muted-foreground">
                {describeFrequency(editingSchedule)} • Next date: {formatDate(editingSchedule.next_date)}
              </p>
              <p className={`text-sm ${editingSchedule.amount < 0 ? 'text-destructive' : 'text-green-600'}`}>
                {formatCurrency(editingSchedule.amount)}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteSchedule} disabled={isLoading}>
              {isLoading ? 'Deleting...' : 'Delete Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 