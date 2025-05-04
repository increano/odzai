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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  BarChart3,
  PieChart,
  LineChart,
  Calendar,
  Download,
  Filter,
  ArrowRight,
  PlusCircle,
  Share2,
  Printer
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data for reports
interface MonthlySummary {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
  transactions: number;
}

interface AccountBalance {
  account: string;
  balance: number;
  trend: number; // percentage change
}

interface IncomeVsExpense {
  month: string;
  income: number;
  expenses: number;
}

export default function ReportsClient() {
  // State for report data
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary[]>([]);
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
  const [accountBalances, setAccountBalances] = useState<AccountBalance[]>([]);
  const [incomeVsExpenses, setIncomeVsExpenses] = useState<IncomeVsExpense[]>([]);
  
  // State for time period
  const [timePeriod, setTimePeriod] = useState<string>('thisMonth');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };
  
  // Format percentage
  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };
  
  // Format month
  const formatMonth = (monthStr: string): string => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };
  
  // Load report data based on selected time period
  useEffect(() => {
    const fetchReportData = async () => {
      setIsLoading(true);
      
      try {
        // In a real app, this would fetch from API based on selected time period
        // Using mock data for demonstration
        
        // Monthly summary data (last 6 months)
        const mockMonthlySummary: MonthlySummary[] = [
          { month: '2023-11', income: 520000, expenses: 385000, net: 135000 },
          { month: '2023-12', income: 530000, expenses: 420000, net: 110000 },
          { month: '2024-01', income: 515000, expenses: 390000, net: 125000 },
          { month: '2024-02', income: 525000, expenses: 380000, net: 145000 },
          { month: '2024-03', income: 545000, expenses: 410000, net: 135000 },
          { month: '2024-04', income: 535000, expenses: 395000, net: 140000 },
        ];
        
        // Category spending data
        const mockCategorySpending: CategorySpending[] = [
          { category: 'Housing', amount: 120000, percentage: 0.30, transactions: 3 },
          { category: 'Food', amount: 80000, percentage: 0.20, transactions: 15 },
          { category: 'Transportation', amount: 60000, percentage: 0.15, transactions: 8 },
          { category: 'Utilities', amount: 40000, percentage: 0.10, transactions: 5 },
          { category: 'Entertainment', amount: 30000, percentage: 0.08, transactions: 7 },
          { category: 'Health', amount: 25000, percentage: 0.06, transactions: 3 },
          { category: 'Other', amount: 40000, percentage: 0.11, transactions: 10 },
        ];
        
        // Account balance data
        const mockAccountBalances: AccountBalance[] = [
          { account: 'Checking Account', balance: 350000, trend: 0.05 },
          { account: 'Savings Account', balance: 1200000, trend: 0.02 },
          { account: 'Investment Account', balance: 750000, trend: 0.08 },
          { account: 'Credit Card', balance: -45000, trend: -0.10 },
        ];
        
        // Income vs expenses data (last 6 months)
        const mockIncomeVsExpenses: IncomeVsExpense[] = [
          { month: '2023-11', income: 520000, expenses: 385000 },
          { month: '2023-12', income: 530000, expenses: 420000 },
          { month: '2024-01', income: 515000, expenses: 390000 },
          { month: '2024-02', income: 525000, expenses: 380000 },
          { month: '2024-03', income: 545000, expenses: 410000 },
          { month: '2024-04', income: 535000, expenses: 395000 },
        ];
        
        setMonthlySummary(mockMonthlySummary);
        setCategorySpending(mockCategorySpending);
        setAccountBalances(mockAccountBalances);
        setIncomeVsExpenses(mockIncomeVsExpenses);
      } catch (error) {
        console.error('Error loading report data:', error);
        toast.error('Failed to load report data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReportData();
  }, [timePeriod]);
  
  // Calculate total expenses for the selected period
  const totalExpenses = categorySpending.reduce((sum, category) => sum + category.amount, 0);
  
  // Calculate total net for monthly summary
  const totalNet = monthlySummary.reduce((sum, month) => sum + month.net, 0);
  
  // Determine trend
  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <span className="text-green-600">↑</span>;
    if (trend < 0) return <span className="text-destructive">↓</span>;
    return <span className="text-muted-foreground">→</span>;
  };
  
  // Export report
  const handleExport = (format: 'pdf' | 'csv') => {
    toast.success(`Report exported as ${format.toUpperCase()}`);
    // In a real app, this would trigger a download
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Reports</h1>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Select
            value={timePeriod}
            onValueChange={setTimePeriod}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="last3Months">Last 3 Months</SelectItem>
              <SelectItem value="last6Months">Last 6 Months</SelectItem>
              <SelectItem value="thisYear">This Year</SelectItem>
              <SelectItem value="lastYear">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Calendar className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(incomeVsExpenses.reduce((sum, month) => sum + month.income, 0))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {incomeVsExpenses.length} months
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {categorySpending.reduce((sum, cat) => sum + cat.transactions, 0)} transactions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Net Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalNet >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {formatCurrency(totalNet)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalNet >= 0 ? 'Positive savings trend' : 'Negative savings trend'}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Report Tabs */}
      <Tabs defaultValue="spending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="spending">
            <PieChart className="h-4 w-4 mr-2" />
            Spending
          </TabsTrigger>
          <TabsTrigger value="income-expense">
            <BarChart3 className="h-4 w-4 mr-2" />
            Income vs. Expense
          </TabsTrigger>
          <TabsTrigger value="trends">
            <LineChart className="h-4 w-4 mr-2" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="net-worth">
            <BarChart3 className="h-4 w-4 mr-2" />
            Net Worth
          </TabsTrigger>
        </TabsList>
        
        {/* Spending Tab */}
        <TabsContent value="spending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
              <CardDescription>
                Where your money is going this period
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-10 text-muted-foreground">
                  Loading spending data...
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>% of Total</TableHead>
                        <TableHead># Transactions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categorySpending.map((category) => (
                        <TableRow key={category.category}>
                          <TableCell className="font-medium">{category.category}</TableCell>
                          <TableCell>{formatCurrency(category.amount)}</TableCell>
                          <TableCell>{formatPercentage(category.percentage)}</TableCell>
                          <TableCell>{category.transactions}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <div className="w-full flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Total: {formatCurrency(totalExpenses)}
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
                    <Printer className="mr-2 h-4 w-4" /> Print
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
          
          {/* Placeholder for spending chart */}
          <Card className="h-[300px] flex items-center justify-center">
            <div className="text-center">
              <PieChart className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Spending Distribution Chart<br />
                <span className="text-xs">(Visualization would render here)</span>
              </p>
            </div>
          </Card>
        </TabsContent>
        
        {/* Income vs. Expense Tab */}
        <TabsContent value="income-expense" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Income vs. Expenses</CardTitle>
              <CardDescription>
                Monthly comparison over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-10 text-muted-foreground">
                  Loading data...
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead>Income</TableHead>
                        <TableHead>Expenses</TableHead>
                        <TableHead>Net</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlySummary.map((month) => (
                        <TableRow key={month.month}>
                          <TableCell className="font-medium">{formatMonth(month.month)}</TableCell>
                          <TableCell className="text-green-600">{formatCurrency(month.income)}</TableCell>
                          <TableCell className="text-destructive">{formatCurrency(month.expenses)}</TableCell>
                          <TableCell className={month.net >= 0 ? 'text-green-600' : 'text-destructive'}>
                            {formatCurrency(month.net)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <div className="w-full flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Average Monthly Savings: {formatCurrency(totalNet / monthlySummary.length)}
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
          
          {/* Placeholder for income vs expense chart */}
          <Card className="h-[300px] flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Income vs. Expense Bar Chart<br />
                <span className="text-xs">(Visualization would render here)</span>
              </p>
            </div>
          </Card>
        </TabsContent>
        
        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Balance Trends</CardTitle>
              <CardDescription>
                How your account balances are changing
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-10 text-muted-foreground">
                  Loading data...
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead>Current Balance</TableHead>
                        <TableHead>30-Day Trend</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accountBalances.map((account) => (
                        <TableRow key={account.account}>
                          <TableCell className="font-medium">{account.account}</TableCell>
                          <TableCell className={account.balance < 0 ? 'text-destructive' : ''}>
                            {formatCurrency(account.balance)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {getTrendIcon(account.trend)}
                              <span className={`ml-1 ${account.trend > 0 ? 'text-green-600' : account.trend < 0 ? 'text-destructive' : ''}`}>
                                {formatPercentage(Math.abs(account.trend))}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <div className="w-full flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Total Balance: {formatCurrency(accountBalances.reduce((sum, account) => sum + account.balance, 0))}
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" /> Customize View
                </Button>
              </div>
            </CardFooter>
          </Card>
          
          {/* Placeholder for trend chart */}
          <Card className="h-[300px] flex items-center justify-center">
            <div className="text-center">
              <LineChart className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Balance Trend Chart<br />
                <span className="text-xs">(Visualization would render here)</span>
              </p>
            </div>
          </Card>
        </TabsContent>
        
        {/* Net Worth Tab */}
        <TabsContent value="net-worth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Net Worth Summary</CardTitle>
              <CardDescription>
                Assets minus liabilities over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10">
                <PlusCircle className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Create your first net worth tracker</h3>
                <p className="text-sm text-muted-foreground mt-2 mb-4">
                  Track your complete financial picture by including assets and liabilities
                </p>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" /> Set Up Net Worth Tracking
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-between items-center">
        <Button variant="outline">
          <Share2 className="mr-2 h-4 w-4" /> Share Reports
        </Button>
        <Button>
          <ArrowRight className="mr-2 h-4 w-4" /> View All Reports
        </Button>
      </div>
    </div>
  );
} 