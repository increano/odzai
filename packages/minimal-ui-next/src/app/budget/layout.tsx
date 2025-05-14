import { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Budget | Odzai',
  description: 'View and manage your budget categories',
};

export default function BudgetLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
} 