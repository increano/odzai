'use client'

import { DashboardLayout, DashboardContent } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Workspace, UserPreferences } from '@/lib/supabase/workspace';
import { User } from '@supabase/supabase-js';
import { 
  BarChart2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  PieChart,
  LineChart,
  Download,
  Filter,
  RefreshCw,
  Building2
} from 'lucide-react';

interface AnalyticsContentProps {
  user: User;
  workspaces: Workspace[];
  defaultWorkspace: Workspace;
  preferences: UserPreferences | null;
}

export function AnalyticsContent({ user, workspaces, defaultWorkspace, preferences }: AnalyticsContentProps) {
  return (
    <DashboardLayout>
      <DashboardContent 
        title="Analytics" 
        subtitle="Detailed insights into your financial data"
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        }
      >
        <div className="grid gap-6">
          {/* Workspace Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Analytics for {defaultWorkspace.display_name || defaultWorkspace.name}
              </CardTitle>
              <CardDescription>
                Financial insights and trends for your workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div 
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-medium text-sm"
                  style={{ backgroundColor: defaultWorkspace.color || '#FF7043' }}
                >
                  {(defaultWorkspace.display_name || defaultWorkspace.name).charAt(0)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Data period: Last 12 months
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Monthly Income</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$11,847.23</div>
                <p className="text-xs text-muted-foreground">
                  <span className="inline-flex items-center text-green-600">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +15.2%
                  </span>
                  {" "}vs last year
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Monthly Expenses</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$8,234.56</div>
                <p className="text-xs text-muted-foreground">
                  <span className="inline-flex items-center text-red-600">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +8.7%
                  </span>
                  {" "}vs last year
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">30.5%</div>
                <p className="text-xs text-muted-foreground">
                  <span className="inline-flex items-center text-green-600">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +4.2%
                  </span>
                  {" "}vs last year
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Worth Growth</CardTitle>
                <BarChart2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$43,267.89</div>
                <p className="text-xs text-muted-foreground">
                  <span className="inline-flex items-center text-green-600">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +22.8%
                  </span>
                  {" "}vs last year
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Income vs Expenses Trend
                </CardTitle>
                <CardDescription>
                  Monthly comparison over the last 12 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] rounded-md border border-dashed border-muted-foreground/25 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <LineChart className="h-12 w-12 mx-auto mb-4" />
                    <p className="text-sm">Line chart visualization will be here</p>
                    <p className="text-xs mt-1">Income vs Expenses over time</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Expense Categories
                </CardTitle>
                <CardDescription>
                  Breakdown of spending by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] rounded-md border border-dashed border-muted-foreground/25 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <PieChart className="h-12 w-12 mx-auto mb-4" />
                    <p className="text-sm">Pie chart visualization will be here</p>
                    <p className="text-xs mt-1">Expense category breakdown</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Spending Categories</CardTitle>
                <CardDescription>
                  Your highest expense categories this month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500" />
                      <span className="text-sm font-medium">Housing</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">$2,450.00</div>
                      <div className="text-xs text-muted-foreground">32.1%</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-blue-500" />
                      <span className="text-sm font-medium">Food & Dining</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">$1,234.56</div>
                      <div className="text-xs text-muted-foreground">16.2%</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                      <span className="text-sm font-medium">Transportation</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">$876.43</div>
                      <div className="text-xs text-muted-foreground">11.5%</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-yellow-500" />
                      <span className="text-sm font-medium">Utilities</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">$543.21</div>
                      <div className="text-xs text-muted-foreground">7.1%</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-purple-500" />
                      <span className="text-sm font-medium">Entertainment</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">$432.10</div>
                      <div className="text-xs text-muted-foreground">5.7%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
                <CardDescription>
                  Comparison with previous months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">This Month</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Current</Badge>
                      <span className="text-sm font-medium">$8,945.67</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last Month</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-green-600 flex items-center">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        -5.2%
                      </span>
                      <span className="text-sm">$8,567.23</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">3 Months Ago</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-600 flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +12.3%
                      </span>
                      <span className="text-sm">$7,967.45</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">6 Months Ago</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-green-600 flex items-center">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        -8.7%
                      </span>
                      <span className="text-sm">$8,234.12</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">12 Months Ago</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-600 flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +15.8%
                      </span>
                      <span className="text-sm">$7,723.89</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Health Score */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Health Score</CardTitle>
              <CardDescription>
                Based on your spending patterns, savings rate, and financial goals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Overall Score</span>
                    <span className="text-2xl font-bold text-green-600">85/100</span>
                  </div>
                  <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: '85%' }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Excellent financial health! Keep up the good work.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-xs">Savings Rate: Excellent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-xs">Budget Adherence: Good</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-yellow-500" />
                    <span className="text-xs">Emergency Fund: Fair</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-xs">Debt Management: Excellent</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="text-sm font-medium mb-2">Recommendations</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Consider increasing your emergency fund to 6 months of expenses</li>
                  <li>• You're doing great with savings! Consider investing surplus funds</li>
                  <li>• Review your entertainment budget - it's slightly above average</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardContent>
    </DashboardLayout>
  );
} 