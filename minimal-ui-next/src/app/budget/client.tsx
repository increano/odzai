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
  BarChart4,
  ChevronLeft,
  ChevronRight,
  Info,
  AlertTriangle,
  Check,
  MoreHorizontal,
  ArrowRight,
  DollarSign
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Types
interface CategoryGroup {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  groupId: string;
  sort_order: number;
  hidden?: boolean;
}

interface BudgetItem {
  categoryId: string;
  month: string;
  budgeted: number;
  activity: number;
  available: number;
}

interface BudgetMonth {
  month: string;
  toBeBudgeted: number;
  income: number;
  budgeted: number;
  spent: number;
}

export default function BudgetClient() {
  // Get current month and year
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-11
  const currentYear = now.getFullYear();
  
  // State
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [displayMonth, setDisplayMonth] = useState<Date>(now);
  const [budgetMonths, setBudgetMonths] = useState<BudgetMonth[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount / 100);
  };
  
  // Format month
  const formatMonth = (date: Date): string => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };
  
  // Get month key (YYYY-MM)
  const getMonthKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };
  
  // Navigate to previous month
  const goToPreviousMonth = () => {
    const newDate = new Date(displayMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setDisplayMonth(newDate);
  };
  
  // Navigate to next month
  const goToNextMonth = () => {
    const newDate = new Date(displayMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setDisplayMonth(newDate);
  };
  
  // Navigate to current month
  const goToCurrentMonth = () => {
    setDisplayMonth(new Date());
  };

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Mock category groups
        const mockCategoryGroups: CategoryGroup[] = [
          { id: 'group1', name: 'Immediate Obligations' },
          { id: 'group2', name: 'True Expenses' },
          { id: 'group3', name: 'Quality of Life' },
          { id: 'group4', name: 'Savings Goals' },
          { id: 'group5', name: 'Income' },
        ];
        
        // Mock categories
        const mockCategories: Category[] = [
          // Immediate Obligations
          { id: 'cat1', name: 'Rent/Mortgage', groupId: 'group1', sort_order: 1 },
          { id: 'cat2', name: 'Electricity', groupId: 'group1', sort_order: 2 },
          { id: 'cat3', name: 'Water', groupId: 'group1', sort_order: 3 },
          { id: 'cat4', name: 'Internet', groupId: 'group1', sort_order: 4 },
          { id: 'cat5', name: 'Groceries', groupId: 'group1', sort_order: 5 },
          
          // True Expenses
          { id: 'cat6', name: 'Auto Maintenance', groupId: 'group2', sort_order: 1 },
          { id: 'cat7', name: 'Home Maintenance', groupId: 'group2', sort_order: 2 },
          { id: 'cat8', name: 'Medical', groupId: 'group2', sort_order: 3 },
          { id: 'cat9', name: 'Clothing', groupId: 'group2', sort_order: 4 },
          
          // Quality of Life
          { id: 'cat10', name: 'Dining Out', groupId: 'group3', sort_order: 1 },
          { id: 'cat11', name: 'Entertainment', groupId: 'group3', sort_order: 2 },
          { id: 'cat12', name: 'Subscriptions', groupId: 'group3', sort_order: 3 },
          
          // Savings Goals
          { id: 'cat13', name: 'Emergency Fund', groupId: 'group4', sort_order: 1 },
          { id: 'cat14', name: 'Vacation', groupId: 'group4', sort_order: 2 },
          { id: 'cat15', name: 'New Car', groupId: 'group4', sort_order: 3 },
          
          // Income
          { id: 'cat16', name: 'Salary', groupId: 'group5', sort_order: 1 },
          { id: 'cat17', name: 'Bonus', groupId: 'group5', sort_order: 2 },
          { id: 'cat18', name: 'Interest', groupId: 'group5', sort_order: 3 },
        ];
        
        // Generate budget months (for the last 3 months and next 3 months)
        const mockBudgetMonths: BudgetMonth[] = [];
        for (let i = -3; i <= 3; i++) {
          const monthDate = new Date(currentYear, currentMonth + i, 1);
          const month = getMonthKey(monthDate);
          
          // Random values for demonstration
          const income = Math.round(500000 + Math.random() * 100000);
          const budgeted = Math.round(300000 + Math.random() * 150000);
          const spent = Math.round(250000 + Math.random() * 150000);
          
          mockBudgetMonths.push({
            month,
            toBeBudgeted: income - budgeted,
            income,
            budgeted,
            spent,
          });
        }
        
        // Generate budget items for each category and month
        const mockBudgetItems: BudgetItem[] = [];
        mockCategories.forEach(category => {
          mockBudgetMonths.forEach(budgetMonth => {
            // Skip income categories for budget items
            if (category.groupId === 'group5') return;
            
            // Generate random values
            const budgeted = category.groupId === 'group1' 
              ? Math.round(50000 + Math.random() * 70000) 
              : Math.round(10000 + Math.random() * 40000);
            
            const activity = -Math.round(budgeted * (0.5 + Math.random() * 0.5));
            const available = budgeted + activity;
            
            mockBudgetItems.push({
              categoryId: category.id,
              month: budgetMonth.month,
              budgeted,
              activity,
              available,
            });
          });
        });
        
        setCategoryGroups(mockCategoryGroups);
        setCategories(mockCategories);
        setBudgetMonths(mockBudgetMonths);
        setBudgetItems(mockBudgetItems);
      } catch (error) {
        console.error('Error fetching budget data:', error);
        toast.error('Failed to load budget data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [currentMonth, currentYear]);
  
  // Get current month data
  const currentMonthKey = getMonthKey(displayMonth);
  const currentMonthData = budgetMonths.find(m => m.month === currentMonthKey) || {
    month: currentMonthKey,
    toBeBudgeted: 0,
    income: 0,
    budgeted: 0,
    spent: 0
  };
  
  // Update budget amount
  const updateBudgetAmount = (categoryId: string, newAmount: number) => {
    // Find the budget item
    const itemIndex = budgetItems.findIndex(
      item => item.categoryId === categoryId && item.month === currentMonthKey
    );
    
    if (itemIndex === -1) return;
    
    const item = budgetItems[itemIndex];
    const difference = newAmount - item.budgeted;
    
    // Update the budget item
    const updatedItems = [...budgetItems];
    updatedItems[itemIndex] = {
      ...item,
      budgeted: newAmount,
      available: item.available + difference
    };
    
    // Update to be budgeted
    const updatedMonths = budgetMonths.map(month => {
      if (month.month === currentMonthKey) {
        return {
          ...month,
          toBeBudgeted: month.toBeBudgeted - difference,
          budgeted: month.budgeted + difference
        };
      }
      return month;
    });
    
    setBudgetItems(updatedItems);
    setBudgetMonths(updatedMonths);
    
    toast.success(`Updated budget amount for category`);
  };
  
  // Get budget item for a category
  const getBudgetItem = (categoryId: string): BudgetItem | undefined => {
    return budgetItems.find(
      item => item.categoryId === categoryId && item.month === currentMonthKey
    );
  };
  
  // Quick budget options
  const quickBudget = (categoryId: string, option: 'zero' | 'previous' | 'average' | 'spent') => {
    let newAmount = 0;
    
    if (option === 'zero') {
      newAmount = 0;
    } else {
      // Implementation for other quick budget options would go here
      // This is simplified for demonstration
      newAmount = 25000; // Example value
    }
    
    updateBudgetAmount(categoryId, newAmount);
  };
  
  // Group categories by their group
  const categoriesByGroup = categoryGroups.map(group => {
    const groupCategories = categories
      .filter(category => category.groupId === group.id && !category.hidden)
      .sort((a, b) => a.sort_order - b.sort_order);
    
    return {
      group,
      categories: groupCategories
    };
  });
  
  // Calculate group totals
  const getGroupTotals = (groupId: string) => {
    const groupCategoryIds = categories
      .filter(cat => cat.groupId === groupId)
      .map(cat => cat.id);
    
    return budgetItems
      .filter(item => 
        groupCategoryIds.includes(item.categoryId) && 
        item.month === currentMonthKey
      )
      .reduce(
        (acc, item) => ({
          budgeted: acc.budgeted + item.budgeted,
          activity: acc.activity + item.activity,
          available: acc.available + item.available
        }),
        { budgeted: 0, activity: 0, available: 0 }
      );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold">Budget</h1>
        
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <Button variant="outline" size="sm" onClick={goToCurrentMonth}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{formatMonth(displayMonth)}</CardTitle>
            <CardDescription>Monthly budget allocation</CardDescription>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Income</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(currentMonthData.income)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Budgeted</p>
              <p className="text-xl font-bold">
                {formatCurrency(currentMonthData.budgeted)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Spent</p>
              <p className="text-xl font-bold text-destructive">
                {formatCurrency(Math.abs(currentMonthData.spent))}
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="rounded-md border p-4 mb-6 flex flex-col sm:flex-row justify-between items-center bg-muted/30">
            <div>
              <h3 className="text-lg font-semibold mb-1">To Be Budgeted</h3>
              <p className="text-sm text-muted-foreground">
                Amount left to assign to categories
              </p>
            </div>
            <div className={`text-3xl font-bold mt-2 sm:mt-0 ${currentMonthData.toBeBudgeted >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {formatCurrency(currentMonthData.toBeBudgeted)}
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Category</TableHead>
                  <TableHead>Budgeted</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoriesByGroup.map(({ group, categories }) => (
                  <React.Fragment key={group.id}>
                    {group.id !== 'group5' && ( // Skip income groups
                      <>
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={5} className="py-2">
                            <h3 className="font-semibold">{group.name}</h3>
                          </TableCell>
                        </TableRow>
                        
                        {categories.map(category => {
                          const budgetItem = getBudgetItem(category.id);
                          const budgeted = budgetItem?.budgeted || 0;
                          const activity = budgetItem?.activity || 0;
                          const available = budgetItem?.available || 0;
                          
                          return (
                            <TableRow key={category.id}>
                              <TableCell className="font-medium">
                                {category.name}
                              </TableCell>
                              <TableCell>
                                <div className="relative">
                                  <DollarSign className="h-4 w-4 absolute left-2 top-2 text-muted-foreground" />
                                  <Input
                                    type="number"
                                    step="0.01"
                                    className="pl-7"
                                    value={(budgeted / 100).toFixed(2)}
                                    onChange={(e) => {
                                      const value = e.target.value ? parseFloat(e.target.value) : 0;
                                      updateBudgetAmount(category.id, Math.round(value * 100));
                                    }}
                                  />
                                </div>
                              </TableCell>
                              <TableCell className={activity < 0 ? 'text-destructive' : ''}>
                                {formatCurrency(activity)}
                              </TableCell>
                              <TableCell 
                                className={
                                  available > 0 ? 'text-green-600' : 
                                  available < 0 ? 'text-destructive' : ''
                                }
                              >
                                {formatCurrency(available)}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Quick Budget</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => quickBudget(category.id, 'zero')}>
                                      Set to Zero
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => quickBudget(category.id, 'previous')}>
                                      Copy Previous Month
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => quickBudget(category.id, 'average')}>
                                      Average of 3 Months
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => quickBudget(category.id, 'spent')}>
                                      Match Spent Amount
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        
                        {/* Group totals */}
                        {categories.length > 0 && (
                          <TableRow className="border-t-2">
                            <TableCell className="font-semibold text-muted-foreground">
                              {group.name} Total
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency(getGroupTotals(group.id).budgeted)}
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency(getGroupTotals(group.id).activity)}
                            </TableCell>
                            <TableCell 
                              className={`font-semibold ${
                                getGroupTotals(group.id).available > 0 ? 'text-green-600' : 
                                getGroupTotals(group.id).available < 0 ? 'text-destructive' : ''
                              }`}
                            >
                              {formatCurrency(getGroupTotals(group.id).available)}
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        )}
                      </>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm">
                  <Info className="h-4 w-4 mr-2" /> Budget Tips
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p>Give every dollar a job by assigning all of your available money to categories until "To Be Budgeted" reaches zero.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <div>
            <Button variant="outline" size="sm" className="mr-2">
              <BarChart4 className="h-4 w-4 mr-2" /> View Reports
            </Button>
            <Button size="sm" disabled={currentMonthData.toBeBudgeted < 0}>
              {currentMonthData.toBeBudgeted === 0 ? (
                <>
                  <Check className="h-4 w-4 mr-2" /> Fully Budgeted
                </>
              ) : currentMonthData.toBeBudgeted > 0 ? (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" /> Finish Budgeting
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" /> Overbudgeted
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 