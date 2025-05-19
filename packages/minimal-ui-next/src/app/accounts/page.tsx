'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { CreditCard, Building, Wallet, Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useWorkspace } from '@/components/WorkspaceProvider'
import { CreateAccountDialog } from '@/components/accounts/create-account-dialog'
import { toast } from 'sonner'
import { SettingsModal } from '@/components/accounts/SettingsModal'
import BankSyncPanel from '@/components/accounts/BankSyncPanel'

// Define the Account interface to match API response
interface Account {
  id: string;
  name: string;
  type?: string;
  budget_category?: string;
  calculated_balance: number;
  externalId?: string; // GoCardless account ID
  isConnected?: boolean; // Whether this is a connected bank account
}

// Client-side component that fetches account data
export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { isWorkspaceLoaded, currentWorkspace, isDefaultWorkspace } = useWorkspace();
  const isNewWorkspace = !isDefaultWorkspace && isWorkspaceLoaded;

  // Auto-open account creation dialog for new workspaces with no accounts
  useEffect(() => {
    if (isNewWorkspace && !isLoading && accounts.length === 0) {
      setIsDialogOpen(true);
    }
  }, [isNewWorkspace, isLoading, accounts.length]);

  // Function to fetch accounts
  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      
      // Check if there's a workspace ID to include in the request
      const workspaceId = currentWorkspace?.id || '';
      
      console.log('Fetching accounts for workspace:', workspaceId);
      
      // Adjust the API URL based on whether we have a workspace ID
      const apiUrl = workspaceId 
      ? `/api/accounts?workspaceId=${encodeURIComponent(workspaceId)}`
      : '/api/accounts';
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }
      
      const data = await response.json();
      console.log('Fetched accounts:', data);
      console.log('Accounts array type:', Array.isArray(data) ? 'array' : typeof data);
      console.log('Accounts length:', Array.isArray(data) ? data.length : 'not an array');
      
      // Handle different response formats
      if (Array.isArray(data)) {
        // Direct array of accounts
        setAccounts(data);
      } else if (data && typeof data === 'object' && Array.isArray(data.accounts)) {
        // Handle case where accounts are nested in an object
        console.log('Found nested accounts array with length:', data.accounts.length);
        setAccounts(data.accounts);
      } else {
        // Fallback to empty array if data structure is unexpected
        setAccounts([]);
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
      toast.error('Failed to load accounts');
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch accounts when the component mounts
  useEffect(() => {
    fetchAccounts();
  }, [currentWorkspace]);

  // Helper to determine icon based on account type or name
  const getAccountIcon = (account: Account) => {
    const name = account.name.toLowerCase();
    
    if (name.includes('cash') || name.includes('wallet')) {
      return Wallet;
    } else if (name.includes('savings') || name.includes('investment')) {
      return Building;
    }
    
    // Default to CreditCard for checking and other accounts
    return CreditCard;
  };

  // Function to handle adding a new account
  const handleAddAccount = () => {
    setIsDialogOpen(true);
  };

  // Function to navigate to transactions page for an account
  const viewTransactions = (accountId: string) => {
    router.push(`/transactions/${accountId}`);
  };

  // Filter for connected bank accounts
  const connectedAccounts = accounts.filter(account => account.isConnected && account.externalId);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
          </div>
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">No Accounts Found</h2>
          <p className="text-gray-600 text-sm max-w-md mx-auto mb-6">
            {isNewWorkspace 
            ? "Welcome to your new workspace! To get started, add your first account."
            : "You don't have any accounts in this workspace yet. Add an account to start tracking your finances."}
          </p>
          <Button size="lg" onClick={handleAddAccount}>
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Account
          </Button>
          
          <div className="mt-12 p-6 bg-gray-50 rounded-lg max-w-lg mx-auto">
            <h3 className="font-medium mb-2">About Workspaces</h3>
            <p className="text-sm text-gray-600 mb-4">
              A workspace is where you manage a set of related accounts, budgets, and transactions.
              Create your first account to start budgeting.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold">
                  Accounts
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage your financial accounts
                </p>
              </div>
              <Button onClick={handleAddAccount}>Add Account</Button>
            </div>
            
            {/* Show bank sync panel if there are connected accounts */}
            {connectedAccounts.length > 0 && (
              <div className="mb-8">
                <BankSyncPanel 
                  connectedAccounts={connectedAccounts}
                  onSyncComplete={fetchAccounts}
                />
              </div>
            )}

            {isLoading ? (
              <p>Loading accounts...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          </div>
        </div>
      )}
      
      {/* Account Creation Dialog */}
      <CreateAccountDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={fetchAccounts}
      />
      
      {/* Settings Modal (for managing accounts) */}
      <SettingsModal 
        open={isSettingsOpen} 
        onOpenChange={setIsSettingsOpen} 
      />
    </div>
  );
} 