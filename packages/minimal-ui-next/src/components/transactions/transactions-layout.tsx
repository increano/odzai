'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { DashboardLayout, DashboardContent } from '@/components/dashboard-layout'
import { Plus, ChevronDown } from 'lucide-react'
import { WorkspaceRequired } from '@/components/workspace-required'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'

interface Account {
  id: string
  name: string
}

interface TransactionsLayoutProps {
  children: React.ReactNode
  accountId?: string
  accountName?: string
  actions?: React.ReactNode
  accounts?: Account[]
}

export function TransactionsLayout({ 
  children, 
  accountId, 
  accountName,
  actions,
  accounts = []
}: TransactionsLayoutProps) {
  const router = useRouter();
  
  // Function to handle creating a new transaction
  const handleAddTransaction = () => {
    // This will be implemented to open the add transaction modal
    console.log('Add transaction clicked')
  }

  // Handle account selection
  const handleAccountSelect = (accountId: string) => {
    router.push(`/transactions/${accountId}`);
  }

  // Handle showing all transactions
  const handleShowAllTransactions = () => {
    router.push('/transactions');
  }

  // Determine the title based on whether we're viewing all transactions or account-specific ones
  const baseTitle = accountId ? 'Transactions' : 'All Transactions'
  
  // Create the account selector component if we have accounts available
  const accountSelector = accounts.length > 0 ? (
    <div className="flex items-center">
      <span className="mr-2">{baseTitle}:</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-1">
            {accountName || accountId || 'Unknown Account'}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[200px]">
          <DropdownMenuItem 
            onClick={handleShowAllTransactions}
            className="cursor-pointer"
          >
            All Accounts
          </DropdownMenuItem>
          {accounts.map(account => (
            <DropdownMenuItem 
              key={account.id} 
              onClick={() => handleAccountSelect(account.id)}
              className={`cursor-pointer ${account.id === accountId ? 'bg-muted' : ''}`}
            >
              {account.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ) : (
    // Fallback if no accounts available
    <span>{baseTitle}: {accountName || accountId || 'Unknown Account'}</span>
  );
  
  const subtitle = accountId 
    ? 'View and manage transactions for this account' 
    : 'View and manage all your transactions'

  // Use provided actions or fall back to default
  const headerActions = actions || (
    <Button onClick={handleAddTransaction}>
      <Plus className="h-4 w-4 mr-2" />
      Add Transaction
    </Button>
  )

  return (
    <WorkspaceRequired>
      <DashboardLayout>
        <DashboardContent 
          title={accountSelector}
          subtitle={subtitle}
          actions={headerActions}
        >
          {children}
        </DashboardContent>
      </DashboardLayout>
    </WorkspaceRequired>
  )
} 