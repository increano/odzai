'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import TransactionsPage from '../page'

export default function AccountTransactionsPage() {
  const params = useParams();
  const accountId = params.accountId as string;
  
  return <TransactionsPage defaultAccountId={accountId} />;
} 