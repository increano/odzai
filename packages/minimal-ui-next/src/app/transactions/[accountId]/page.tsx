'use client'

import { useParams } from 'next/navigation'
import { TransactionsPageComponent } from '@/components/transactions/transactions-page-component'
import { WorkspaceRequired } from '@/components/workspace-required'

export default function AccountTransactionsPage() {
  const params = useParams();
  const accountId = params.accountId as string;
  
  return (
    <WorkspaceRequired>
      <TransactionsPageComponent defaultAccountId={accountId} />
    </WorkspaceRequired>
  );
} 