'use client'

import { TransactionsPageComponent } from '@/components/transactions/transactions-page-component'
import { WorkspaceRequired } from '@/components/workspace-required'

export default function TransactionsPage() {
  return (
    <WorkspaceRequired>
      <TransactionsPageComponent />
    </WorkspaceRequired>
  );
} 