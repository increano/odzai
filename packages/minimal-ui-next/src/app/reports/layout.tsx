import { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Reports | Odzai',
  description: 'View and analyze your financial reports',
};

export default function ReportsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
} 