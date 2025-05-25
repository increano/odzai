'use client'

import { DollarSign, Wallet, Building2 } from 'lucide-react'
import { DashboardLayout, DashboardContent } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Workspace, UserPreferences } from '@/lib/supabase/workspace'
import { User } from '@supabase/supabase-js'

const budgetCategories = [
  { name: 'Housing', allocated: 1500, spent: 1450, remaining: 50, percent: 97 },
  { name: 'Food', allocated: 800, spent: 650, remaining: 150, percent: 81 },
  { name: 'Transportation', allocated: 400, spent: 380, remaining: 20, percent: 95 },
  { name: 'Utilities', allocated: 350, spent: 320, remaining: 30, percent: 91 },
  { name: 'Entertainment', allocated: 300, spent: 210, remaining: 90, percent: 70 },
  { name: 'Healthcare', allocated: 200, spent: 50, remaining: 150, percent: 25 },
  { name: 'Savings', allocated: 700, spent: 700, remaining: 0, percent: 100 },
  { name: 'Miscellaneous', allocated: 250, spent: 180, remaining: 70, percent: 72 },
]

interface BudgetContentProps {
  user: User;
  workspaces: Workspace[];
  defaultWorkspace: Workspace;
  preferences: UserPreferences | null;
}

export function BudgetContent({ user, workspaces, defaultWorkspace, preferences }: BudgetContentProps) {
  return (
    <DashboardLayout>
      <DashboardContent title="Budget">
        <div className="grid gap-6">
          {/* Workspace Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Current Workspace
              </CardTitle>
              <CardDescription>
                You have access to {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{defaultWorkspace.display_name || defaultWorkspace.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Personal Finance Workspace
                  </p>
                </div>
                <div className="flex gap-2">
                  {defaultWorkspace.color && (
                    <div 
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: defaultWorkspace.color }}
                    />
                  )}
                  <Badge variant="secondary">
                    Active
                  </Badge>
                </div>
              </div>
              {workspaces.length > 1 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Other workspaces:</p>
                  <div className="flex flex-wrap gap-2">
                    {workspaces
                      .filter(w => w.id !== defaultWorkspace.id)
                      .map(workspace => (
                        <Badge key={workspace.id} variant="outline" className="text-xs">
                          {workspace.display_name || workspace.name}
                        </Badge>
                      ))
                    }
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Budget Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Budget Summary</CardTitle>
              <CardDescription>
                Current month budget breakdown for {defaultWorkspace.display_name || defaultWorkspace.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 rounded-lg bg-muted p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Wallet className="mr-2 h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Total Budget</span>
                  </div>
                  <span className="font-bold">$4,500.00</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSign className="mr-2 h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Spent So Far</span>
                  </div>
                  <span className="font-bold">$2,340.50</span>
                </div>
              </div>
              <div className="space-y-4">
                {budgetCategories.map((category) => (
                  <div key={category.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{category.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">${category.spent} of ${category.allocated}</span>
                        <span className="text-xs font-medium">{category.percent}%</span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div 
                        className={`h-full ${category.percent > 90 ? 'bg-red-500' : category.percent > 75 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                        style={{ width: `${category.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardContent>
    </DashboardLayout>
  );
} 