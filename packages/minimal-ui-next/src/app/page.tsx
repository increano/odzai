'use client'

import { PieChart, DollarSign, Wallet, CreditCard, TrendingDown } from 'lucide-react'
import { DashboardLayout, DashboardContent } from '@/components/dashboard-layout'
import { StatCard } from '@/components/ui/stat-card'
import { WorkspaceRequired } from '@/components/workspace-required'
import { useState } from 'react'
import { useWorkspace } from '@/components/WorkspaceProvider'

export default function HomePage() {
  const { isWorkspaceLoaded } = useWorkspace();
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  const testDefaultWorkspaceLoading = async () => {
    try {
      setDebugInfo('Testing default workspace loading...');
      
      // Try to load the default workspace
      const response = await fetch('/api/load-default-workspace');
      const data = await response.json();
      
      console.log('Debug test result:', data);
      setDebugInfo(JSON.stringify(data, null, 2));
      
      if (data.success) {
        // Force reload the page to apply the workspace
        window.location.reload();
      }
    } catch (error) {
      console.error('Error testing default workspace:', error);
      setDebugInfo(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const content = (
    <DashboardLayout>
      <DashboardContent title="Home">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Budget"
            value="$4,500.00"
            trend={{ value: 2.5, direction: 'up' }}
            description="Increased from last month"
            icon={<Wallet className="h-4 w-4" />}
          />
          <StatCard
            title="Spent This Month"
            value="$2,340.50"
            trend={{ value: 52, direction: 'neutral' }}
            description="52% of monthly budget"
            icon={<DollarSign className="h-4 w-4" />}
          />
          <StatCard
            title="Remaining Budget"
            value="$2,159.50"
            trend={{ value: 48, direction: 'neutral' }}
            description="48% remaining for this month"
            icon={<CreditCard className="h-4 w-4" />}
          />
          <StatCard
            title="Savings Rate"
            value="15.5%"
            trend={{ value: 3.2, direction: 'up' }}
            description="Up 3.2% from last month"
            icon={<TrendingDown className="h-4 w-4" />}
          />
        </div>
        
        <div className="mt-8">
          <div className="rounded-lg border">
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="text-2xl font-semibold leading-none tracking-tight">Monthly Spending Trends</h3>
              <p className="text-sm text-muted-foreground">
                Track your spending patterns over time
              </p>
            </div>
            <div className="p-6 pt-0">
              <div className="h-[300px] flex items-center justify-center rounded-md border border-dashed text-muted-foreground">
                <PieChart className="h-8 w-8" />
                <span className="ml-2">Spending Visualization</span>
              </div>
            </div>
            <div className="flex items-center p-6 pt-0">
              <div className="flex space-x-2">
                <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                  Last 3 months
                </button>
                <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                  Last 30 days
                </button>
                <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                  Last 7 days
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <button className="rounded-lg border p-4 text-left hover:bg-accent">
            <h3 className="font-semibold">Budget Categories</h3>
            <span className="ml-2 rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium">12</span>
          </button>
          <button className="rounded-lg border p-4 text-left hover:bg-accent">
            <h3 className="font-semibold">Recent Transactions</h3>
            <span className="ml-2 rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium">24</span>
          </button>
          <button className="rounded-lg border p-4 text-left hover:bg-accent">
            <h3 className="font-semibold">Scheduled Payments</h3>
            <span className="ml-2 rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium">3</span>
          </button>
          <button className="rounded-lg border p-4 text-left hover:bg-accent">
            <h3 className="font-semibold">Financial Goals</h3>
            <span className="ml-2 rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium">5</span>
          </button>
        </div>
      </DashboardContent>
    </DashboardLayout>
  );

  return (
    <WorkspaceRequired>
      {content}
      {!isWorkspaceLoaded && (
        <div className="mt-4">
          <button 
            onClick={testDefaultWorkspaceLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Debug: Test Default Workspace
          </button>
          {debugInfo && (
            <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto max-h-60 text-xs">
              {debugInfo}
            </pre>
          )}
        </div>
      )}
    </WorkspaceRequired>
  );
} 