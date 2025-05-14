'use client'

import { CreditCard, DollarSign, Wallet, Building, ArrowUpRight, ArrowDownRight, PlusCircle } from 'lucide-react'
import { DashboardLayout, DashboardContent } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CreateAccountDialog } from '@/components/accounts/create-account-dialog'
import { WorkspaceRequired } from '@/components/workspace-required'

// Define the Account interface to match API response
interface Account {
  id: string;
  name: string;
  calculated_balance: number;
  budget_category: string;
  offbudget: boolean;
  closed: boolean;
}

// Client-side component that fetches account data
export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const searchParams = useSearchParams();
  const isNewWorkspace = searchParams.get('empty') === 'true';
  
  // If it's a new workspace, automatically open the create dialog
  useEffect(() => {
    if (isNewWorkspace && !isLoading && accounts.length === 0) {
      setIsCreateDialogOpen(true);
    }
  }, [isNewWorkspace, isLoading, accounts.length]);

  // Function to fetch accounts
  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/accounts');
      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }
      const data = await response.json();
      console.log('Fetched accounts:', data);
      setAccounts(data);
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Helper to determine icon based on account type or name
  const getAccountIcon = (account: Account) => {
    const name = account.name.toLowerCase();
    
    if (name.includes('credit')) return CreditCard;
    if (name.includes('saving')) return Building;
    if (name.includes('invest')) return Wallet;
    
    // Default to CreditCard for checking and other accounts
    return CreditCard;
  };

  // Function to handle adding a new account
  const handleAddAccount = () => {
    setIsCreateDialogOpen(true);
  };
  
  // Function to navigate to transactions page for an account
  const viewTransactions = (accountId: string) => {
    router.push(`/transactions/${accountId}`);
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4 max-w-md mx-auto">
      <div className="text-center mb-8">
        <PlusCircle className="h-16 w-16 text-muted-foreground mb-4 mx-auto" />
        <h2 className="text-2xl font-bold mb-2">No Accounts Found</h2>
        <p className="text-muted-foreground mb-6">
          {isNewWorkspace 
            ? "Welcome to your new workspace! To get started, add your first account." 
            : "You don't have any accounts in this workspace yet. Add an account to start tracking your finances."}
        </p>
        <Button size="lg" onClick={handleAddAccount}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Your First Account
        </Button>
      </div>
      
      {isNewWorkspace && (
        <Alert className="mt-6">
          <AlertTitle>Welcome to your new workspace!</AlertTitle>
          <AlertDescription>
            A workspace is where you manage a set of related accounts, budgets, and transactions.
            Create your first account to start budgeting.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const content = (
    <DashboardLayout>
      <DashboardContent 
        title="Accounts"
        actions={<Button onClick={handleAddAccount}>Add Account</Button>}
      >
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="inline-block mx-auto mb-3 opacity-70">
                {/* Add a loading spinner animation here if desired */}
              </div>
              <p>Loading accounts...</p>
            </div>
          </div>
        ) : error ? (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : accounts.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => {
              const Icon = getAccountIcon(account);
              return (
                <Card key={account.id} className="overflow-hidden">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="rounded-full bg-muted p-2">
                          <Icon className="h-4 w-4" />
                        </div>
                        <CardTitle className="text-base">{account.name}</CardTitle>
                      </div>
                      <div className="flex items-center">
                        {account.calculated_balance >= 0 ? (
                          <ArrowUpRight className="mr-1 h-4 w-4 text-emerald-500" />
                        ) : (
                          <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
                        )}
                        <span className="text-xs font-medium">
                          ${Math.abs(account.calculated_balance / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="text-muted-foreground text-xs mb-2">{account.budget_category}</div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">
                          ${(account.calculated_balance / 100).toFixed(2)}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Current Balance
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => viewTransactions(account.id)}
                      >
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        
        {/* Account Creation Dialog */}
        <CreateAccountDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSuccess={fetchAccounts}
        />
      </DashboardContent>
    </DashboardLayout>
  );

  return (
    <WorkspaceRequired>
      {content}
    </WorkspaceRequired>
  );
} 