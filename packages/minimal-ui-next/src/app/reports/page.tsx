'use client'

import { DashboardLayout, DashboardContent } from '@/components/dashboard-layout';
import { BarChart2 } from 'lucide-react';
import { WorkspaceRequired } from '@/components/workspace-required';

export default function ReportsPage() {
  const content = (
    <DashboardLayout>
      <DashboardContent title="Reports">
        <div className="rounded-lg border p-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="rounded-full bg-primary/10 p-6">
              <BarChart2 className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Financial Reports</h2>
            <p className="max-w-md text-muted-foreground">
              Track your financial progress with detailed reports and visualizations. Analyze your spending patterns, income trends, and budget performance.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div className="rounded-lg border p-4 text-center">
                <h3 className="font-medium">Spending by Category</h3>
                <p className="text-sm text-muted-foreground">See where your money goes</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <h3 className="font-medium">Income vs Expenses</h3>
                <p className="text-sm text-muted-foreground">Track your cash flow</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <h3 className="font-medium">Budget Performance</h3>
                <p className="text-sm text-muted-foreground">Measure your budget success</p>
              </div>
            </div>
          </div>
        </div>
      </DashboardContent>
    </DashboardLayout>
  );

  return (
    <WorkspaceRequired>
      {content}
    </WorkspaceRequired>
  );
} 