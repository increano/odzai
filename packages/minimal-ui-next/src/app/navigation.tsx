'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function MainNav() {
  const pathname = usePathname();

  return (
    <div className="mr-4 flex">
      <Link href="/" className="mr-6 flex items-center space-x-2">
        <span className="font-bold">Odzai</span>
      </Link>
      <nav className="flex items-center space-x-4 lg:space-x-6">
        <Button asChild variant={pathname === '/' ? 'default' : 'ghost'} className="h-9">
          <Link href="/">Home</Link>
        </Button>
        <Button asChild variant={pathname === '/budgets' ? 'default' : 'ghost'} className="h-9">
          <Link href="/budgets">Budgets</Link>
        </Button>
        <Button asChild variant={pathname === '/accounts' ? 'default' : 'ghost'} className="h-9">
          <Link href="/accounts">Accounts</Link>
        </Button>
        <Button asChild variant={pathname === '/transactions' ? 'default' : 'ghost'} className="h-9">
          <Link href="/transactions">Transactions</Link>
        </Button>
        <Button asChild variant={pathname === '/budget' ? 'default' : 'ghost'} className="h-9">
          <Link href="/budget">Budget</Link>
        </Button>
      </nav>
    </div>
  );
} 