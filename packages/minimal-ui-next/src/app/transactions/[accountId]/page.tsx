'use client'

import { useParams } from 'next/navigation'
import { TransactionsPageComponent } from '@/components/transactions/transactions-page-component'

export default function AccountTransactionsPage() {
  const params = useParams();
  const accountId = params.accountId as string;
  
  return <TransactionsPageComponent defaultAccountId={accountId} />;
} 