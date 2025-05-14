import { Metadata } from 'next';
import BudgetsClient from './client';

export const metadata: Metadata = {
  title: 'Workspaces | Odzai',
  description: 'Manage your Odzai workspaces',
};

export default function BudgetsPage() {
  return (
    <BudgetsClient />
  );
} 