'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { DashboardLayout, DashboardContent } from '@/components/dashboard-layout'
import { Plus } from 'lucide-react'
import { WorkspaceRequired } from '@/components/workspace-required'

interface TransactionsLayoutProps {
  children: React.ReactNode
  accountId?: string
  accountName?: string
}

export function TransactionsLayout({ children, accountId, accountName }: TransactionsLayoutProps) {
  // Function to handle creating a new transaction
  const handleAddTransaction = () => {
    // This will be implemented to open the add transaction modal
    console.log('Add transaction clicked')
  }

  // Determine the title based on whether we're viewing all transactions or account-specific ones
  const title = accountId ? `Transactions: ${accountName || accountId}` : 'Transactions'
  const subtitle = accountId 
    ? 'View and manage transactions for this account' 
    : 'View and manage all your transactions'

  // Actions for dashboard header
  const actions = (
    <Button onClick={handleAddTransaction}>
      <Plus className="h-4 w-4 mr-2" />
      Add Transaction
    </Button>
  )

  return (
    <WorkspaceRequired>
      <DashboardLayout>
        <DashboardContent 
          title={title}
          subtitle={subtitle}
          actions={actions}
        >
          {children}
        </DashboardContent>
      </DashboardLayout>
    </WorkspaceRequired>
  )
} 