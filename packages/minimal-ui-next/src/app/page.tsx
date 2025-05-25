// Server Component - Dashboard Home Page
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { loadUserWorkspaceData } from '@/lib/supabase/workspace';
import { WorkspaceProvider } from '@/components/providers/WorkspaceProvider';
import { DashboardLayout, DashboardContent } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Receipt,
  Target,
  Building2,
  Clock,
  Bell,
  Calendar
} from 'lucide-react';

export default async function HomePage() {
  const supabase = createClient();
  
  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  // Check if user has completed onboarding
  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('data')
    .eq('user_id', user.id)
    .single();
  
  const onboardingCompleted = preferences?.data?.onboarding?.completed;
  
  if (!onboardingCompleted) {
    redirect('/onboarding/welcome');
  }

  // Load user workspace data
  const workspaceData = await loadUserWorkspaceData(user.id);

  // If user has no workspaces, redirect to workspace creation
  if (!workspaceData.hasWorkspaces) {
    redirect('/onboarding/workspace');
  }

  // If no default workspace is set, redirect to workspace selection
  if (!workspaceData.defaultWorkspace) {
    redirect('/onboarding/workspace');
  }

  // Mock financial data (in a real app, this would come from your financial API)
  const financialSummary = {
    totalBalance: 12450.75,
    monthlyIncome: 5200.00,
    monthlyExpenses: 3850.25,
    savingsGoal: 15000.00,
    currentSavings: 8750.50,
    accountsCount: 4,
    transactionsThisMonth: 127,
    budgetUtilization: 74
  };

  const recentTransactions = [
    { id: 1, description: "Grocery Store", amount: -85.32, date: "2024-01-15", category: "Food" },
    { id: 2, description: "Salary Deposit", amount: 2600.00, date: "2024-01-15", category: "Income" },
    { id: 3, description: "Electric Bill", amount: -120.45, date: "2024-01-14", category: "Utilities" },
    { id: 4, description: "Coffee Shop", amount: -4.75, date: "2024-01-14", category: "Food" },
    { id: 5, description: "Gas Station", amount: -45.20, date: "2024-01-13", category: "Transportation" }
  ];

  const upcomingTransactions = [
    { id: 1, description: "Rent Payment", amount: -1200.00, dueDate: "2024-01-20", category: "Housing", type: "recurring" },
    { id: 2, description: "Internet Bill", amount: -79.99, dueDate: "2024-01-22", category: "Utilities", type: "recurring" },
    { id: 3, description: "Car Insurance", amount: -150.00, dueDate: "2024-01-25", category: "Insurance", type: "recurring" },
    { id: 4, description: "Gym Membership", amount: -29.99, dueDate: "2024-01-28", category: "Health", type: "recurring" }
  ];

  const notifications = [
    { id: 1, title: "Budget Alert", message: "You've spent 80% of your food budget this month", type: "warning", time: "2 hours ago" },
    { id: 2, title: "Payment Reminder", message: "Rent payment due in 3 days", type: "info", time: "1 day ago" },
    { id: 3, title: "Goal Achievement", message: "Congratulations! You've reached 60% of your savings goal", type: "success", time: "2 days ago" },
    { id: 4, title: "Account Update", message: "New transaction detected in your checking account", type: "info", time: "3 days ago" }
  ];

  return (
    <WorkspaceProvider
      initialWorkspaces={workspaceData.workspaces}
      initialCurrentWorkspace={workspaceData.defaultWorkspace}
      initialPreferences={workspaceData.preferences}
    >
      <DashboardLayout>
        <DashboardContent title="Financial Dashboard" subtitle="Welcome back! Here's your financial overview.">
          {/* Workspace Info */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="h-10 w-10 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: workspaceData.defaultWorkspace.color || '#FF7043' }}
                  >
                    {workspaceData.defaultWorkspace.name.charAt(0)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{workspaceData.defaultWorkspace.name}</CardTitle>
                    <CardDescription>
                      Active workspace • {workspaceData.workspaces.length} total workspace{workspaceData.workspaces.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {workspaceData.defaultWorkspace.access_level || 'Owner'}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Financial Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard
              title="Total Balance"
              value={`$${financialSummary.totalBalance.toLocaleString()}`}
              icon={<DollarSign className="h-5 w-5" />}
              trend={{
                value: 5.2,
                direction: 'up',
                label: 'vs last month'
              }}
            />
            
            <StatCard
              title="Monthly Income"
              value={`$${financialSummary.monthlyIncome.toLocaleString()}`}
              icon={<TrendingUp className="h-5 w-5" />}
              trend={{
                value: 2.1,
                direction: 'up'
              }}
            />
            
            <StatCard
              title="Monthly Expenses"
              value={`$${financialSummary.monthlyExpenses.toLocaleString()}`}
              icon={<TrendingDown className="h-5 w-5" />}
              trend={{
                value: -8.3,
                direction: 'down'
              }}
            />
            
            <StatCard
              title="Savings Progress"
              value={`${Math.round((financialSummary.currentSavings / financialSummary.savingsGoal) * 100)}%`}
              icon={<Target className="h-5 w-5" />}
              description={`$${financialSummary.currentSavings.toLocaleString()} of $${financialSummary.savingsGoal.toLocaleString()}`}
            />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Accounts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{financialSummary.accountsCount}</div>
                <p className="text-xs text-muted-foreground">Active accounts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{financialSummary.transactionsThisMonth}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Budget Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{financialSummary.budgetUtilization}%</div>
                <p className="text-xs text-muted-foreground">Of monthly budget</p>
              </CardContent>
            </Card>
          </div>

          {/* Financial Visualizations */}
          <div className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Financial Overview
                </CardTitle>
                <CardDescription>Spending trends and budget breakdown for comprehensive financial insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Spending Trends Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium">Spending Trends</h3>
                    </div>
                    <div className="h-[280px] flex items-center justify-center bg-muted/30 rounded-lg">
                      <div className="text-center">
                        <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Line chart visualization</p>
                        <p className="text-xs text-muted-foreground mt-1">Monthly spending over 6 months</p>
                      </div>
                    </div>
                  </div>

                  {/* Budget Breakdown Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium">Budget Breakdown</h3>
                    </div>
                    <div className="h-[280px] flex items-center justify-center bg-muted/30 rounded-lg">
                      <div className="text-center">
                        <Target className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Pie chart visualization</p>
                        <p className="text-xs text-muted-foreground mt-1">Spending by category</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Cards - Recent Transactions, Upcoming Transactions, and Notifications */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Recent Transactions
                </CardTitle>
                <CardDescription>Your latest financial activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentTransactions.slice(0, 4).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <span className="font-medium text-sm truncate flex-1">{transaction.description}</span>
                      <div className={`font-medium text-sm ml-2 ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Transactions
                </CardTitle>
                <CardDescription>Scheduled payments and bills</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {upcomingTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <span className="font-medium text-sm truncate flex-1">{transaction.description}</span>
                      <div className="flex items-center gap-2 ml-2">
                        <span className="text-xs text-muted-foreground">Due {transaction.dueDate}</span>
                        <span className="font-medium text-sm text-red-600">
                          ${Math.abs(transaction.amount).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
                <CardDescription>Important updates and alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="flex items-center gap-2 py-2 border-b last:border-b-0">
                      <div className={`h-2 w-2 rounded-full flex-shrink-0 ${
                        notification.type === 'warning' ? 'bg-yellow-500' :
                        notification.type === 'success' ? 'bg-green-500' :
                        'bg-blue-500'
                      }`}></div>
                      <span className="font-medium text-sm truncate flex-1">{notification.title}</span>
                      <span className="text-xs text-muted-foreground ml-2">{notification.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </DashboardContent>
      </DashboardLayout>
    </WorkspaceProvider>
  );
} 