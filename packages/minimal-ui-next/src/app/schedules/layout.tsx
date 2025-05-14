import { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Scheduled Transactions | Odzai',
  description: 'Manage your recurring transactions and payments',
};

export default function SchedulesLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
} 