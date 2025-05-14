import { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Accounts | Odzai',
  description: 'Manage your financial accounts',
};

export default function AccountsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
} 