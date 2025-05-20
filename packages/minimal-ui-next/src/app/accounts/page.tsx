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
import { DashboardLayout, DashboardContent } from '@/components/dashboard-layout'
import { WorkspaceRequired } from '@/components/workspace-required'

// Define the Account interface to match API response
interface Account {
  id: string;
  name: string;
  type?: string;
  budget_category?: string;
  calculated_balance?: number;
  externalId?: string; // GoCardless account ID
  isConnected?: boolean; // Whether this is a connected bank account
  offbudget?: boolean; // Whether the account is off-budget
  numTransactions?: number;
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

  // Actions for dashboard header
  const actions = (
    <Button onClick={handleAddAccount}>Add Account</Button>
  );

  const content = (
    <DashboardLayout>
      <DashboardContent 
        title="Accounts" 
        subtitle="Manage your financial accounts"
        actions={actions}
      >
        {/* Show bank sync panel if there are connected accounts */}
        {connectedAccounts.length > 0 && (
          <div className="mb-6">
            <BankSyncPanel 
              connectedAccounts={connectedAccounts}
              onSyncComplete={fetchAccounts}
            />
          </div>
        )}

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
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => {
              const Icon = getAccountIcon(account);
              
              // Handle the balance formatting with proper error checking
              // Make sure to handle undefined or NaN values
              const balanceValue = typeof account.calculated_balance === 'number' ? account.calculated_balance : 0;
              const formattedBalance = (balanceValue / 100).toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              });
              
              // Properly determine if balance is positive
              const isPositive = balanceValue >= 0;
              
              // Format the change amount
              const changeAmount = Math.abs(balanceValue / 100).toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              });

              return (
                <Card key={account.id} className="overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-5 w-5 text-primary" />
                      <h3 className="font-medium">{account.name}</h3>
                    </div>
                    
                    <div className="flex items-center mb-4">
                      {isPositive ? (
                        <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm ml-1">
                        {changeAmount}
                      </span>
                    </div>
                    
                    <div className="mb-1 text-xs text-muted-foreground">
                      {account.budget_category || (account.offbudget ? 'Off Budget' : 'On Budget')}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">
                          {formattedBalance}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Current Balance
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => viewTransactions(account.id)}
                        variant="outline"
                        size="sm"
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </DashboardContent>
    </DashboardLayout>
  );

  return (
    <WorkspaceRequired>
      {content}
      
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
    </WorkspaceRequired>
  );
} 