'use client'

import { DashboardLayout, DashboardContent } from '@/components/dashboard-layout';
import { Target, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkspaceRequired } from '@/components/workspace-required';

export default function GoalsPage() {
  const content = (
    <DashboardLayout>
      <DashboardContent 
        title="Financial Goals" 
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Goal
          </Button>
        }
      >
        <div className="rounded-lg border p-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="rounded-full bg-primary/10 p-6">
              <Target className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Set Your Financial Goals</h2>
            <p className="max-w-md text-muted-foreground">
              Define and track your financial goals. Whether you're saving for a vacation, paying off debt, or building an emergency fund, goals help you stay focused.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border p-4 text-left">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Emergency Fund</h3>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">In Progress</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span>$4,500 of $10,000</span>
                  <span>45%</span>
                </div>
              </div>
              <div className="rounded-lg border p-4 text-left">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">New Car</h3>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">In Progress</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '25%' }}></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span>$5,000 of $20,000</span>
                  <span>25%</span>
                </div>
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