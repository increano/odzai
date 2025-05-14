'use client'

import { DashboardLayout, DashboardContent } from '@/components/dashboard-layout';
import { Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkspaceRequired } from '@/components/workspace-required';

export default function SchedulesPage() {
  const content = (
    <DashboardLayout>
      <DashboardContent 
        title="Scheduled Transactions" 
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Schedule
          </Button>
        }
      >
        <div className="rounded-lg border p-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="rounded-full bg-primary/10 p-6">
              <Calendar className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Manage Recurring Transactions</h2>
            <p className="max-w-md text-muted-foreground">
              Set up and manage your recurring transactions. Never miss a bill payment, subscription, or regular deposit again.
            </p>
            <div className="mt-4 w-full max-w-3xl">
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="whitespace-nowrap p-3 text-left font-medium text-muted-foreground">Description</th>
                      <th className="whitespace-nowrap p-3 text-left font-medium text-muted-foreground">Amount</th>
                      <th className="whitespace-nowrap p-3 text-left font-medium text-muted-foreground">Frequency</th>
                      <th className="whitespace-nowrap p-3 text-left font-medium text-muted-foreground">Next Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="p-3">Rent Payment</td>
                      <td className="p-3 text-red-500">-$1,500.00</td>
                      <td className="p-3">Monthly</td>
                      <td className="p-3">Jun 1, 2023</td>
                    </tr>
                    <tr className="border-t">
                      <td className="p-3">Salary Deposit</td>
                      <td className="p-3 text-green-500">+$4,250.00</td>
                      <td className="p-3">Bi-weekly</td>
                      <td className="p-3">May 15, 2023</td>
                    </tr>
                    <tr className="border-t">
                      <td className="p-3">Netflix Subscription</td>
                      <td className="p-3 text-red-500">-$14.99</td>
                      <td className="p-3">Monthly</td>
                      <td className="p-3">May 22, 2023</td>
                    </tr>
                  </tbody>
                </table>
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