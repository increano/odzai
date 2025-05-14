import { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Financial Goals | Odzai',
  description: 'Set and track your financial goals',
};

export default function GoalsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
} 